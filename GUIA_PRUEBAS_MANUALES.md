# Guía de pruebas manuales (al final del proyecto)

Esta guía está pensada para ejecutar **todo junto** al terminar. Necesitas la API arrancada con una `DATABASE_URL` real y las migraciones + semillas aplicadas. Sustituye `http://localhost:3000` por tu URL de Render si ya desplegaste.

## 0. Comprobación rápida

```bash
curl http://localhost:3000/salud
# 200 {"estado":"ok"}

curl http://localhost:3000/no-existe
# 404 {"error":"Ruta no encontrada",...}
```

## 1. Login y roles

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@ejemplo.es","contrasena":"123456"}'
# 200 + {"token":"...","usuario":{... rol:"maestro"}}
```

Guarda el token:

```bash
export ANA="pega_aqui_el_jwt"
```

Repite con `boris@ejemplo.es` (plan pro) y `lucia@ejemplo.es` (alumna):

```bash
export BORIS="..."
export LUCIA="..."
```

Credenciales incorrectas:

```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@ejemplo.es","contrasena":"malisima"}'
# 401 credenciales_invalidas (mismo mensaje si el correo no existe)
```

## 2. Aislamiento entre maestros (el requisito más importante)

```bash
curl -i -H "Authorization: Bearer $ANA" http://localhost:3000/cursos
# 200: solo el curso 1

curl -i -H "Authorization: Bearer $BORIS" http://localhost:3000/cursos
# 200: solo el curso 2

curl -i -H "Authorization: Bearer $BORIS" http://localhost:3000/cursos/1
# 404 no_encontrado  <-- nunca 403

curl -i -X DELETE -H "Authorization: Bearer $BORIS" http://localhost:3000/cursos/1
# 404

curl -i -H "Authorization: Bearer $BORIS" http://localhost:3000/cursos/1/alumnos
# 404

curl -i -H "Authorization: Bearer $LUCIA" http://localhost:3000/cursos
# 403 sin_permiso (rol incorrecto)

curl -i http://localhost:3000/cursos
# 401 sin_token

curl -i -H "Authorization: Bearer $LUCIA" http://localhost:3000/mis-cursos
# 200: solo el curso 1
```

## 3. Registro y acceso directo (sin verificación)

Registra un maestro nuevo sin `RESEND_API_KEY`:

```bash
curl -i -X POST http://localhost:3000/auth/registro-maestro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Prueba","email":"prueba@ejemplo.es","contrasena":"12345678"}'
# 201 + { token, usuario } con email_verificado:true
```

Guarda el `token` de la respuesta y úsalo directamente:

```bash
curl -i -H "Authorization: Bearer EL_TOKEN_DEL_ALTA" http://localhost:3000/auth/yo
# 200

curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prueba@ejemplo.es","contrasena":"12345678"}'
# 200 (sin pasar por correo)
```

Los endpoints antiguos `/auth/verificar-correo` y `/auth/reenviar-verificacion` siguen existiendo por compatibilidad, pero ya no son obligatorios para entrar.

## 4. Cursos, alumnos y códigos

```bash
curl -i -X POST http://localhost:3000/cursos \
  -H "Authorization: Bearer $ANA" -H "Content-Type: application/json" \
  -d '{"nombre":"Ruso A2","idioma":"ruso","descripcion":"Nivel intermedio"}'
# 201 + codigo_invitacion de 7 caracteres

curl -i -X POST http://localhost:3000/cursos/1/regenerar-codigo -H "Authorization: Bearer $ANA"
# 200 + código distinto

curl -i -H "Authorization: Bearer $ANA" http://localhost:3000/cursos/1/alumnos
# 200: Lucía y Diego
```

El plan gratis de Ana permite 2 cursos:

```bash
curl -i -X POST http://localhost:3000/cursos \
  -H "Authorization: Bearer $ANA" -H "Content-Type: application/json" \
  -d '{"nombre":"Tercer curso","idioma":"ruso"}'
# 200 (llega a 2)

curl -i -X POST http://localhost:3000/cursos \
  -H "Authorization: Bearer $ANA" -H "Content-Type: application/json" \
  -d '{"nombre":"Curso de más","idioma":"ruso"}'
# 409 limite_plan
```

Registro de alumno por código (inscripción inmediata y sesión devuelta en la misma respuesta):

```bash
curl -i -X POST http://localhost:3000/auth/registro-alumno \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Nuevo","email":"nuevo@ejemplo.es","contrasena":"12345678","codigo_invitacion":"CODIGO_DEL_CURSO"}'
# 201
```

## 5. Lecciones, tarjetas y CSV

```bash
curl -i -H "Authorization: Bearer $LUCIA" http://localhost:3000/cursos/1/lecciones
# 200: solo lecciones publicadas

curl -i -H "Authorization: Bearer $ANA" http://localhost:3000/cursos/1/lecciones
# 200: incluye borradores

curl -i -X POST http://localhost:3000/cursos/1/lecciones \
  -H "Authorization: Bearer $ANA" -H "Content-Type: application/json" \
  -d '{"titulo":"Unidad 3","unidad_libro":"Unidad 3","publicada":true,"fecha_asignada":"2026-07-01T00:00:00Z"}'
# 201

curl -i -X POST http://localhost:3000/lecciones/1/tarjetas \
  -H "Authorization: Bearer $ANA" -H "Content-Type: application/json" \
  -d '{"palabra":"привет","transliteracion":"privet","traduccion":"hola","acento_posicion":4,"ejemplo_ruso":"Привет, Анна!"}'
# 201
```

CSV: crea `vocabulario.csv` en UTF-8 con cabeceras con acentos:

```csv
palabra,Transliteración,traducción,acento_posicion,ejemplo_ruso
спасибо,spasibo,gracias,2,"Спасибо, друг!"
```

```bash
curl -i -X POST http://localhost:3000/lecciones/1/importar-csv \
  -H "Authorization: Bearer $ANA" -F "archivo=@vocabulario.csv"
# 201 {"importadas":1,"omitidas":0,"razones":{...}}
```

Para probar los límites, genera un CSV con 501 filas: debe dar **400 csv_demasiadas_filas**. Un archivo de más de 1 MB debe dar **400 archivo_invalido**.

## 6. Repaso Leitner

```bash
curl -i -H "Authorization: Bearer $LUCIA" http://localhost:3000/cursos/1/repaso/hoy
# 200: tarjetas con proxima_revision <= hoy

curl -i -X POST http://localhost:3000/repaso/respuesta \
  -H "Authorization: Bearer $LUCIA" -H "Content-Type: application/json" \
  -d '{"tarjeta_id":3,"acerto":true}'
# 200 {"caja":4,"proxima_revision":"YYYY-MM-DD"}
```

Si aciertas, sube de caja (1→2→3→4→5) y espera 1, 2, 4, 7 o 15 días. Si fallas, vuelve a la caja 1 (mañana).

Y no se puede responder una tarjeta de otro curso:

```bash
curl -i -X POST http://localhost:3000/repaso/respuesta \
  -H "Authorization: Bearer $LUCIA" -H "Content-Type: application/json" \
  -d '{"tarjeta_id":9,"acerto":true}'
# 404 (la tarjeta 9 es del curso de Borís)
```

## 7. Quiz, XP y racha

```bash
curl -i -H "Authorization: Bearer $LUCIA" "http://localhost:3000/lecciones/1/quiz?cantidad=4"
# 200: 4 preguntas, 2 tipos, 4 opciones cada una

curl -i -X POST http://localhost:3000/quiz/resultado \
  -H "Authorization: Bearer $LUCIA" -H "Content-Type: application/json" \
  -d '{"leccion_id":1,"puntaje":4,"total":4}'
# 201 {"xp_ganado":60,"desglose":{"xpBase":40,"bonusPerfecto":20,"bonusRacha":0},...}

curl -i -H "Authorization: Bearer $LUCIA" http://localhost:3000/panel/alumno
# 200: xp, racha, nivel, cursos, quizzes, promedio, pendientes

curl -i -H "Authorization: Bearer $ANA" http://localhost:3000/panel/maestro
curl -i -H "Authorization: Bearer $ANA" http://localhost:3000/panel/maestro/reporte
curl -i -H "Authorization: Bearer $ANA" http://localhost:3000/panel/maestro/reporte-detallado
# 200: rendimiento por unidad, % de alumnos que repasó cada lección,
# top 10 de tarjetas más falladas y alumnos sin actividad en 7 días
```

## 8. Planes y Stripe (modo prueba)

```bash
curl -i -H "Authorization: Bearer $ANA" http://localhost:3000/mi-plan
# 200 {plan:"gratis", limites:{cursos:2,alumnos:10}, uso:{...}}

curl -i -X POST -H "Authorization: Bearer $ANA" http://localhost:3000/suscripcion/checkout
# 503 stripe_no_configurado si no pusiste las claves; si las pusiste, 200 + URL
```

Con Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/stripe/webhook
stripe trigger checkout.session.completed
```

Después de activar el evento:

```bash
curl -i -H "Authorization: Bearer $ANA" http://localhost:3000/mi-plan
# 200 {plan:"pro", limites:{cursos:null,alumnos:50},...}
```

Reenviar el **mismo** evento no debe cambiar nada (idempotencia).

## 9. Frontend

```bash
cd frontend && npm run dev
```

Recorre en el navegador: inicio → registro → verificación → login → panel maestro → crear curso → lecciones → tarjetas → importar CSV → planes → herramientas de ruso → cerrar sesión → login alumno → mis cursos → repaso → quiz → panel alumno. Comprueba que en móvil se vea bien y que los errores aparecen en rojo con `aria-live`.

## 10. Automático

```bash
cd backend && npm test && npm audit
cd frontend && npm test && npm run build
```

Todo debe pasar. La CI repite esto y además aplica las migraciones a PostgreSQL real.

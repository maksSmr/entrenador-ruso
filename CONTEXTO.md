# CONTEXTO — SaaS para maestros de idiomas

> Resumen vivo del proyecto. Fuente completa: `INSTRUCCIONES_COMPLETAS.md`. Tablero de avance: `PLAN.md`.

## 1. Producto

Plataforma SaaS para **maestros de idiomas**. El maestro se registra, crea cursos, sube lecciones y tarjetas, e invita a sus alumnos con un código. Los alumnos practican con flashcards, quizzes, audio y repaso espaciado (Leitner de 5 cajas), y ganan XP y racha diaria.

- Empieza centrada en **ruso para hispanohablantes**, pero sirve para cualquier idioma: el campo principal se llama **`palabra`**, no `ruso`.
- Herramientas específicas del cirílico: entrenador del alfabeto, acento tónico, teclado cirílico en pantalla y frases de ejemplo.
- Lecciones ligadas a las unidades del libro de texto del maestro.
- **Interfaz en español**.
- Planes **gratis** y **pro** con límites.
- Confirmación de correo obligatoria antes de entrar.

## 2. Stack

Node.js + Express (API REST) · PostgreSQL (Supabase/Neon) · JWT con roles `maestro`/`alumno` · React + Vite + React Router · Jest + React Testing Library · GitHub Actions · Resend (correo) · Stripe modo prueba. Todo en planes gratuitos.

## 3. Reglas

1. JavaScript moderno (ES6+), módulos ESM.
2. Nombres en español para tablas, rutas, columnas y variables de dominio.
3. UTF-8 en todo (cirílico). Zona horaria `America/Mexico_City` para "hoy".
4. bcrypt para contraseñas; hash SHA-256 para tokens de verificación.
5. Secretos **solo** en variables de entorno; `.env` ignorado por Git.
6. Validación en servidor con Zod; errores JSON uniformes.
7. **Aislamiento multi-tenant**: cada consulta filtra por maestro dueño o por curso inscrito. Si el recurso es de otro maestro se responde **404**, nunca 403.
8. Comentarios breves. Al terminar cada entrega: cómo probar + commit sugerido.

## 4. Estructura propuesta

```
entrenador-ruso/
├── CONTEXTO.md
├── INSTRUCCIONES_COMPLETAS.md
├── PLAN.md
├── .gitignore
├── backend/
│   ├── src/
│   │   ├── config/          entorno, baseDatos, planes, cors
│   │   ├── middlewares/     verificarToken, exigirRol, pertenencia, limites, errores, validar
│   │   ├── rutas/           auth, cursos, inscripciones, lecciones, tarjetas, repaso, quiz, panel, suscripcion, webhook
│   │   ├── controladores/   una capa delgada por recurso
│   │   ├── servicios/       lógica de negocio y acceso a datos
│   │   ├── utilidades/      esquemas Zod, tokens, fechas, Leitner, racha, quiz, correo
│   │   ├── app.js           app sin escuchar (para Jest)
│   │   └── server.js        arranque del puerto
│   ├── migraciones/         001..006 (SQL versionado)
│   ├── semillas/            datos de ejemplo
│   ├── pruebas/             Jest + supertest
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── atomos/          Boton, Campo, Insignia
    │   ├── moleculas/       TarjetaCurso, BarraProgreso
    │   ├── organismos/      Encabezado, FormularioLogin
    │   ├── paginas/         públicas, panel maestro, panel alumno, verificación
    │   ├── contexto/        AutenticacionContexto
    │   ├── servicios/       api.js
    │   ├── hooks/           useAutenticacion
    │   ├── rutas/           Rutas.jsx, RutaProtegida
    │   ├── utilidades/      cirilico, audio, equivalencias
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example         VITE_API_URL
    └── package.json
```

## 5. Modelo de datos (resumen)

`usuarios` · `cursos` · `inscripciones` · `lecciones` · `tarjetas` · `progreso_tarjetas` · `resultados_quiz` · `suscripciones` · `tokens_verificacion` · `eventos_stripe` · `respuestas_repaso` y las tablas de herramientas de ruso.

Cada curso pertenece a un maestro; cada alumno se inscribe mediante código; cada lección pertenece a un curso; cada tarjeta a una lección. El progreso y los resultados son por alumno. La suscripción es única por maestro. Los tokens de verificación pertenecen a un usuario.

## 6. Estado

Ver `PLAN.md` para el tablero completo. Estado actual:

- **Tandas 1 a 10 terminadas** (documentación, SQL, autenticación, cursos, lecciones/tarjetas/CSV, planes, Leitner, quiz/XP/racha, Stripe, frontend, pruebas y CI/CD).
- Backend: **52 pruebas Jest en verde** (13 suites). Frontend: **14 pruebas RTL/Jest en verde** (5 suites) y build de producción correcto.
- `npm audit` sin vulnerabilidades en backend y frontend (se actualizó a Vite 7 y React Router 7).
- CI/CD, README y guías de despliegue, pruebas manuales, accesibilidad y defensa ya escritos.
- Rutas exactas del spec implementadas (`/precios`, `/registro-maestro`, `/panel`, `/maestro`, `/maestro/curso/:id`, `/maestro/plan`, `/herramientas/ruso`, etc.) con alias de compatibilidad.
- Sin commits ni secretos reales: todo queda listo para revisar y hacer el primer commit.

## 7. Decisiones tomadas

1. **Base de datos**: PostgreSQL en Neon/Supabase (o local), no XAMPP/MySQL. Se requiere BD nueva porque cambiaron tablas y campos (`palabra` en vez de `ruso`).
2. **Registro de alumno por código**: inscribe de inmediato y devuelve sesión (JWT). La cuenta nace verificada, así que el alumno entra sin depender del correo.
3. **Aislamiento**: 404 para recursos de otro maestro, 403 solo para rol incorrecto. Además de los middlewares, las consultas SQL filtran por `maestro_id` o por inscripción.
4. **Correo**: Resend si hay clave; en desarrollo se imprime en consola. Ya no se necesita para registrarse ni para entrar; sigue sirviendo para restablecer contraseña y reenvíos manuales.
5. **XP**: 10 por acierto, +20 por quiz perfecto y +10 cuando la racha llega a múltiplo de 7.
6. **Leitner**: 5 cajas (1, 2, 4, 7, 15 días) con «hoy» en `America/Mexico_City`.
7. **Reporte del maestro**: se guarda el historial real de aciertos/fallos en `respuestas_repaso` para poder mostrar las tarjetas más falladas.
8. **Dependencias frontend**: Vite 7 y React Router 7 para no arrastrar avisos de seguridad; `setupTests.js` inyecta `TextEncoder`/`TextDecoder` porque jsdom no los trae.

## 8. Mejoras pendientes / opcionales

- Prompt 16 (opcional): traducción automática al crear tarjetas mediante una API externa llamada desde el backend.
- Modo oscuro (opcional en el spec).
- Dominio propio verificado en Resend para producción (SPF/DKIM/DMARC).

# Arquitectura del proyecto y mejoras para publicarlo

> Documento generado a partir del estado del proyecto en el commit actual. No se ha tocado ningún archivo de código al crearlo.

---

# 1. Idea general del proyecto

Es un **SaaS para maestros de idiomas** con dos roles claros:

- **Maestro**: crea cursos, lecciones, tarjetas, invita alumnos con código, ve reportes y maneja su plan.
- **Alumno**: se une con código, repasa tarjetas, hace quizzes, gana XP y racha.

Todo está dividido en dos aplicaciones:

```text
entrenador-ruso/
├── backend/    API REST con Node + Express + PostgreSQL
├── frontend/   Interface web con React + Vite
└── archivos de documentación y CI
```

El backend **no sirve HTML**. Solo responde JSON. El frontend es el que pinta las pantallas y llama al backend con `fetch`.

La regla de oro del proyecto es el **aislamiento multi-maestro**:

- Si un maestro intenta ver un curso de otro maestro → **404**.
- Si un alumno intenta entrar en una ruta de maestro → **403**.
- El 404 se usa a propósito para no revelar que el recurso ajeno existe.

---

# 2. Backend

## 2.1 Cómo está organizado

Dentro de `backend/src`:

| Carpeta | Qué hace |
|---|---|
| `config/` | Lee variables de entorno, crea el pool de PostgreSQL y define los planes. |
| `middlewares/` | Capas que pasan antes del controlador: token, rol, pertenencia, validación, límites, errores. |
| `rutas/` | Define qué URL llama a qué controlador. |
| `controladores/` | Toma `req` y `res`, llama al servicio y responde. Es una capa delgada. |
| `servicios/` | Aquí está la lógica de negocio y las consultas SQL. |
| `utilidades/` | Funciones puras y reutilizables: Leitner, racha, quiz, CSV, tokens, Zod, errores. |
| `app.js` | Arma Express **sin escuchar**. Sirve para que Jest pueda probarlo con Supertest. |
| `server.js` | Sí escucha el puerto y arranca la API. |

`app.js` monta el webhook de Stripe **antes** de `express.json()` porque Stripe necesita el cuerpo crudo para verificar la firma.

---

## 2.2 Configuración y arranque

### `config/entorno.js`

Lee el archivo `backend/.env` con `dotenv`. Exige dos variables:

- `DATABASE_URL`
- `JWT_SECRET`

Si faltan, lanza el error que viste:

```text
Faltan variables de entorno: DATABASE_URL, JWT_SECRET
```

También expone:

- `DB_SSL`: `true` para Neon/Supabase, `false` para Postgres local.
- `JWT_EXPIRA`: por defecto `7d`.
- `PORT`: por defecto `3000`.
- `FRONTEND_URL`: por defecto `http://localhost:5173`.
- `RESEND_API_KEY`: si está vacía, el correo se simula.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRECIO_PRO`.

### `config/baseDatos.js`

Crea un `Pool` de `pg`. Un pool reutiliza conexiones en vez de abrir una por petición. También escucha errores inesperados y los imprime en consola.

### `config/planes.js`

Un solo lugar con las reglas de negocio:

```js
gratis: 2 cursos, 10 alumnos
pro:    cursos ilimitados, 50 alumnos
```

`null` significa ilimitado. Si cambias aquí los números, cambia todo el sistema.

---

## 2.3 Seguridad: los middlewares

### `verificarToken.js`

Lee `Authorization: Bearer <JWT>`, verifica la firma con `JWT_SECRET` y pone `req.usuario = { id, rol }`. Si no hay token o es inválido → `401 sin_token`.

### `exigirRol.js`

Comprueba `req.usuario.rol`. Si un alumno intenta una ruta de maestro → `403 sin_permiso`.

### `pertenencia.js`

Es el corazón del multi-tenant. Tiene funciones como:

- `cursoDelMaestro`: exige que `curso.maestro_id === req.usuario.id`.
- `accesoCurso`: exige que el alumno esté inscrito.
- `leccionDelMaestro` / `accesoLeccion`: lo mismo para lecciones.
- `tarjetaDelMaestro`.
- `accesoSegunRol`: elige una u otra según el rol.
- `accesoLeccionSegunRol`: igual, pero exigiendo que la lección esté publicada si es alumno.

Si falla cualquiera → `404 no_encontrado`. Nunca 403 para recursos ajenos.

### `validar.js`

- `validarId('id', 'idCurso')`: convierte el parámetro de la URL a entero y lo guarda en `req.idCurso`.
- `validar(esquema)`: valida el cuerpo con Zod antes de tocar la base de datos.

### `verificarLimite.js`

Antes de crear un curso o inscribir un alumno, cuenta cuántos hay y compara con el plan. Si se pasa → `409 limite_plan`.

Corrige la diferencia entre `curso` y `cursos` mediante un mapa de claves, para que no vuelva a fallar como antes.

### `limites.js`

Dos frenos con `express-rate-limit`:

- Login: **10 intentos cada 15 minutos**.
- Reenvío de verificación: **3 por hora**, contando juntos IP y correo.

### `manejarErrores.js`

Centraliza todos los errores. Convierte cualquier fallo en JSON uniforme:

```json
{ "error": "mensaje", "codigo": "codigo_maquina", "detalles": {} }
```

### `asincrono.js`

Envuelve las funciones `async` para que los errores lleguen al middleware anterior. Sin esto, una promise rechazada podría colgar la petición.

### `subidaCsv.js`

Configura Multer para recibir el CSV en memoria, con límite de **1 MB**.

---

## 2.4 Servicios: las funciones de negocio

### Autenticación — `autenticacion.servicio.js`

| Función | Qué hace |
|---|---|
| `registrarMaestro` | Crea usuario con contraseña hasheada con bcrypt (10 rondas) y `email_verificado = true`, crea suscripción gratis y devuelve JWT + usuario en una transacción. No depende del correo. |
| `registrarAlumno` | Busca el curso por `codigo_invitacion`, comprueba el límite del maestro, crea el usuario verificado, lo inscribe de inmediato y devuelve JWT + usuario. Entra sin verificar correo. |
| `iniciarSesion` | Compara contraseña con bcrypt. Si falla, siempre dice `Credenciales inválidas` (no revela si el correo existe). No hay bloqueo por correo; firma un JWT con id/rol. |
| `obtenerYo` | Devuelve id, nombre, email, rol, XP, racha y verificación. Lo usa el frontend al recargar. |
| `verificarCorreo` | Consume el token y marca `email_verificado = true`. |
| `reenviarVerificacion` | Se conserva por compatibilidad, pero ya no crea tokens ni envía correos: responde el mensaje genérico. |
| `olvideContrasena` | Crea token de 1 hora y envía correo. También responde genérico aunque el correo no exista. |
| `restablecerContrasena` | Consume el token, hashea la nueva contraseña y marca los tokens como usados en una transacción. |

### Tokens — `tokens.servicio.js`

| Función | Qué hace |
|---|---|
| `crearToken` | Genera un token aleatorio, guarda solo su **SHA-256**, con tipo `verificar_email` o `restablecer_contrasena`. |
| `consumirToken` | Busca el hash, exige que no esté usado y que no haya vencido. Usa `FOR UPDATE` para evitar doble consumo concurrente. |
| `invalidarTokens` | Marca como usados los tokens anteriores del mismo tipo. |

Guardar solo el hash es importante: si se filtra la base de datos, no pueden robar los enlaces.

### Correo — `correo.js`

- Sin `RESEND_API_KEY`: imprime en consola un bloque `--- CORREO SIMULADO ---`. El registro funciona igual.
- Con clave: usa Resend y envía texto + HTML. No hay dependencia de Gmail ni Nodemailer.
- Quedan los enlaces `/verificar-correo?token=...` (compatibilidad con cuentas antiguas) y `/restablecer-contrasena?token=...`.

### Cursos e inscripciones — `cursos.servicio.js`

Funciones:

- `listar`: solo cursos del maestro.
- `obtener`: un curso por id, filtrado por dueño.
- `crear`: respeta límite del plan.
- `actualizar` / `eliminar`: filtrados por dueño.
- `regenerarCodigo`: crea otro código de invitación de 7 caracteres (`utilidades/codigo.js`).
- `listarAlumnos`: alumnos del curso, con XP/racha/actividad.
- `inscribirse`: alumno entra por código, respetando límite.
- `misCursos`: cursos donde está inscrito el alumno.

### Lecciones y tarjetas — `lecciones.servicio.js` y `tarjetas.servicio.js`

Lecciones tienen:

- `titulo`, `descripcion`, `orden`.
- `publicada`: si es `false`, es borrador y el alumno no la ve.
- `unidad_libro`: para ligarla al libro del maestro.
- `fecha_asignada`: para la etiqueta «Nueva de la clase».

Tarjetas tienen:

- `palabra`, `transliteracion`, `traduccion`.
- `imagen_url`, `acento_posicion`, `ejemplo_ruso`, `ejemplo_traduccion`, `audio_url`.

Ambos servicios filtran **dos veces**: primero el middleware de pertenencia y luego la propia SQL por `maestro_id` o por inscripción. Así ninguna llamada interna puede saltarse el aislamiento.

### Importación CSV — `importar.servicio.js` + `utilidades/csv.js`

`parsearCsv` es una función pura que:

- Acepta BOM y acentos en cabeceras (`Transliteración` = `transliteracion`).
- Normaliza quitando tildes y espacios.
- Exige `palabra`, `transliteracion`, `traduccion`.
- Acepta opcionales: `acento_posicion`, `ejemplo_ruso`, `ejemplo_traduccion`, `audio_url`.
- Máximo **500 filas** y **1 MB**.
- Cuenta filas vacías, duplicados en el archivo y filas inválidas.

`importarCsv` hace todo en una transacción: verifica que la lección sea del maestro, inserta con `ON CONFLICT DO NOTHING` y devuelve `{ importadas, omitidas, razones }`.

### Planes — `planes.servicio.js`

| Función | Qué hace |
|---|---|
| `leerPlan` | Lee el plan de la suscripción del maestro. |
| `miPlan` | Devuelve plan, límites y uso actual de cursos y alumnos. Solo maestros. |
| `contarRecurso` | Cuenta cursos o alumnos de un maestro. |
| `maestroDelCodigo` | Devuelve el dueño de un código de invitación. |

### Repaso espaciado — `repaso.servicio.js` + `utilidades/leitner.js`

`repasoDeHoy(cursoId, usuarioId)` devuelve hasta 20 tarjetas cuya `proxima_revision` es hoy o antes, solo de lecciones publicadas del curso inscrito.

`responder(tarjetaId, acerto, usuarioId)`:

1. Verifica que la tarjeta sea del alumno.
2. Lee su caja actual (si no tiene, empieza en la 1).
3. Llama a `siguienteRevision`.
4. Hace UPSERT en `progreso_tarjetas`.
5. Guarda el acierto/fallo en `respuestas_repaso` para el reporte.
6. Si acierta y sube de caja, suma XP; salvo que la tarjeta esté marcada `sin_xp` (viene de un reinicio) o ya esté en la caja 5.

`reiniciar(cursoId, usuarioId)` devuelve a `CURRENT_DATE` todas las tarjetas publicadas del curso del alumno, las pone en la caja 1 y fija `sin_xp = true`. El UPSERT anterior no sobrescribe esa marca, así que la segunda ronda sirve para estudiar pero nunca para sumar XP.

`utilidades/leitner.js`:

- 5 cajas con intervalos **1, 2, 4, 7 y 15 días**.
- Acertar sube una caja; fallar vuelve a la 1.
- «Hoy» se calcula en `America/Mexico_City`, aunque el servidor esté en otra zona.

### Quiz, XP y racha — `quiz.servicio.js`, `utilidades/quiz.js`, `utilidades/racha.js`

`generarQuiz`:

- Lee tarjetas filtradas por dueño o inscripción.
- Construye de 4 a 10 preguntas (por defecto 4).
- Dos tipos alternos:
  - «¿Qué significa «привет»?»
  - «¿Cuál es la palabra para «hola»?»
- 4 opciones, con distractores de otras tarjetas, todo mezclado.

`guardarResultado`:

- Valida que `puntaje <= total`.
- Verifica que la lección sea del alumno y esté publicada.
- Inserta en `resultados_quiz`.
- Calcula racha con `actualizarRacha`.
- Calcula XP:
  - **10 XP por acierto**.
  - **+20 si es perfecto**.
  - **+10 si la racha llega a múltiplo de 7**.
- Actualiza usuario y devuelve el desglose.

`nivelPorXp(xp)` = `floor(xp / 100) + 1`.

### Paneles y reportes — `panel.servicio.js`

| Función | Qué hace |
|---|---|
| `panelAlumno` | Devuelve XP, racha, nivel, última actividad, promedio y los conteos de cursos, quizzes y tarjetas pendientes. Ahí estuvo el detalle que detectaste: llegan como números, y tu `PanelAlumno.jsx` ya lo maneja sin romperse. |
| `panelMaestro` | Números: cursos, alumnos, lecciones y tarjetas. |
| `reportePorUnidad` | Intentos y promedio por unidad del libro. |
| `reporteDetallado` | Tres consultas reales: porcentaje de alumnos que repasó cada lección, top 10 de tarjetas más falladas y alumnos sin actividad en 7 días. Gracias a `respuestas_repaso`, los fallos son datos reales, no estimados. |

### Stripe — `stripe.servicio.js`

| Función | Qué hace |
|---|---|
| `crearCheckout` | Crea sesión de suscripción en modo prueba. Pasa `maestro_id` en metadata y redirige a `/pago-exitoso`. |
| `crearPortal` | Abre el portal de facturación si el maestro ya tiene `cus_...`. |
| `verificarFirma` | Verifica la firma con el body crudo y el secreto del webhook. |
| `procesarEvento` | Inserta el id del evento en `eventos_stripe`. Si ya existe, no hace nada: **idempotencia**. Activa `checkout.session.completed` y desactiva en `customer.subscription.deleted`. |

---

## 2.5 Utilidades puras

Estas no tocan base de datos, por eso son fáciles de probar:

| Archivo | Funciones |
|---|---|
| `leitner.js` | `fechaHoyZona`, `siguienteRevision`. |
| `racha.js` | `actualizarRacha`, `nivelPorXp`. |
| `quiz.js` | `generarPreguntas`, mezcla aleatoria. |
| `csv.js` | `parsearCsv`, normalización de cabeceras. |
| `tokens.js` | `generarToken`, `hashToken`. |
| `codigo.js` | Genera códigos de invitación. |
| `esquemas.js` | Todos los esquemas Zod de registro, login, cursos, lecciones, tarjetas, CSV, quiz y repaso. |
| `errorApi.js` | Clase de error con `status`, `codigo` y `detalles`. |
| `constantes.js` | Roles, zona horaria, horas de expiración. |

---

## 2.6 Lista de endpoints

### Públicos

| Método | Ruta | Para qué |
|---|---|---|
| POST | `/auth/registro-maestro` | Crear cuenta de maestro + plan gratis. |
| POST | `/auth/registro-alumno` | Crear alumno con código de invitación. |
| POST | `/auth/login` | Entrar y recibir JWT. |
| POST | `/auth/verificar-correo` | Confirmar cuenta con token. |
| POST | `/auth/reenviar-verificacion` | Compatibilidad: no envía nada, responde mensaje genérico. |
| POST | `/auth/olvide-contrasena` | Enviar enlace de restablecimiento. |
| POST | `/auth/restablecer-contrasena` | Guardar contraseña nueva. |
| POST | `/stripe/webhook` | Recibir eventos de Stripe con firma verificada. |
| GET | `/salud` | Comprobar que la API responde. |

### Autenticados

| Método | Ruta | Quién |
|---|---|---|
| GET | `/auth/yo` | Ambos |
| POST | `/cursos` | Maestro |
| GET | `/cursos` | Maestro |
| GET | `/cursos/:id` | Maestro dueño |
| PUT | `/cursos/:id` | Maestro dueño |
| DELETE | `/cursos/:id` | Maestro dueño |
| POST | `/cursos/:id/regenerar-codigo` | Maestro dueño |
| GET | `/cursos/:id/alumnos` | Maestro dueño |
| POST | `/inscripciones` | Alumno |
| GET | `/mis-cursos` | Alumno |
| GET | `/cursos/:cursoId/lecciones` | Dueño o inscrito |
| POST | `/cursos/:cursoId/lecciones` | Maestro dueño |
| GET | `/lecciones/:id/tarjetas` | Dueño o inscrito |
| POST | `/lecciones/:id/tarjetas` | Maestro dueño |
| POST | `/lecciones/:id/importar-csv` | Maestro dueño |
| PUT | `/lecciones/:id` | Maestro dueño |
| DELETE | `/lecciones/:id` | Maestro dueño |
| PUT | `/tarjetas/:id` | Maestro dueño |
| DELETE | `/tarjetas/:id` | Maestro dueño |
| GET | `/lecciones/:id/quiz` | Dueño o inscrito |
| POST | `/quiz/resultado` | Alumno |
| GET | `/cursos/:cursoId/repaso/hoy` | Alumno inscrito |
| POST | `/repaso/respuesta` | Alumno inscrito |
| POST | `/cursos/:cursoId/repaso/reiniciar` | Alumno inscrito |
| GET | `/panel/alumno` | Alumno |
| GET | `/panel/maestro` | Maestro |
| GET | `/panel/maestro/reporte` | Maestro |
| GET | `/panel/maestro/reporte-detallado` | Maestro |
| GET | `/mi-plan` | Maestro |
| POST | `/suscripcion/checkout` | Maestro |
| POST | `/suscripcion/portal` | Maestro |

---

# 3. Base de datos

Las migraciones están en `backend/migraciones/` y se aplican en este orden:

| Archivo | Qué crea |
|---|---|
| `001_crear_tablas.sql` | Esquema base: `usuarios`, `cursos`, `inscripciones`, `lecciones`, `tarjetas`, `progreso_tarjetas`, `resultados_quiz`, `suscripciones`. |
| `002_verificacion_correo.sql` | `tokens_verificacion` y el campo de verificación. **No marca nadie automáticamente**; las semillas sí marcan a los de ejemplo. |
| `003_herramientas_ruso.sql` | Campos específicos de cirílico en tarjetas. |
| `004_lecciones_libro.sql` | `unidad_libro` y `fecha_asignada` en lecciones. |
| `005_webhook_idempotencia.sql` | `eventos_stripe`. |
| `006_respuestas_repaso.sql` | `respuestas_repaso` con índices por tarjeta y usuario/fecha. |

La semilla `backend/semillas/001_datos_ejemplo.sql` crea a los 5 usuarios, 2 cursos aislados, inscripciones, lecciones, tarjetas, progreso y resultados de quiz. Al final reinicia las secuencias con `setval` para que los nuevos ids no choquen.

---

# 4. Frontend

## 4.1 Atomic Design

```text
frontend/src/
├── atomos/       Boton, Campo, Insignia, DocumentoTitulo
├── moleculas/    TarjetaCurso, BarraProgreso, TarjetaPalabra, Estado
├── organismos/   Encabezado, FormularioLogin, FormularioRegistro,
│                 FormularioCurso, FormularioLeccion, FormularioTarjeta
├── paginas/      todas las pantallas
├── contexto/     AutenticacionContexto
├── hooks/        useAutenticacion
├── rutas/        Rutas, RutaProtegida, RutaPorRol
├── servicios/    api.js
├── utilidades/   cirilico.js, audio.js, planes.js
└── estilos/      global.css
```

Átomo → molécula → organismo → página. Así se reutilizan piezas en vez de repetir HTML.

## 4.2 Autenticación en el navegador

`AutenticacionContexto.jsx`:

- Guarda el JWT en `localStorage` con la clave `token`.
- Al abrir la app, si hay token, llama a `/auth/yo` para recuperar el usuario.
- Si el token falla, lo borra y deja la sesión cerrada.
- Expone `login`, `registrar`, `cerrarSesion`, `recargar`, `token`, `usuario`, `cargando`.

`RutaProtegida` exige sesión. `RutaPorRol` añade el rol. Si no coincide, redirige al panel correcto.

## 4.3 `api.js`

Tiene una función genérica `peticion(ruta, opciones)` que:

- Añade `Authorization: Bearer <token>` si hay token.
- Serializa JSON o envía `FormData` para el CSV.
- Convierte errores de red en `codigo: 'error_red'`.
- Lee `error`, `codigo` y `detalles` del JSON del backend.
- Lanza un `Error` uniforme que las páginas muestran en rojo con `aria-live`.

Luego hay funciones por recurso: `login`, `registrarMaestro`, `listarCursos`, `crearLeccion`, `importarCsv`, `obtenerQuiz`, `listarRepaso`, `responderRepaso`, `panelAlumno`, `miPlan`, `checkout`, etc.

## 4.4 Páginas y rutas

### Públicas

| Ruta | Página | Qué hace |
|---|---|---|
| `/` | Inicio | Portada con llamada a la acción y cómo funciona. |
| `/precios` | Precios | Explica gratis vs pro. |
| `/login` | Login | Formulario con errores de campos vacíos, credenciales y correo no verificado. |
| `/registro-maestro` | RegistroMaestro | Alta de maestro. |
| `/registro-alumno` | RegistroAlumno | Alta con código de invitación. |
| `/verificar-correo` | VerificarCorreo | Compatibilidad: lee `?token=`, confirma y lleva al login. Ya no es obligatorio. |
| `/revisar-correo` | RevisarCorreo | Compatibilidad con backends antiguos: correo, reenvío y acceso al login. |
| `/olvide-contrasena` | OlvideContrasena | Pide el correo. |
| `/restablecer-contrasena` | RestablecerContrasena | Guarda contraseña nueva. |
| `/herramientas/ruso` | HerramientasRuso | Alfabeto, acento y teclado. |
| `/pago-exitoso` | PagoExitoso | Vuelve desde Stripe. |
| `*` | NoEncontrado | 404 visual. |

### Alumno

| Ruta | Página | Qué hace |
|---|---|---|
| `/panel` | PanelAlumno | XP, racha, nivel, progreso. Tu parche evita el crash cuando `cursos` llega como número. |
| `/curso/:id` | CursoAlumno | Lecciones publicadas del curso. |
| `/repaso/:cursoId` | Repaso | Flashcards, giro con teclado, «Lo sabía» / «No lo sabía», resumen final, «Ver tarjetas de mis lecciones» y «Reiniciar tarjetas (sin XP)». |
| `/quiz/:leccionId` | Quiz | Una pregunta a la vez, feedback inmediato y XP final. |
| `/cursos` | Cursos | Lista de cursos inscritos. |
| `/lecciones/:id/tarjetas` | Tarjetas | Consulta de tarjetas. |

Alias: `/panel-alumno`, `/cursos/:cursoId/repaso`, `/lecciones/:id/quiz`.

### Maestro

| Ruta | Página | Qué hace |
|---|---|---|
| `/maestro` | MaestroPanel | Métricas y lista de cursos con código. |
| `/maestro/curso/:id` | MaestroCurso | Alumnos, lecciones, publicar/borrador, editor de tarjetas, CSV y «Asignar a la clase». |
| `/maestro/plan` | MaestroPlan | Uso vs límites, checkout y portal. |

Alias: `/panel-maestro`, `/planes`.

Cada página tiene **un solo `<h1>`** y usa `DocumentoTitulo` para poner `document.title` y la meta descripción.

## 4.5 Utilidades rusas

### `cirilico.js`

| Función | Qué hace |
|---|---|
| `convertirTeclado` | Pasa texto latino a cirílico. Dos esquemas: transliteración (`privet` → `привет`) y fonético ЙЦУКЕН. |
| `marcarAcento` | Inserta el acento agudo combinante **U+0301** tras la vocal indicada. |
| `posicionesVocales` | Devuelve el número de cada vocal para elegir el acento. |
| `quitarAcento` | Quita la tilde sin tocar la `ё`. |
| `compararRespuesta` | Ignora mayúsculas, `ё`/`е` y espacios extra. Avisa si falta el acento o una letra. |

El alfabeto está agrupado exactamente como pedía el spec:

- parecidos: А К М О Т
- falsas amigas: В Н Р С У Х
- nuevas: Б Г Д Ж З И Й Л П Ф Ц Ч Ш Щ Ъ Ы Ь Э Ю Я

### `audio.js`

| Función | Qué hace |
|---|---|
| `codigoIdioma` | Convierte `ruso` → `ru-RU`, `inglés` → `en-US`, etc. |
| `buscarVoz` | Busca una voz instalada para ese idioma. |
| `hablar` | Usa `speechSynthesis`. Si no hay voz, devuelve un mensaje accesible con la transcripción en vez de fallar. |
| `detenerAudio` | Cancela la reproducción. |

También exporta `ABECEDARIO_RUSO` con 33 letras y ejemplo de cada una, `FRASES_EJEMPLO` y `TECLADO_CIRILICO`.

## 4.6 Accesibilidad y estilos

`global.css` incluye:

- Variables CSS y diseño mobile-first con Flexbox/Grid.
- Foco visible.
- Enlace «Saltar al contenido».
- `prefers-reduced-motion` para la animación de las tarjetas.
- No usar solo color: los aciertos/errores llevan texto o icono.

`frontend/ACCESIBILIDAD.md` trae la lista de verificación de teclado y Lighthouse.

## 4.7 Pruebas frontend

5 suites / 14 pruebas:

- `Login.test.jsx`: campos vacíos, error del servidor, correo no verificado.
- `RutaProtegida.test.jsx`: redirecciones por sesión y rol.
- `Repaso.test.jsx`: giro con teclado y llamada a la API.
- `Quiz.test.jsx`: retroalimentación.
- `cirilico.test.js`: acento y comparación tolerante.

Backend: 13 suites / 52 pruebas. Ambos con `npm audit` limpio.

---

# 5. CI y documentación

`.github/workflows/ci.yml`:

1. Levanta PostgreSQL 16 como servicio.
2. Instala dependencias con `npm ci`.
3. Corre auditoría y pruebas del backend.
4. Aplica las 6 migraciones y la semilla al PostgreSQL real.
5. Comprueba el aislamiento con una consulta SQL.
6. Instala, audita, prueba y compila el frontend con Node 22.

Documentos:

- `README.md`: resumen, estructura, arranque y API.
- `GUIA_DESPLIEGUE.md`: Neon, Render, Vercel, Resend, Stripe.
- `GUIA_PRUEBAS_MANUALES.md`: curl paso a paso.
- `GUIA_DEFENSA.md`: mapa de temas del curso y preguntas típicas.
- `PLAN.md` / `CONTEXTO.md`: avance y decisiones.

---

# 6. Mejoras para que sea un proyecto listo para usar y publicar

Esto no quita nada de lo que ya funciona. Es la diferencia entre **«funciona y lo puedo defender»** y **«lo puedo publicar y soportar usuarios reales»**.

## A. Imprescindible antes de publicar

### 1. Unir el contrato de `/panel/alumno`

Hoy el backend devuelve `cursos`, `quizzes` y `tarjetas_pendientes` como **números**. Tu arreglo en `PanelAlumno.jsx` evita la pantalla en blanco y muestra «Cursos inscritos: N», pero las tarjetas y los quizzes no se pintan como lista.

Para producción:

- Decidir un solo contrato: o el backend devuelve arreglos con objetos, o el frontend trabaja siempre con conteos.
- Mantener tu `Array.isArray` como red de seguridad.
- Añadir una prueba de contrato para que no vuelva a pasar.

Archivos: `backend/src/servicios/panel.servicio.js` y `frontend/src/paginas/PanelAlumno.jsx`.

### 2. Más frenos contra abuso

Ya tienes login y reenvío. Añade rate limit también a:

- `registro-maestro` y `registro-alumno`.
- `olvide-contrasena`.
- `verificar-correo`.
- `/stripe/webhook` (aunque tenga firma, no está de más).

Y en Render/Nginx pon `app.set('trust proxy', 1)` para que `req.ip` sea la IP real y no la del proxy.

### 3. JWT más robusto

Ahora el token dura 7 días y se guarda en `localStorage`.

Para producción:

- Access token corto (15-30 min) + refresh token.
- Guardar el refresh en una cookie `HttpOnly` + `Secure` + `SameSite`.
- Lista de revocación o versión de usuario para poder cerrar sesiones robadas.
- Rotar `JWT_SECRET` con un plan.

### 4. Logging y observabilidad

- Sustituir `console.log` por logger estructurado (`pino` o `winston`).
- Añadir `requestId` a cada petición y devolverlo en el error.
- Healthcheck que también compruebe la BD, no solo `/salud`.
- Sentry o similar para errores en frontend y backend.
- Alertas si falla el webhook o el envío de correo.

### 5. Base de datos y backups

- Backups automáticos en Neon (y probar una restauración).
- Migraciones con herramienta (`node-pg-migrate` o similar) en vez de pegar SQL a mano.
- `statement_timeout` y `connection_timeout` en el pool.
- Revisar índices con `EXPLAIN ANALYZE` en las consultas del reporte.
- Añadir `UNIQUE` donde falte (por ejemplo, email ya debería estarlo).

### 6. Stripe completo

Hoy se manejan dos eventos. Para producción añade:

- `invoice.payment_failed` → marcar suspensión.
- `customer.subscription.updated` → sincronizar plan real.
- `checkout.session.expired`.
- Reconciliación diaria con la API de Stripe como fuente de verdad.
- Facturas, impuestos y moneda configurados.
- Política de devoluciones y cambio de plan bien clara en `/precios`.

### 7. Correo real

- Verificar dominio en Resend con SPF, DKIM y DMARC.
- Plantillas HTML responsive.
- Reintentos y registro de rebotes.
- No usar `onboarding@resend.dev` en producción.

### 8. Legal y confianza

Necesitas sí o sí:

- Política de privacidad.
- Términos del servicio.
- Aviso de cookies si usas analítica.
- Formulario de contacto o correo de soporte.
- Borrado y exportación de cuenta del alumno/maestro (RGPD).
- Indicar claramente que es modo prueba si Stripe sigue en `sk_test_`.

---

## B. Muy recomendado después

### 9. Pruebas de extremo a extremo

Con Playwright podrías automatizar el recorrido que hiciste a mano:

```text
registro → verificación → login maestro → crear curso → invitar alumno
→ login alumno → repaso → quiz → plan → logout
```

Además:

- Pruebas de contrato API ↔ frontend.
- Lighthouse y axe en CI para accesibilidad.
- Umbral de cobertura, por ejemplo 70 %.

### 10. UX y rendimiento

- Paginación y búsqueda en cursos, alumnos y tarjetas.
- Skeletons en vez de solo «Cargando…».
- Vista previa del CSV antes de importar ya existe; añade también «deshacer importación».
- Guardado automático de borradores.
- Notificaciones tipo toast.
- Modo oscuro.
- PWA para repasar sin conexión.
- Lazy loading de páginas y dividir el bundle de Vite.

### 11. Calidad de código

- ESLint + Prettier con reglas compartidas.
- TypeScript de forma gradual, empezando por `api.js` y los servicios.
- `engines` en `package.json` y `.nvmrc` con Node 22.
- `CHANGELOG.md` y versionado semántico.
- ADR breves para decisiones importantes (por qué 404, por qué Neon, etc.).

### 12. Despliegue profesional

- Tres entornos: `dev`, `staging`, `producción`.
- Dominio propio y HTTPS.
- Secretos distintos por entorno.
- Deploy automático desde GitHub Actions.
- Rollback documentado.
- Pipeline que publique frontend y backend juntos.

---

# 7. En resumen

Tu proyecto **ya cumple con todo lo que pedía el temario**: multi-maestro, PostgreSQL, JWT, verificación de correo, cursos, lecciones, tarjetas, CSV, Leitner, quiz, XP/racha, planes, Stripe, frontend React, accesibilidad, pruebas, CI y documentación.

Lo que detectaste del panel es un ejemplo perfecto de un **desajuste de contrato**: el backend daba un número y el frontend esperaba una lista. Tu defensivo ya evitó el fallo; el siguiente paso natural sería alinear los dos lados y dejar una prueba que lo garantice.

El resto de mejoras son las que convierten un proyecto de defensa en un producto publicable: seguridad extra, observabilidad, pagos completos, legal, backups y pruebas E2E.

El siguiente paso concreto sería escoger **3 o 4 de esas mejoras** y hacerlas como una nueva tanda, con sus pruebas y commit separado.

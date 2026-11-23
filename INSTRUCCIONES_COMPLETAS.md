Prompt 0: Contexto base (pégalo al inicio de cada chat nuevo)
Soy maestro de ruso y estoy construyendo una plataforma SaaS para maestros de idiomas. Es mi proyecto final de un curso FullStack y también la voy a usar con mis alumnos después de entregarla. Tengo nivel junior: ayúdame por pasos pequeños y explícame brevemente cada decisión.

Producto: cada maestro se registra, crea cursos, sube lecciones y tarjetas, e invita a sus alumnos con un código. Los alumnos practican con flashcards, quizzes, audio y repaso espaciado (sistema Leitner de 5 cajas), y tienen XP y racha diaria. Empiezo con ruso, pero debe servir para cualquier idioma (el campo principal de la tarjeta se llama "palabra", no "ruso"). Cada maestro solo puede ver y modificar sus propios cursos y alumnos. Hay planes con límites (gratis y pro).

Stack: Node.js + Express (API REST), PostgreSQL (Supabase o Neon), JWT con roles (maestro/alumno), React con Vite y React Router, Jest y React Testing Library, GitHub Actions. Todo debe poder funcionar con planes gratuitos.

Reglas: JavaScript moderno (ES6+); nombres en español para tablas, rutas y variables de dominio; UTF-8 en todo (hay cirílico); contraseñas con bcrypt; secretos en variables de entorno (nunca en el código); validación de datos en el servidor; manejo de errores con respuestas JSON claras; comentarios breves. IMPORTANTE: toda consulta a la base de datos debe filtrar por el dueño (maestro o curso) para que nunca se mezclen datos entre maestros. Al terminar cada respuesta dime cómo probar lo que hiciste y qué commit sugieres.

Primero crea un archivo CONTEXTO.md con este resumen y la estructura de carpetas propuesta (backend/ y frontend/). No escribas más código todavía.

Prompt 1: Base de datos
Con el contexto anterior, dame el esquema SQL completo para PostgreSQL de la app SaaS multi-tenant:

- usuarios: id, nombre, email (único), contrasena_hash, rol ('maestro' o 'alumno'), xp (default 0), racha (default 0), ultima_actividad (fecha), creado_en.
- cursos: id, maestro_id (FK a usuarios), nombre, idioma, descripcion, codigo_invitacion (único, de 6 a 8 caracteres), creado_en.
- inscripciones: usuario_id, curso_id (llave primaria compuesta), fecha.
- lecciones: id, curso_id (FK), titulo, descripcion, orden, publicada (boolean, default false).
- tarjetas: id, leccion_id (FK), palabra, transliteracion, traduccion, imagen_url.
- progreso_tarjetas: usuario_id, tarjeta_id, caja (1 a 5, default 1), proxima_revision (fecha), llave primaria compuesta.
- resultados_quiz: id, usuario_id, leccion_id, puntaje, total_preguntas, fecha.
- suscripciones: id, maestro_id (FK, único), plan ('gratis' o 'pro', default 'gratis'), estado, renovacion (fecha), proveedor_id (texto, id del cliente en el proveedor de pagos).

Incluye ON DELETE CASCADE donde corresponda, restricciones CHECK (rol, caja entre 1 y 5, plan), e índices en maestro_id, curso_id, leccion_id y proxima_revision. Agrega datos de ejemplo: dos maestros distintos, cada uno con un curso, dos lecciones y unas 8 tarjetas con letras y palabras rusas, más tres alumnos inscritos en distintos cursos, para poder probar luego que los datos no se mezclan. Explícame cada relación en una línea y dime cómo ejecutar el script en Supabase o Neon.

Prompt 2: Backend base y autenticación
Crea el backend en Express dentro de backend/:

1. Estructura de carpetas: rutas, controladores, middlewares, config y utilidades. Un archivo app.js (la app) separado de server.js (el arranque), para poder probarla con Jest.
2. Conexión a PostgreSQL con la librería pg y variables de entorno (.env y .env.example con DATABASE_URL, JWT_SECRET, PORT, FRONTEND_URL). Agrega .gitignore con .env.
3. CORS configurable con FRONTEND_URL, helmet y límite de tamaño del cuerpo de las peticiones.
4. POST /auth/registro-maestro: crea un maestro con bcrypt y su suscripción en plan 'gratis'. Valida nombre, email válido y contraseña de mínimo 8 caracteres.
5. POST /auth/registro-alumno: exige un codigo_invitacion válido; crea el alumno y lo inscribe en ese curso.
6. POST /auth/login: devuelve un JWT (expira en 7 días) con id y rol, y los datos básicos del usuario. Usa el mismo mensaje de error para email inexistente y contraseña incorrecta.
7. GET /auth/yo: devuelve el usuario autenticado.
8. Middlewares: verificarToken, exigirRol('maestro'), y manejador de errores global con respuestas JSON uniformes.

Dame también cómo probar todo con curl o Thunder Client.

Prompt 3: Cursos, inscripciones y aislamiento de datos
Agrega las rutas de cursos con aislamiento entre maestros:

- POST /cursos, GET /cursos, GET /cursos/:id, PUT /cursos/:id, DELETE /cursos/:id (solo maestro, solo sobre sus propios cursos). Al crear un curso se genera un codigo_invitacion aleatorio único.
- POST /cursos/:id/regenerar-codigo (solo el maestro dueño).
- GET /cursos/:id/alumnos: lista de alumnos inscritos con su xp, racha y última actividad (solo el maestro dueño).
- POST /inscripciones: un alumno ya registrado se une a otro curso con un código.
- GET /mis-cursos: para el alumno, los cursos en los que está inscrito.

Crea un middleware reutilizable que verifique la pertenencia: que el curso sea del maestro autenticado, o que el alumno esté inscrito en él. Devuelve 404 (no 403) cuando el recurso es de otro maestro, para no revelar que existe.

Escribe pruebas con Jest y supertest que demuestren que el maestro A no puede leer, editar ni borrar cursos, alumnos ni lecciones del maestro B, y que un alumno no puede ver cursos en los que no está inscrito.

Prompt 4: Lecciones, tarjetas e importación por CSV
Agrega las rutas de lecciones y tarjetas, siempre respetando que pertenezcan a un curso del maestro autenticado:

- Lecciones: GET /cursos/:cursoId/lecciones (el alumno solo ve las publicadas; el maestro ve todas), POST, PUT y DELETE (solo maestro dueño). Campo publicada para alternar borrador y publicada.
- Tarjetas: GET /lecciones/:id/tarjetas, POST, PUT y DELETE (solo maestro dueño). El alumno solo accede si la lección está publicada y está inscrito.
- POST /lecciones/:id/importar-csv (solo maestro dueño): recibe un archivo CSV con columnas palabra, transliteracion, traduccion (la cabecera puede venir con o sin acentos). Debe: leer el archivo como UTF-8 y quitar el BOM si lo trae; validar cada fila; ignorar duplicados exactos en la misma lección; limitar a 500 filas y 1 MB; y devolver un resumen con cuántas filas se importaron, cuántas se omitieron y por qué. Usa multer en memoria y una librería de CSV como csv-parse.

Valida todos los datos con una librería como zod o joi. Escribe pruebas para la importación con un CSV que contenga cirílico, una fila vacía y un duplicado.

Prompt 5: Planes y límites
Implementa los planes y sus límites:

1. Un archivo config/planes.js con: gratis (máximo 2 cursos y 10 alumnos en total) y pro (cursos ilimitados y máximo 50 alumnos). Los números deben ser fáciles de cambiar.
2. Un middleware verificarLimite('curso') que se use al crear cursos, y otro que se use al inscribir alumnos (tanto con registro como con código), que cuente el uso actual del maestro dueño y bloquee con HTTP 403 y un mensaje claro cuando se excede, indicando el plan actual y el límite.
3. GET /mi-plan (solo maestro): devuelve plan, estado, uso actual (cursos y alumnos) y límites.
4. Pruebas con Jest: un maestro en plan gratuito no puede crear un tercer curso ni inscribir al alumno número 11; uno en plan pro sí puede hasta su límite.

Prompt 6: Repaso espaciado
Implementa el repaso espaciado con el sistema Leitner de 5 cajas. Intervalos: caja 1 = 1 día, caja 2 = 2 días, caja 3 = 4 días, caja 4 = 7 días, caja 5 = 15 días.

Reglas: si el alumno acierta, sube una caja (máximo 5); si falla, vuelve a la caja 1. En ambos casos se actualiza proxima_revision. Una tarjeta que el alumno nunca ha visto cuenta como caja 1 y debe aparecer en su repaso.

Rutas (solo alumnos inscritos, solo lecciones publicadas):
- GET /cursos/:cursoId/repaso/hoy: tarjetas con proxima_revision <= hoy más las nuevas, máximo 20 por sesión.
- POST /repaso/respuesta: recibe tarjeta_id y acerto (boolean); verifica que el alumno tenga acceso a esa tarjeta; actualiza la caja con un UPSERT.

Pon la lógica de cajas y fechas en una función pura separada (recibe la caja actual y si acertó, devuelve la nueva caja y los días hasta la próxima revisión) y escribe pruebas con Jest que cubran: subir de caja, no pasar de 5, volver a 1 al fallar y tarjetas nuevas. Usa la zona horaria America/Mexico_City para decidir qué es "hoy".

Prompt 7: Quiz, XP y racha
Agrega el quiz y la gamificación:

- GET /lecciones/:id/quiz: genera hasta 10 preguntas de opción múltiple con las tarjetas de esa lección. Dos tipos: "¿Qué significa [palabra]?" y "¿Cómo se lee [palabra]?". Cada pregunta lleva 3 opciones incorrectas tomadas de otras tarjetas (del mismo curso si la lección tiene pocas), en orden aleatorio, sin repetir la correcta. Si la lección tiene menos de 4 tarjetas, devuelve un mensaje claro.
- POST /quiz/resultado: recibe leccion_id, puntaje y total; verifica acceso; guarda el resultado y suma XP (10 XP por respuesta correcta y 20 de bonus si acierta todo).
- Racha: al completar un repaso o un quiz, la racha sube 1 si el alumno estudió ayer, se reinicia a 1 si pasó más de un día, y no cambia si ya estudió hoy. Actualiza ultima_actividad. Usa America/Mexico_City.
- GET /panel/alumno: racha, XP, nivel (calculado como floor(xp / 100) + 1), tarjetas pendientes hoy por curso y últimos resultados de quiz.
- GET /panel/maestro: por curso, número de alumnos, promedio de puntajes y alumnos inactivos en los últimos 7 días.

Pon la lógica de racha, nivel y generación de preguntas en funciones puras con pruebas en Jest.

Prompt 8: Suscripciones y pagos con Stripe (modo de prueba)
Integra Stripe EN MODO DE PRUEBA para el plan pro:

1. POST /suscripcion/checkout (solo maestro): crea una sesión de Stripe Checkout en modo suscripción con el precio del plan pro (el id del precio va en una variable de entorno), con success_url y cancel_url hacia el frontend, y guarda el id de cliente.
2. POST /suscripcion/portal (solo maestro): crea una sesión del portal de cliente de Stripe para que administre o cancele su suscripción.
3. POST /webhook/stripe: usa el cuerpo en crudo (express.raw) y VERIFICA LA FIRMA con el secreto del webhook. Maneja los eventos checkout.session.completed, customer.subscription.updated, customer.subscription.deleted e invoice.payment_failed, y actualiza la tabla suscripciones (plan, estado, renovación). Debe ser idempotente: recibir el mismo evento dos veces no rompe nada.
4. Variables de entorno: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRECIO_PRO. Nunca en el código.
5. Si el maestro cancela o el pago falla, vuelve al plan gratuito respetando lo ya creado (no borres cursos ni alumnos; solo bloquea crear más).

Explícame paso a paso cómo configurar Stripe en modo de prueba, cómo probar el webhook en local con la CLI de Stripe y qué tarjetas de prueba usar. Aclárame qué faltaría para cobrar de verdad.

Prompt 9: Frontend base
Crea el frontend en frontend/ con Vite + React. Haz lo siguiente:

1. React Router con las rutas: / (inicio), /precios, /login, /registro-maestro, /registro-alumno, /panel (alumno), /curso/:id, /repaso/:cursoId, /quiz/:leccionId, /maestro (panel del maestro), /maestro/curso/:id, /maestro/plan y una página 404.
2. Un contexto de autenticación que guarde el JWT y el usuario, con login, logout y recarga de sesión al abrir la app.
3. Componentes de ruta protegida: uno que exija sesión y otro que exija rol (maestro o alumno), con redirección adecuada.
4. Un archivo api.js con funciones fetch que agreguen el token, lean la URL base desde una variable de entorno de Vite (VITE_API_URL) y manejen errores de forma uniforme (sesión expirada, sin conexión, errores del servidor).
5. Estructura con Atomic Design: átomos (Boton, Campo, Insignia), moléculas (TarjetaCurso, BarraProgreso), organismos (Encabezado, FormularioLogin) y páginas.
6. Estados de carga y de error en cada pantalla.

Sin estilos elaborados todavía: solo lo necesario para que sea legible.

Prompt 10: Páginas públicas (inicio, precios, registros)
Crea las páginas públicas:

- Inicio: propuesta de valor para maestros de idiomas (crea tu curso, invita a tus alumnos con un código, ellos practican con repaso espaciado), cómo funciona en 3 pasos, y botones a registro de maestro y de alumno.
- Precios: dos tarjetas comparando plan gratis y plan pro con sus límites (toma los números del backend o de una constante compartida), y botón de acción.
- Registro de maestro y de alumno (este último con campo de código de invitación), con validación en el cliente, mensajes de error claros por campo y estado de carga en el botón.
- Login.

Usa HTML semántico (header, nav, main, section, footer), un solo h1 por página, etiquetas label asociadas a cada campo, y título y meta descripción distintos en cada página (con react-helmet-async o equivalente). Que sean responsive mobile-first.

Prompt 11: Panel del maestro
Crea el panel del maestro (rutas /maestro, /maestro/curso/:id, /maestro/plan):

- Lista de mis cursos con botón de crear curso. Si alcanzó el límite del plan, muestra el mensaje y un botón para ir a /maestro/plan.
- Detalle de curso: ver y copiar el código de invitación, botón para regenerarlo, lista de alumnos con XP, racha y última actividad, y lista de lecciones con alternador de publicada/borrador.
- Editor de lección: formulario para agregar, editar y borrar tarjetas (palabra, transliteración, traducción, imagen opcional por URL) y botón de importar CSV con vista previa de las primeras filas, resumen del resultado y enlace para descargar una plantilla CSV de ejemplo con cabeceras palabra, transliteracion, traduccion.
- Plan: uso actual frente a límites, botón para pasar a pro (checkout de Stripe) y botón para administrar la suscripción.

Confirma antes de borrar cursos, lecciones y tarjetas. Todos los formularios deben tener etiquetas, mensajes de error y ser usables con teclado.

Prompt 12: Pantallas del alumno (repaso, quiz y audio)
Crea las pantallas del alumno:

- Panel: racha, XP, nivel con barra de progreso, tarjetas pendientes por curso y botón "Repasar ahora".
- Repaso: una tarjeta a la vez, con la palabra al frente; al voltearla (clic, Enter o Espacio) se ve la transliteración y la traducción; botones "Lo sabía" y "No lo sabía" que llaman a la API; contador de progreso de la sesión y pantalla final con resumen.
- Audio: botón que lee la palabra con speechSynthesis en el idioma del curso (para ruso, ru-RU). Si el dispositivo no tiene voz para ese idioma, muestra un mensaje claro en vez de fallar. Permite elegir el idioma del curso en una tabla de equivalencias (ruso ru-RU, inglés en-US, francés fr-FR, etc.).
- Quiz: una pregunta a la vez, retroalimentación inmediata (correcta o incorrecta con la respuesta correcta), puntaje final y XP ganado.
- Lista de lecciones del curso con las publicadas, y el progreso de cada una.

Usa useState y useEffect (y useRef cuando haga falta), maneja carga y errores, y anuncia los resultados con aria-live.

Prompt 13: Diseño, accesibilidad y responsive
Aplica estilos a toda la app con CSS (Flexbox y Grid), mobile-first:

- Sistema de diseño simple con variables CSS: paleta, tipografía (que muestre bien el cirílico), espaciados y radios. Buen contraste (mínimo 4.5:1 en texto normal).
- Layouts responsive: panel en columna en móvil y en cuadrícula en pantallas grandes; tarjeta de repaso grande y táctil.
- Accesibilidad: foco visible, navegación completa con teclado, aria-label en botones de solo ícono, aria-live en resultados, enlace "saltar al contenido", respetar prefers-reduced-motion en la animación de voltear la tarjeta, y no usar solo el color para indicar acierto o error.
- Un enlace o botón de modo oscuro es opcional.

Al terminar, dame una lista de verificación para comprobar accesibilidad con Lighthouse y con navegación solo por teclado, y corrige lo que falle.

Prompt 14: Pruebas
Escribe las pruebas que falten:

- Backend (Jest + supertest): autenticación (registro, login, token inválido), aislamiento entre maestros, límites de planes, lógica Leitner, racha y generación de quiz. Usa una base de datos de pruebas separada o transacciones que se reviertan.
- Frontend (Jest o Vitest + React Testing Library): formulario de login (campos vacíos y error del servidor), tarjeta de repaso (se voltea con teclado y llama a la API) y pregunta de quiz (muestra retroalimentación).
- Scripts npm test en backend y frontend, y un informe de cobertura.

Explícame brevemente qué prueba cada archivo y cómo ejecutarlo.

Prompt 15: CI/CD y despliegue
1. Crea un workflow de GitHub Actions (.github/workflows/ci.yml) que en cada push y pull request a main: instale dependencias de backend y frontend, ejecute las pruebas de ambos y haga el build del frontend. Usa caché de npm y una base PostgreSQL como servicio para las pruebas del backend.
2. Dame los pasos para desplegar: frontend en Vercel, backend en Render y base de datos en Supabase o Neon. Para cada servicio, qué variables de entorno configurar (incluida VITE_API_URL, FRONTEND_URL, DATABASE_URL, JWT_SECRET y las de Stripe) y cómo configurar CORS con las URLs reales.
3. Configura el webhook de Stripe apuntando a la URL pública del backend.
4. Avísame de las limitaciones de los planes gratuitos (por ejemplo, que el backend se duerme tras un rato sin uso) y cómo mitigarlas.
5. Dame una lista de revisión final de seguridad: secretos fuera del repositorio, contraseñas hasheadas, validación de datos, límite de intentos en login (rate limiting), HTTPS y CORS correcto.

Prompt 16 (opcional): Importar vocabulario con una API externa
Agrega una función en el editor de lecciones donde el maestro escribe una palabra y la app busca su traducción con una API externa gratuita, rellenando los campos de la tarjeta para que él los revise antes de guardar. Sugiere dos opciones de API, indica sus límites de uso y condiciones, y haz que la app falle con elegancia si la API no responde o excede su límite. La llamada debe hacerse desde el backend para no exponer claves.

Prompt 17: Revisión final y documentación
Haz una revisión final de todo el proyecto:
1. Revisa que ninguna consulta SQL pueda devolver o modificar datos de otro maestro.
2. Revisa que no haya secretos en el código ni en el historial reciente.
3. Genera un README.md con: descripción, capturas sugeridas, stack, cómo correrlo en local, variables de entorno, cómo ejecutar pruebas y cómo desplegarlo.
4. Actualiza CONTEXTO.md con el estado actual, las decisiones tomadas y las mejoras pendientes, para poder retomar el proyecto después.
5. Dame una lista de qué temas del curso cubre cada parte del proyecto (HTML semántico, accesibilidad, CSS, responsive, JS, DOM, fetch, UI/UX, Git, Node, Express, SQL, JWT, deploy, React, hooks, Router, testing y CI/CD) con el archivo donde se ve cada uno, para usarlo en mi defensa.
 



Prompt 0 (agrega esto al final del contexto)
Mejoras acordadas: (1) al registrarse, el usuario recibe un correo para confirmar su cuenta y no puede iniciar sesión hasta verificarla; (2) la app está pensada para ruso y hispanohablantes, con herramientas específicas del cirílico (entrenador del alfabeto, acento tónico, escribir la respuesta con teclado cirílico en pantalla, frases de ejemplo) y lecciones ligadas a las unidades del libro de texto; (3) la interfaz está en español.
Prompt 1b: Cambios en la base de datos
Modifica el esquema SQL: en la tabla usuarios agrega email_verificado (boolean, default false) y verificado_en (timestamp, nulo). Crea la tabla tokens_verificacion con: id, usuario_id (FK con ON DELETE CASCADE), token_hash (texto, único), tipo ('verificar_email' o 'restablecer_contrasena'), expira_en (timestamp), usado_en (timestamp, nulo), creado_en. Agrega índices en token_hash y usuario_id. Dame el script de migración (ALTER TABLE y CREATE TABLE) para no perder datos, y marca como verificados a los usuarios de ejemplo que ya existen.
Prompt 2b: Verificación de correo (backend)
Implementa la verificación de correo en el backend de Express:

1. Un servicio servicios/correo.js que envíe correos con Resend (SDK oficial) usando variables de entorno RESEND_API_KEY, CORREO_REMITENTE y FRONTEND_URL. Si falta la clave, en desarrollo debe imprimir el enlace en la consola en vez de fallar. Deja la implementación aislada para poder cambiar de proveedor.
2. Al registrarse un maestro o un alumno: crear el usuario con email_verificado=false, generar un token aleatorio de 32 bytes (crypto.randomBytes), guardar SOLO su hash SHA-256 en tokens_verificacion con vencimiento de 24 horas, y enviar un correo en español con un botón y un enlace a FRONTEND_URL/verificar-correo?token=... (texto simple, sin imágenes pesadas, también en versión de texto plano).
3. GET o POST /auth/verificar-correo: recibe el token, lo busca por su hash, valida que no esté vencido ni usado, marca al usuario como verificado, marca el token como usado y responde con un mensaje claro. Si el token no es válido, responde con el mismo mensaje genérico para vencido o inexistente.
4. POST /auth/reenviar-verificacion: recibe un email, y SIEMPRE responde lo mismo ("si el correo existe, te enviamos un enlace") para no revelar qué correos están registrados. Invalida los tokens anteriores y limita a 3 reenvíos por hora por email y por IP con express-rate-limit.
5. En POST /auth/login: si las credenciales son correctas pero el correo no está verificado, responde 403 con un código de error "correo_no_verificado" para que el frontend ofrezca reenviar el correo.
6. Importante para alumnos: el registro con código de invitación solo inscribe al curso si el correo se verifica, o bien inscribe de inmediato pero bloquea el acceso hasta verificar. Dime cuál opción recomiendas y por qué, y aplícala.
7. Pruebas con Jest: registro crea token y llama al envío (mockea el servicio de correo), token válido verifica, token vencido y token ya usado fallan, login bloqueado sin verificar, y el reenvío respeta el límite.
8. Variables nuevas en .env.example. Explícame cómo probar todo en local y cómo configurar Resend (incluido qué hacer si no tengo dominio todavía).
Prompt 2c (opcional): Restablecer contraseña
Con el mismo mecanismo de tokens, agrega POST /auth/olvide-contrasena (respuesta siempre genérica, token de 1 hora, tipo 'restablecer_contrasena') y POST /auth/restablecer-contrasena (valida token, aplica bcrypt a la nueva contraseña de mínimo 8 caracteres, invalida el token y todos los tokens previos). Incluye pruebas y limitación de intentos.
Prompt 10b: Pantallas del frontend para verificación
Agrega al frontend: (1) tras registrarse, una pantalla "Revisa tu correo" con el correo al que se envió y un botón "Reenviar" con cuenta regresiva de 60 segundos; (2) la página /verificar-correo que lea el token de la URL, llame a la API y muestre éxito (con botón para iniciar sesión), enlace vencido (con opción de reenviar) o error; (3) en el login, si la API responde "correo_no_verificado", muestra un mensaje claro con botón de reenviar. Todo accesible: mensajes con aria-live, foco que se mueve al mensaje y textos en español. Si hiciste el Prompt 2c, agrega también las pantallas de "Olvidé mi contraseña" y "Restablecer contraseña".
Prompt 12b: Herramientas específicas del ruso
Agrega funciones especializadas en ruso:

1. En la tabla tarjetas, agrega acento_posicion (entero, nulo, índice de la vocal tónica), ejemplo_ruso y ejemplo_traduccion (nulos), y audio_url (nulo). Actualiza el CRUD y la importación CSV con columnas opcionales.
2. Muestra el acento tónico en la tarjeta (marca la vocal con un acento agudo combinado o resaltado visual accesible, y explica con aria-label).
3. Entrenador del alfabeto: una lección especial con las 33 letras agrupadas en "se parecen al español" (А, К, М, О, Т), "falsas amigas" (В, Н, Р, С, У, Х) y "nuevas" (Б, Г, Д, Ж, З, И, Й, Л, П, Ф, Ц, Ч, Ш, Щ, Ъ, Ы, Ь, Э, Ю, Я), con ejercicio de reconocer letra-sonido y de formar palabras.
4. Ejercicio de escribir la respuesta: un campo de texto con teclado cirílico en pantalla (botones accesibles) y comparación tolerante (ignora mayúsculas, la letra ё/е y espacios extra, y avisa si faltó el acento o una letra).
5. Muestra frases de ejemplo bajo la tarjeta ya volteada.
6. Escribe pruebas para la comparación tolerante de respuestas.
Prompt 12c: Lecciones ligadas al libro de texto
Agrega al modelo de lecciones: unidad_libro (texto corto, ej. "Unidad 3") y fecha_asignada. Crea en el panel del maestro la acción "Asignar a la clase" que publica la lección y marca la fecha. En el panel del alumno, muestra primero las lecciones asignadas recientemente con una etiqueta "Nueva de la clase". En el panel del maestro agrega un reporte por lección: porcentaje de alumnos que la repasó, tarjetas que más fallan en el grupo (top 10) y alumnos sin actividad en 7 días, para repasar en la siguiente clase por Zoom.
Prompt 15 (agrega al final)
Agrega a la configuración de despliegue las variables RESEND_API_KEY y CORREO_REMITENTE en Render, y dame los pasos para verificar un dominio en Resend (registros DNS SPF y DKIM) para que los correos no lleguen a spam. Agrega una prueba manual de extremo a extremo: registrarse en producción, recibir el correo y verificar.


# Cómo se vive el producto: guía para usuarios (sin técnica)

Imagina que entras a la página. Ves una portada sencilla: **aprende ruso con tarjetas, repaso inteligente y quizzes**, con botones para *Iniciar sesión*, *Precios* y *Herramientas de ruso*.

Hay dos formas de vivirlo: eres **maestro** (creas y diriges el curso) o eres **alumno** (aprendes). Ambas están conectadas por un pequeño código de invitación.

---

## 1. Si eres maestro

### 1.1 Creas tu cuenta

Te registras con tu nombre, correo y contraseña. Abres tu correo, haces clic en el enlace de verificación y ya puedes entrar. (En tu equipo de prueba, el enlace aparece impreso en la terminal en vez de llegar al correo.)

### 1.2 Tu panel de maestro

Al entrar ves de un vistazo cuántos **cursos, alumnos, lecciones y tarjetas** tienes. Es tu tablero de control.

### 1.3 Creas tu primer curso

Le pones nombre e idioma. El sistema le genera automáticamente un **código de invitación de 7 caracteres**, por ejemplo `RUSO123`.

Ese código es la llave de tu curso: lo compartes con tus alumnos y ellos entran solos. Si se te filtra, puedes regenerar otro.

### 1.4 Preparas las lecciones

Dentro del curso vas creando lecciones: título, descripción y orden. Puedes indicar a qué **unidad del libro** corresponde y una **fecha asignada**, para que al alumno le aparezca la etiqueta «Nueva de la clase».

Mientras una lección está en **borrador**, tus alumnos no la ven. Cuando le das a **Publicar**, aparece en su lista. Tú controlas el ritmo.

### 1.5 Llenas la lección de tarjetas

Cada tarjeta lleva:

- la **palabra en ruso**: «привет»
- su **transliteración**: «privet»
- la **traducción**: «hola»

Y de forma opcional: una imagen, un ejemplo de uso, la posición del acento, un audio y una **nota gramatical o contextual**.

Puedes escribirlas una por una o **subir un archivo CSV** desde Excel o Google Sheets (hasta 500 filas). El sistema te dice cuántas entraron y cuántas se omitieron, sin romper nada.

También puedes **generar tarjetas con IA**: dentro de la lección subes un **PDF o DOCX** del libro (máximo 5 MB) y Gemini propone palabras, transliteración, traducción, un ejemplo breve y una nota gramatical. Las sugerencias **no se guardan solas**: aparecen en pantalla para que las edites, descartes las que no sirvan y pulses «Guardar tarjetas revisadas». La clave de Gemini vive solo en el servidor. Si alguna tarjeta falla al guardarse, el panel conserva solo las fallidas y el botón cambia a «Reintentar tarjetas fallidas», sin volver a enviar las que ya se guardaron.

### 1.6 Invitas a tus alumnos

Les das el código `RUSO123`. Ellos se registran y **quedan inscritos al instante**, sin que tengas que aprobarlos uno por uno.

En la pantalla del curso ves la lista de alumnos, con su XP, su racha y cuándo fue su última actividad.

### 1.7 Ves cómo van tus alumnos

Los reportes te responden preguntas de maestro reales:

- ¿Qué porcentaje de alumnos repasó cada lección?
- ¿Cuáles son las **10 tarjetas más falladas**?
- ¿Quién lleva **7 días sin practicar**?

Con eso sabes qué reforzar en la próxima clase. Los fallos son datos reales de lo que el alumno marcó como «No lo sabía», no estimaciones.

### 1.8 Tu plan

- **Gratis**: hasta 2 cursos y 10 alumnos.
- **Pro**: cursos ilimitados y hasta 50 alumnos.

Desde *Mi plan* ves cuánto estás usando y un botón para mejorar. El pago va por Stripe en **modo prueba** mientras tanto, y tienes un portal para ver facturas o cambiar de tarjeta.

---

## 2. Si eres alumno

### 2.1 Entras con el código

En *Registro de alumno* pones tu nombre, correo, contraseña y el código que te dio tu maestro (`RUSO123`). Confirmas tu correo y **ya estás dentro de su curso**. No hay esperas ni aprobaciones.

### 2.2 Tu panel

Ves tu **XP**, tu **racha de días**, tu **nivel** y tu progreso. Cada 100 XP subes de nivel. La racha son los días seguidos que practicas: es el gancho para volver mañana.

Al final del panel verás **Empieza a estudiar** → **Ir a mis cursos**. También puedes tocar **Estudiar** en el menú de arriba en cualquier momento: ahí aparecen tus cursos con un botón **Abrir curso** y otro **Repasar hoy**.

### 2.3 Abres tu curso

Desde **Estudiar**, toca **Abrir curso** en el curso que quieras. Aparece la lista de lecciones publicadas. Las que tu maestro marcó para hoy llevan la etiqueta «Nueva de la clase». Las lecciones en borrador no existen para ti.

En cada lección tienes tres acciones claras: **Practicar tarjetas** (todas las de esa lección, una por una), **Ver tarjetas** (el listado completo para consultar) y **Hacer quiz** (preguntas aleatorias). El botón «Repasar pendientes de hoy» de arriba es distinto: solo trae lo que toca hoy.

### 2.4 Repasas: la parte que más aprendes

Entras a *Repasar* y ves tarjetas tipo flashcard:

1. Sale la palabra en ruso.
2. Le das a girar (clic o barra espaciadora) y ves la traducción.
3. Dices **«Lo sabía»** o **«No lo sabía»**.

Aquí está la magia del **repaso espaciado**:

- Si aciertas, la tarjeta sube de caja (de la 1 a la 5) y vuelve en **1, 2, 4, 7 o 15 días**. Sumas **10 XP** cada vez que sube de caja; si tu racha llega a 7, 14, 21… días, sumas **10 XP extra**.
- Si fallas, vuelve a la **caja 1** y te aparece al día siguiente. No sumas XP.

Las tarjetas que ya están en la caja 5 no dan XP, para que no puedas repetir «Lo sabía» solo a ganar puntos. El sistema te muestra hasta **20 tarjetas al día**, solo las que tocan hoy. Al terminar ves un resumen con los XP ganados.

Cuando no queden tarjetas para hoy verás «¡Todo al día!». Desde ahí puedes pulsar **Ver tarjetas de mis lecciones** para volver a consultarlas, o **Reiniciar tarjetas (sin XP)** para traerlas otra vez al día de hoy y repasarlas desde la caja 1. Esa segunda ronda **no suma XP**: las tarjetas reiniciadas quedan marcadas como «sin XP», así que no hay forma de ganar puntos repitiéndolas. Lo mismo ves al terminar una ronda reiniciada.

### 2.5 Haces el quiz

De 4 a 10 preguntas de 4 opciones, mezcladas. Hay dos estilos:

- «¿Qué significa *привет*?»
- «¿Cuál es la palabra para *hola*?»

Recibes retroalimentación inmediata: acierto o error, con la respuesta correcta. Y ganas XP:

- **10 XP** por acierto.
- **+20 XP** si el quiz sale perfecto.
- **+10 XP** si tu racha llega a 7, 14, 21… días.

### 2.6 Herramientas de ruso

Una cajita de utilidades para cuando estás escribiendo:

- El **alfabeto** agrupado en «parecidos al español», «falsas amigas» y «nuevas».
- Escribes `privet` y se convierte en **привет** (teclado de transliteración o distribución ЙЦУКЕН).
- Colocas el **acento** en la vocal correcta sin saber dónde va el carácter especial.
- Un botón de **audio** que pronuncia la palabra con la voz de tu navegador. Si no hay voz rusa instalada, te muestra la transcripción para que no te quedes sin respuesta.

### 2.7 Vuelves mañana

La app te recuerda justo lo que estabas a punto de olvidar. Por eso la racha engancha: es poco tiempo al día, pero es el tiempo correcto.

---

## 3. Un día en la vida (ejemplo con las cuentas de prueba)

**Lunes — Ana, la maestra.** Crea el curso «Ruso para principiantes», sube 12 tarjetas de la Unidad 1, publica la lección y comparte el código `RUSO123`.

**Martes — Lucía, la alumna.** Se registra con el código, confirma su correo, repasa 8 tarjetas (acierta 7) y hace el quiz: 4 de 4. Suma 40 XP por aciertos, 20 por perfecto y sigue subiendo su racha.

**Miércoles — Ana.** Abre el reporte y ve que «спасибо» es la tarjeta más fallada. La explica en clase y le añade un ejemplo.

**Jueves — Lucía.** Entra y solo le aparecen las tarjetas que tocaban hoy. Su racha va en 4. Sabe exactamente qué practicar.

---

## 4. Lo que siente cada uno

**El maestro siente control:** prepara una vez, invita con un código y ve evidencia real de quién practicó y qué se le dificulta. El borrador le da seguridad de no mostrar nada a medias.

**El alumno siente progreso:** entrar es fácil, las sesiones son cortas, siempre sabe qué le toca, y cada acierto se traduce en XP, nivel y racha. No tiene que decidir qué estudiar: la app se lo decide por él.

**Lo que lo hace especial:** no es solo un diccionario de tarjetas. Es un sistema que espera el momento justo para volver a preguntarte, con un maestro que puede ver cuándo intervenir.

---

## 5. Notas para tus pruebas locales

- Los correos se **simulan**: el enlace de verificación se imprime en la terminal del backend, no llega a Gmail.
- La generación con IA necesita `GEMINI_API_KEY` en el backend. Sin clave, el botón responde con un aviso claro; no rompe el editor.
- Si Google está saturado por unos segundos, el backend reintenta automáticamente antes de mostrar el aviso; no hace falta recargar la página.
- Stripe está en **modo prueba**: usa tarjetas de prueba, no reales.
- Usuarios de ejemplo (contraseña `123456`, ya verificados): `ana@ejemplo.es` (maestra, curso `RUSO123`), `boris@ejemplo.es` (maestro, curso `VIAJE99`), `lucia@ejemplo.es`, `diego@ejemplo.es` y `marta@ejemplo.es`.

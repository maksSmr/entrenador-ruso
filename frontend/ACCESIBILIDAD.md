# Lista de verificación de accesibilidad (Lighthouse + teclado)

Esta lista se aplica a todo el frontend de `entrenador-ruso`. Márcala a mano antes de entregar.

## Lighthouse / DevTools

- [ ] Ejecutar Lighthouse → **Accessibility ≥ 95** en `/`, `/login`, `/panel` y `/maestro`.
- [ ] Todas las imágenes tienen `alt` descriptivo (o `alt=""` si son decorativas).
- [ ] Ningún botón sin texto visible: los de solo icono llevan `aria-label` (audio, borrar, teclado).
- [ ] Contraste ≥ 4.5:1 en texto normal y ≥ 3:1 en títulos grandes y bordes de controles.
- [ ] Cada campo tiene `<label for>` asociado a su `id`.
- [ ] Los errores de formulario usan `role="alert"` / `aria-live` y `aria-invalid`.
- [ ] Cada página tiene un único `<h1>` y un orden lógico `h1 → h2 → h3`.
- [ ] Cada página tiene `document.title` y `<meta name="description">` distintos (`DocumentoTitulo`).
- [ ] Estructura semántica: `header`, `nav`, `main`, `section`, `footer`.
- [ ] Las tablas usan `<th scope="col">`.

## Navegación solo con teclado

- [ ] El enlace **Saltar al contenido** aparece con `Tab` y lleva a `#contenido-principal`.
- [ ] El foco siempre es visible (borde ámbar de 3 px) y nunca se pierde al cerrar un diálogo o mostrar un mensaje.
- [ ] `Tab` / `Mayús+Tab` recorren cabecera, navegación, contenido y pie sin trampas de foco.
- [ ] La tarjeta de repaso se voltea con `Intro` o `Espacio` además del clic.
- [ ] El teclado cirílico en pantalla se puede usar con `Tab` + `Intro`/`Espacio`.
- [ ] Los quizzes se responden y se avanza sin ratón.
- [ ] Los mensajes de acierto/error reciben el foco o se anuncian con `aria-live`.
- [ ] Las confirmaciones de borrado se pueden aceptar y cancelar con el teclado.

## Movimiento y sonido

- [ ] Con `prefers-reduced-motion: reduce`, la animación de volteo y el cargador se desactivan.
- [ ] El audio nunca se reproduce automáticamente: siempre lo inicia un botón.
- [ ] Si no hay voz para el idioma, aparece un mensaje accesible con la transcripción.

## Comprobación rápida en Chrome

1. `npm run dev` y abrir `http://localhost:5173`.
2. DevTools → Lighthouse → Accessibility → Analyze page load.
3. `F6` para entrar en la barra de direcciones, luego `Tab` desde el principio y recorrer toda la página.
4. Desactivar el ratón: completar un registro, un repaso y un quiz solo con teclado.
5. Sistema → Reducir movimiento; recargar y comprobar que no hay animaciones.

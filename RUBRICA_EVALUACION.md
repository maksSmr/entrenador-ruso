# Evaluación frente a la rúbrica (estado actual)

Fuente: `Rubrica_Proyecto_Web_FullStack.pdf` (Manual FullStack Junior, ciberecus.mx). Escala 0–100.

> Estimación basada en el código actual del repo y en las pruebas que ya reportaste como correctas. La defensa oral no se puede evaluar desde el código: ahí te doy una estimación y cómo subirla.

## Resultado estimado ahora

| Criterio | Máx. | Ahora | Falta |
|---|---:|---:|---:|
| 1. Funcionalidad del producto | 24 | **21** | +3 |
| 2. Integración de los temas del curso | 24 | **21** | +3 |
| 3. Aportaciones ingeniosas / valor agregado | 20 | **20** | 0 |
| 4. Diseño, UI/UX y responsividad | 12 | **10** | +2 |
| 5. Calidad del código y buenas prácticas | 12 | **10** | +2 |
| 6. Presentación y defensa oral | 8 | **6** | +2 |
| **CALIFICACIÓN FINAL** | **100** | **88 — Notable** | **+12** |

Estás a **2 puntos de Sobresaliente (90)** y a 12 del máximo. Lo bueno: los 12 puntos que faltan son cosas muy concretas y rápidas, no requieren rehacer el proyecto.

---

## 1. Funcionalidad — 21/24

**A favor:** CRUD completo, navegación por roles, formularios con validación Zod, 60 pruebas backend + 16 frontend, `npm audit` limpio, build correcto, flujos probados de registro → verificación → login → curso → repaso → quiz → plan.

**Lo que te quita 3 puntos:** el contrato de `/panel/alumno`. El backend devuelve `cursos`, `quizzes` y `tarjetas_pendientes` como **números**; tu `PanelAlumno.jsx` los normaliza con `|| []` y un `Array.isArray`. La pantalla no se rompe (tu parche funciona), pero:

- La métrica «Tarjetas hoy» muestra `0` aunque haya pendientes, porque `pendientes.length` no existe en un número.
- La sección «Últimos quizzes» no se pinta, porque `datos.quizzes?.length` es `undefined`.
- «Mis cursos» muestra `Cursos inscritos: N` en vez de las tarjetas de cada curso.

Para un evaluador que hace clic, es una función secundaria incompleta, no un crash. Por eso 21 y no 18.

**Decisión respetada:** tú elegiste conservar tu versión ya probada. Si la mantienes, este criterio se queda en 21 y el techo realista es 97/100. Si alineas el contrato, sube a 24.

---

## 2. Integración de temas — 21/24

**Hoja de cotejo (evidencia):**

| Tema | Estado | Evidencia |
|---|---|---|
| HTML5 semántico | SÍ | `header`, `nav`, `main`, `section`, `article`, `footer` en `App.jsx` y páginas |
| Accesibilidad básica | SÍ | `aria-*`, `role`, `alt`, foco visible, `prefers-reduced-motion`, «Saltar al contenido» |
| CSS3 + Flexbox/Grid | SÍ | `frontend/src/estilos/global.css` |
| Diseño responsive | SÍ | 4 media queries, enfoque mobile-first |
| JavaScript ES6+ | SÍ | módulos, `async/await`, desestructuración, spread |
| DOM y eventos | SÍ | `useRef` para foco, giro de tarjeta con teclado |
| Async, Promises y Fetch | SÍ | `frontend/src/servicios/api.js` |
| React: componentes y props | SÍ | Atomic Design completo |
| Hooks | SÍ | `useState`, `useEffect`, `useRef`, `useContext`, `useNavigate` |
| React Router | SÍ | `Rutas.jsx`, `RutaProtegida.jsx`, `RutaPorRol.jsx` |
| Estilos en React / design system | SÍ | átomos + moléculas + organismos + variables CSS |
| Consumo de APIs externas | **PARCIAL** | Stripe, Resend y Gemini están implementados, pero sin claves en local; `speechSynthesis` es API del navegador |
| SEO básico y metadatos | SÍ | `DocumentoTitulo` en las 18 páginas (título + meta descripción) |
| Node.js / Express | SÍ | `server.js`, `app.js`, rutas y middlewares |
| Formularios GET/POST | SÍ | alta, login, cursos, lecciones, tarjetas, quiz, repaso |
| Base de datos | SÍ | PostgreSQL en Neon, 7 migraciones + semilla |
| CRUD completo | SÍ | cursos, lecciones, tarjetas, inscripciones |
| API REST y autenticación JWT | SÍ | JWT + bcrypt + roles + 404 multi-tenant |
| Deploy / hosting | **NO** | Solo existe `GUIA_DESPLIEGUE.md`; no hay URL pública desplegada |
| Git / GitHub | **PARCIAL** | Hay commit local, pero `git remote -v` está vacío: no hay repo remoto ni push |
| Testing automatizado | SÍ | Jest + Supertest + RTL, 76 pruebas |
| CI/CD | **PARCIAL** | `.github/workflows/ci.yml` existe, pero al no haber push no se ha visto en verde en GitHub |
| Seguridad básica | SÍ | Zod, SHA-256, rate limit, CORS, firma de webhook, aislamiento por maestro |

**Lo que te quita 3 puntos:** `Deploy = NO`, `Git/GitHub = PARCIAL`, `CI/CD = PARCIAL`, `APIs externas = PARCIAL`. Todo se resuelve publicando y subiendo a GitHub.

---

## 3. Aportaciones ingeniosas — 20/20 (máximo)

Ya tienes nivel Excelente. Evidencia para la defensa:

- Leitner de 5 cajas con zona horaria `America/Mexico_City`.
- XP, racha, niveles y bonus por racha múltiplo de 7.
- Aislamiento multi-maestro con 404 deliberado para no revelar recursos ajenos.
- Importación CSV de hasta 500 filas con resumen de importadas/omitidas.
- Convertidor de cirílico (transliteración + teclado ЙЦУКЕН), marcado de acento U+0301 y audio con `speechSynthesis`.
- Webhook de Stripe con firma verificada e idempotencia en `eventos_stripe`.
- Verificación de correo con tokens hasheados, reenvío limitado y recuperación de contraseña.
- Generación de tarjetas desde PDF/DOCX con Gemini, con revisión editorial del maestro antes de guardar.
- Reportes reales: % de repaso por lección, top 10 de tarjetas falladas, alumnos inactivos 7 días.
- Planes con límites y portal de facturación.

**Único consejo:** muéstralos en la presentación. Lo que no se demuestra, el evaluador no lo puntúa.

---

## 4. Diseño, UI/UX y responsividad — 10/12

**A favor:** diseño consistente con variables CSS, mobile-first, foco visible, reduced motion, estados de carga/vacío/error, flashcards con giro por teclado, una sola etiqueta `<h1>` por página.

**Lo que te quita 2 puntos:** no hay evidencia visual de revisión en móvil/tablet/escritorio, y faltan pequeños detalles de pulido (skeletons, toasts de confirmación, y el panel alumno con secciones vacías). Para 12/12:

1. Abre la app en 3 tamaños (375 px, 768 px, 1280 px) y toma capturas. Corrige cualquier desbordamiento.
2. Pasa Lighthouse/axe y anota contraste y accesibilidad.
3. Añade toasts para «Curso creado», «CSV importado», «Contraseña cambiada».

---

## 5. Calidad del código — 10/12

**A favor:** separación por capas (rutas → controladores → servicios → utilidades), nombres en español, comentarios breves, validación centralizada, errores JSON uniformes, 76 pruebas, auditorías limpias.

**Lo que te quita 2 puntos:**

- No hay remote de GitHub (`git remote -v` vacío): el criterio pide explícitamente «control de versiones (Git/GitHub)».
- El bloque de `PanelAlumno.jsx` que añadiste tiene indentación irregular y mezcla dos convenciones de fallback.
- No hay ESLint/Prettier configurados.
- `console.log` en servidor en vez de logger (no es error en consola del navegador, pero resta pulido).

Para 12/12: crea el repo remoto, haz push, configura ESLint + Prettier, formatea el proyecto y commitea los dos documentos nuevos que están sin seguimiento.

---

## 6. Presentación y defensa — 6/8 (estimado)

No es evaluable desde el código. Tienes `GUIA_DEFENSA.md` con mapa de temas, capturas sugeridas y preguntas habituales: eso ya vale el 6. Para 8/8, practica este guion de 5 minutos:

1. **Minuto 1 — El problema.** «Los maestros de idiomas necesitan asignar práctica y ver quién la hace; los alumnos necesitan saber qué repasar hoy sin decidirlo ellos.»
2. **Minuto 2 — La solución.** Recorrido usuario: maestro crea curso → código → alumno entra → tarjetas → repaso → quiz → reportes. Muestra 3 capturas.
3. **Minuto 3 — Arquitectura.** Dos apps: React por un lado, Express + PostgreSQL por otro. Un solo pool, JWT con roles, SQL filtrado por maestro o inscripción.
4. **Minuto 4 — Decisiones técnicas.** 404 en vez de 403; Leitner 1/2/4/7/15; token de verificación hasheado; webhook idempotente; Neon por ser Postgres administrado.
5. **Minuto 5 — Calidad y cierre.** 76 pruebas, CI, audit limpio, planes y Stripe modo prueba. «Lo que sigue es desplegar y pulir el panel del alumno.»

Preguntas que casi seguro caen: por qué 404, por qué no XAMPP, qué pasa si no verifica correo, cómo se calcula XP, cómo se decide la próxima revisión, cómo evitas que un maestro vea otro curso. Todas están respondidas en `GUIA_DEFENSA.md`.

---

## Plan para llegar a 100 (orden por puntos ganados)

### Paso 1 — Públicalo (+3 en integración, +1 en calidad)

- Crea repo en GitHub y conecta el local:

```powershell
git remote add origin https://github.com/TU_USUARIO/entrenador-ruso.git
git branch -M main
git add ARQUITECTURA_Y_MEJORAS.md GUIA_USUARIO.md RUBRICA_EVALUACION.md
git commit -m "docs: arquitectura, guia de usuario y evaluacion por rubrica"
git push -u origin main
```

- Backend en Render: `npm run start`, variables `DATABASE_URL`, `JWT_SECRET`, `DB_SSL=true`, `FRONTEND_URL`, `PORT=3000`.
- Frontend en Vercel: `VITE_API_URL=https://TU-API.onrender.com`.
- Comprueba `https://TU-API.onrender.com/salud` y pega la URL pública en el README.
- Configura Resend (dominio verificado o `onboarding@resend.dev` para prueba) y Stripe en modo prueba con sus claves de test. El checklist de «APIs externas» pasa a SÍ y el CI se ve en verde.

### Paso 2 — Alinea el panel del alumno (+3 en funcionalidad)
Decide el contrato: el backend devuelve listas de cursos/tarjetas/quizzes y el frontend las pinta. Mantén `Array.isArray` como red de seguridad y añade una prueba de contrato.

### Paso 3 — Pulido visual (+2 en diseño)
Capturas en 375/768/1280 px, Lighthouse, toasts y skeletons.

### Paso 4 — Calidad (+1 restante en código)
ESLint + Prettier, formatear, logger estructurado y commit final.

### Paso 5 — Defensa (+2)
Ensayar el guion de 5 minutos con el proyecto abierto y las 8 capturas de `GUIA_DEFENSA.md`.

**Resultado:** 24 + 24 + 20 + 12 + 12 + 8 = **100/100 — Sobresaliente**.

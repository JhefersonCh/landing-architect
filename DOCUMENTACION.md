# LANDING PAGE PROMPT ARCHITECT

## 0. Decisiones de arquitectura

La herramienta se construyó como un **estudio de ingeniería de prompts**, no como un generador de texto suelto. Cada vista del flujo (Setup → Contexto y tecnologías → Generador → Ejecutor → Banco) corresponde a una transición real: contexto de negocio → decisiones de diseño → prompt → ejecución → landing page.

Decisiones clave:

- **Vanilla HTML/CSS/JS sin build step**: la especificación lo exige y evita introducir complejidad no justificada (Diseño Sustractivo aplicado a la propia stack).
- **Separación estricta entre lógica pura y DOM** en `app.js`: todas las funciones de generación de prompts (SSoT, arquitectura de página, combinación de tecnologías) no tocan `document`, lo que permite verificarlas desde Node sin levantar un navegador.
- **Vertical = contexto de negocio, Tecnología = implementación**: son dos diccionarios de conocimiento independientes (`VERTICALS`, `TECHNOLOGIES`) que alimentan bloques distintos del prompt final, nunca se mezclan como un único concepto.
- **SSoT como mecanismo, no como paleta fija**: una única cadena aleatoria por generación deriva, mediante hashing + suma módulo sobre distintos tramos de la cadena, ocho decisiones creativas independientes. Desde SSoT visible (§4) la cadena semilla es un hexadecimal que el usuario ve, copia, regenera o reemplaza en el paso 2; el modelo ejecutor no la expone en el resultado.
- **Aislamiento de ejecución**: el HTML producido por el modelo nunca corre en el contexto de la aplicación principal; se delega a `iframe.html`, cargado en un `<iframe sandbox="allow-scripts">` sin `allow-same-origin`.
- **El prompt final lo escribe un modelo, no una plantilla, salvo que el modelo no esté disponible**: desde esta actualización, `Generador` le pide a OpenCode local que ESCRIBA el prompt de 16 encabezados (meta-prompt, sección 3b), en vez de ensamblarlo con las funciones `build*Block` de `app.js`. Esas funciones no se eliminaron: pasaron a ser `generateTemplatePrompt`, el respaldo determinístico cuando el modelo no está disponible o no pasa la validación (sección 3c).
- **Cola single-flight en `server.js`**: cualquier llamada al CLI de OpenCode (generar landing, escribir el meta-prompt, reparar, editar con IA) pasa por la misma cola secuencial (`enqueue`/`activeRuns`), nunca dos procesos `opencode run` en paralelo — el free tier de Zen es anti-abuso y dos llamadas simultáneas pueden hacer fallar ambas.
- **El Estudio (editor de código) vive dentro del Ejecutor**, no como un paso nuevo del flujo: se evaluó agregar un sexto paso ("06 · Estudio") y se descartó (diseño sustractivo, sección 7) porque el Ejecutor ya es "ver el resultado"; convertirlo en un workspace dividido (código + preview) evita duplicar la vista previa y un nuevo ítem de navegación que haría lo mismo que "visualizar/editar" dentro del flujo ya definido: crear → generar → revisar → ejecutar → **visualizar/editar** → guardar → volver a ejecutar.

### SSoT aplicado al rediseño visual

El rediseño de `index.html` y `styles.css` no se eligió a mano: se aplicó el mismo mecanismo SSoT descrito en pub.sakana.ai/ssot/ (generar una cadena aleatoria → manipularla con sum-mod / rolling hash sobre distintos tramos → usar el resultado para elegir entre alternativas pre-validadas) pero en **tiempo de diseño**, mediante un script Node ejecutado una sola vez (no re-rolleado por gusto). Las diez dimensiones y sus alternativas se definieron ANTES de generar la semilla:

| Dimensión | Alternativas pre-validadas | Elegida por SSoT |
|---|---|---|
| Composición general | editorial / modular / split-workspace / **ledger-tabular** | **ledger-tabular** |
| Navegación | pasos horizontales superiores / **rail vertical lateral** / breadcrumb flotante mínimo | **rail vertical lateral** |
| Densidad informativa | baja / **media** | **media** |
| Contraste | alto / **moderado** | **moderado** |
| Tipografía | editorial-serif (Fraunces + Newsreader) / técnico-grotesk (Archivo + Work Sans) / **utilitario-condensado (Big Shoulders Display + Libre Franklin + Spline Sans Mono)** | **utilitario-condensado** |
| Paleta (con variante clara y oscura) | terracota-papel / musgo-ledger / **cobalto-piedra** | **cobalto-piedra** |
| Tratamiento de acento | subrayado simple / **borde izquierdo en estado activo** / etiqueta sólida en activo | **borde izquierdo en activo** |
| Ritmo de espaciado | **compacto (base 4px)** / espacioso (base 8px) | **compacto (base 4px)** |
| Lenguaje de bordes | **esquinas vivas (0px)** / micro-radio (2–3px) / mixto | **esquinas vivas (0px)** |
| Layout del workspace del Generador | **apilado simple** / dos columnas con sidebar / tres paneles (tabs + meta + editor) | **apilado simple** |

La cadena semilla en sí no se expone (igual que en los prompts generados): sólo se documentan las decisiones resultantes. Ninguna alternativa se descartó por gusto una vez obtenido el resultado; el conjunto de opciones por dimensión ya estaba fijado en el script (`design_ssot.js`, ejecutado fuera del repo) antes de invocar `crypto.randomBytes`.

El resultado es coherente: un panel de control tipo "ledger" (filas tabulares, numeración, monoespaciado para datos) con navegación fija en un riel lateral, paleta fría cobalto/piedra con acento como borde izquierdo — nada de esto se mezcla con las restricciones negativas (sin púrpura, sin bento grid, sin glassmorphism, sin card-in-card, sin sombras, sin radios indiscriminados).

### Rediseño artístico (SSoT v2)

El usuario pidió explícitamente reemplazar la estética "ledger" anterior (muy cuadrada, poco artística) por una interfaz visualmente ambiciosa y exagerada, y **levantó, únicamente para la interfaz de la app** (no para los prompts/landings generados, que siguen bajo las restricciones negativas de la sección 8), las restricciones previas de "sin sombras / sin bordes redondeados / sin animación decorativa". Se corrió un segundo roll de SSoT (semilla criptográfica real, alternativas fijadas antes de rollear) para esta capa visual:

| Dimensión | Elegida por SSoT v2 |
|---|---|
| Mundo/metáfora | Laboratorio de tipografía: tipos móviles de plomo, prensa, bandejas de tipos, rodillo de tinta |
| Paleta | Papel `#FFF8E7` + ultramar `#2F3BFF` + amarillo `#FFD23F` + rosa `#FF7AB6`, con variante oscura ultramar-noche (`#100e2c`/`#17153b`) y texto color papel |
| Tipografía | Fraunces (display, ejes variables `SOFT`/`WONK`) + Space Grotesk (UI/cuerpo) + JetBrains Mono (código/meta) |
| Héroe 3D | Maqueta de navegador en perspectiva CSS (`perspective`, `rotateX/rotateY`, profundidad por capas con `translateZ`), con un wireframe SVG dibujándose adentro y un lápiz animado; reacciona al mouse (tilt) vía `fx.js` |
| Bordes | Doble contorno risográfico desregistrado (`box-shadow` apilado en ultramar + rosa) en paneles, botones, chips, inputs y diálogos |
| Movimiento | Garabatos SVG (`.squiggle`) bajo los títulos de cada paso, revelados por scroll con `animation-timeline: view()` y fallback a `IntersectionObserver` en `fx.js` cuando el navegador no soporta scroll-driven animations |
| Fondo | Grano SVG (`feTurbulence` en data-URI, `mix-blend-mode`) + blobs de color difuminados (`filter: blur`) en movimiento lento, ocultos con `prefers-reduced-motion: reduce` |
| Motivo obligatorio del usuario | Lápices: cursor de lápiz en CTAs primarias (`--pencil-cursor`, data-URI), lápiz dibujando el wireframe del héroe, botones con efecto "prensa de tipos" (offset de sombra que se pisa al hacer `:active`, como un sello) |

Archivos tocados: `styles.css` (reescritura completa de la capa visual, misma estructura de selectores para no romper `app.js`/`loaders.js`), `index.html` (fuentes, fondo decorativo, héroe 3D, garabatos — se preservó cada `id`/`class`/`data-*` que consultan `app.js` y `loaders.js`, verificado con un script de chequeo), `fx.js` (nuevo, `defer`, sólo tilt del héroe + fallback de scroll-driven animation; no toca la lógica de generación de prompts en `app.js`).

## 1. Arquitectura de archivos

```
/index.html          — shell de la app y las 5 vistas (incluye CodeMirror 5 vía cdnjs para el Estudio, con respaldo a <textarea> si el CDN no carga)
/styles.css          — variables, layout responsive, estados, accesibilidad, Estudio (split workspace); capa visual "laboratorio de tipografía" (SSoT v2, ver sección 0)
/app.js              — estado, generación de prompts (modelo + plantilla), SSoT, Estudio (editor/IA/versiones), storage legado, cliente REST del Banco, banco
/fx.js               — capa decorativa de la UI (tilt del héroe 3D, fallback de scroll-driven animation); no toca la lógica de `app.js`
/bank-store.js        — persistencia del Banco en disco: split de HTML en index.html+styles.css+script.js, layout de banco/<id>/, CRUD atómico (ver más abajo)
/iframe.html          — superficie de preview aislada (sandboxed); además retransmite los mensajes "lpa:*" del click-to-code entre el iframe con el HTML generado y la app principal
/server.js            — servidor estático + proxy local + ejecución del CLI de OpenCode (cola single-flight + cancelación) + REST /api/banco + rutas /api/media y /media (Fase D)
/media.js             — multimedia real (Fase D): parser .env, subidas, Pexels/Pixabay, Cloudflare FLUX/Pollinations, Gemini visión (ver sección 6d)
/media/<sesión>/       — archivos subidos, fotos descargadas e imágenes generadas (se crea sola; ignorada por git)
/banco/<id>/           — el Banco (landings guardadas), persistido en DISCO dentro del proyecto (ver layout debajo); se crea vacío al arrancar `server.js` si no existe
(sin /runs/ en el proyecto) — el proveedor OpenCode local usa `os.tmpdir()/lpa-opencode/<runId>/` (fuera del repo, se autogenera, se poda a los últimos 20); ver sección "OpenCode local" más abajo
/DOCUMENTACION.md     — este documento
```

### El Banco: persistencia en disco (`banco/<id>/`)

El Banco dejó de vivir sólo en `localStorage` (límite de cuota del navegador, no versionable, no compartible) y ahora persiste como archivos reales dentro del proyecto, uno por landing guardada:

```
banco/
  <YYYY-MM-DD>-<slug-tema>-<4 hex>/
    index.html        — documento HTML servible tal cual; si hubo split, enlaza ./styles.css y/o ./script.js
    styles.css         — sólo si split.css=true: concatenación en orden de los <style> propios del documento
    script.js          — sólo si split.js=true: concatenación en orden de los <script> inline "seguros" (ver reglas abajo)
    prompt.md          — el prompt exacto que produjo esta landing
    meta.json           — {id, tema, proyecto (objeto completo del Setup), verticals, customVertical, technologies, model, provider, createdAt, updatedAt, split:{css,js}, versions:[{id, source, instruction?, date, file}]}
    versiones/
      v1.html … vN.html — cada versión del Estudio como HTML de un solo archivo (tope: últimas 20, se reescribe entera en cada guardado)
```

`id` = `<fecha>-<slug del tema>-<4 hex aleatorios>`, y es a la vez el nombre de la carpeta y el identificador REST. Se valida con una regex estricta (`^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]{1,80}$`, sin `.`/`/`/mayúsculas) tanto en las rutas del API como en las estáticas, así que un intento de path traversal (`../`, ids con puntos, etc.) simplemente no matchea y se rechaza — no depende de sanitizar strings.

**Reglas de split** (`bank-store.js`, `splitHtmlDocument`): `styles.css` junta todos los `<style>` del documento, en orden; `script.js` junta los `<script>` inline sin `src` cuyo `type` sea JS ejecutable de siempre (vacío, `text/javascript`, `application/javascript`, etc.) — **no** se tocan los `<script>` con `type="module"`, `"importmap"`, `application/json`, `text/babel` (React sin build) ni cualquier otro tipo no reconocido: esos quedan inline tal cual. Los `<script src="...">` (CDN) tampoco se tocan nunca. Para no romper el orden de ejecución, el `<script src="./script.js">` combinado se coloca exactamente en la posición del primer `<script>` extraído; si entre el primer y el último script "extraíble" hay de por medio un script de otro tipo (CDN o no-extraíble) — es decir, si juntarlos cambiaría el orden relativo —, la partición se cancela por completo y **todos** los scripts quedan inline (conservador: se prefiere no partir a partir mal). La misma lógica de "no partir si hay riesgo de interleaving" aplica a los `<style>` respecto de `<link rel="stylesheet">` externos. Cuando no hay nada seguro para partir, `index.html` queda como el documento original completo y `meta.json` registra `split: {css:false, js:false}` (no se generan `styles.css`/`script.js` vacíos).

**Decisión: no se guarda un `original.html` aparte.** El Estudio necesita una única cadena HTML para editar. En vez de duplicar el documento completo en disco (con el riesgo de que las dos copias diverjan tras un `PUT`), `bank-store.js` **reensambla** el HTML canónico en memoria a partir de `index.html` + `styles.css` + `script.js` cuando hace falta (`reassembleCanonicalHtml`, la inversa exacta de `splitHtmlDocument`: reemplaza el `<link>`/`<script src>` insertados por el `<style>`/`<script>` originales). Es la opción más simple y robusta: una sola fuente de verdad en disco (`index.html` + sus partes), sin copias que puedan quedar desincronizadas.

**Endpoints REST** (`server.js`, JSON, errores en español, body limit de 20 MB para `/api/banco*` — más alto que los 2 MB del resto porque el HTML con varias versiones embebidas pesa más, escritura atómica vía archivo temporal + `rename`):

- `GET /api/banco` → lista liviana desde `meta.json` de cada carpeta (sin `html`/`prompt`), más nuevas primero.
- `GET /api/banco/:id` → `meta` + `prompt` + `html` canónico (reensamblado) + `versions` con el html de cada versión ya leído del disco (para "Restaurar" en el Estudio).
- `POST /api/banco` → crea `{project, verticals, technologies, prompt, html, model?, provider?, versions?}`.
- `PUT /api/banco/:id` → actualiza `{html?, versions?}` (re-parte el HTML y reescribe `versiones/` entera, tope 20).
- `POST /api/banco/:id/duplicate` → copia completa (archivos + versiones) con un `id` nuevo y `"(copia)"` en el tema.
- `DELETE /api/banco/:id` → borra la carpeta entera.
- Estático: `banco/<id>/index.html`, `styles.css`, `script.js` y `versiones/v<N>.html` se sirven con el content-type correcto; `meta.json` y `prompt.md` **nunca** se exponen como archivo suelto (sólo vía el REST JSON) y no hay listado de directorios — todo lo demás dentro de `banco/` devuelve 403.

**Cliente** (`app.js`, dentro del bootstrap de navegador): `renderBank`/`normalizeBankEntry` (sección 8/exportadas) aceptan tanto una entrada "servidor" (`folder`, miniatura por `<iframe src="/banco/<id>/index.html">`) como una entrada "legado" (`localStorage`, miniatura por `srcdoc`), así la misma función de render sirve para ambos modos sin duplicar markup. "Guardar en Banco" hace `POST` si la landing es nueva o `PUT` si se abrió/editó una landing existente del Banco (`state.openedFromBank`); "Ejecutar nuevamente" resetea ese id porque genera contenido nuevo. Si la app se abre con `file://` (sin servidor), el Banco cae a un respaldo de **sólo lectura** sobre la clave legada `lpa_bank_v1` de `localStorage`, con un aviso explícito. Con servidor disponible y datos legados en `localStorage`, se ofrece un botón "Importar N diseños guardados en el navegador al disco" que hace `POST /api/banco` uno por uno y marca `lpa_bank_migrated_v1` al terminar — **no borra** `localStorage`, sólo evita reofrecer la importación.

### Cómo ejecutar

La app funciona abriendo `index.html` directamente (`file://`), pero algunos proveedores del Ejecutor (por ejemplo opencode Zen) bloquean CORS para el origen `null` que usa `file://`. Para esos casos incluimos `server.js`, un servidor estático + proxy sin dependencias:

```bash
node server.js
# Landing Page Prompt Architect en http://localhost:3000
```

Luego abrir `http://localhost:3000` en el navegador. Puede cambiarse el puerto con `PORT=4000 node server.js`. Al correr así, `app.js` enruta automáticamente todas las llamadas del Ejecutor a través de `POST /api/proxy` (mismo origen, sin bloqueo de CORS). Si se abre la app con `file://` y el proveedor bloquea CORS, la app lo indica explícitamente y sugiere levantar `server.js`.

`app.js` se divide internamente en bloques numerados: conocimiento estructurado, SSoT, arquitectura de página, resolución de conflictos técnicos, bloques de texto del prompt, funciones públicas requeridas (5), **generación de prompt por modelo/meta-prompt (5b)**, ejecución contra proveedor (6), **Estudio: edición con IA, diff y click-to-code (6b)**, almacenamiento, renderizado del banco, exportación para Node, y bootstrap de interfaz (10, detrás de `typeof document !== 'undefined'`).

### Proveedor "OpenCode local (CLI, modelos gratis)"

Se probó primero usar la API HTTP de **opencode Zen** (`https://opencode.ai/zen/v1`, compatible con OpenAI) a través del proxy de `server.js`. El proveedor la rechaza para su nivel gratuito con `{"type":"FreeTierError","message":"OpenCode's free tier can only be used from within OpenCode"}`: el nivel gratis de Zen sólo acepta peticiones que provengan del propio cliente OpenCode (verificado por su backend, no por CORS). **No** se intentó falsificar cabeceras o un user-agent para hacerse pasar por el cliente OpenCode: eso sería suplantar un cliente ante un proveedor externo, algo que esta app no hace.

En cambio, se agregó un proveedor legítimo que **ejecuta el CLI de OpenCode ya instalado en la máquina** (`~/.opencode/bin/opencode`, u `opencode` si está en el PATH; versión probada: 1.18.32, la última disponible). **No hace falta login/cuenta de opencode Zen**: `opencode auth list` puede no tener ninguna credencial de Zen y `opencode run` contra modelos `-free` funciona igual (confirmado con pruebas reales repetidas).

**Root cause real (confirmado por bisección real, variable por variable, con ≥10 s entre llamadas para no gatillar el anti-abuso de Zen):** NO es la falta de pseudo-terminal (esa teoría vieja no se reprodujo: `opencode run` vía `child_process.spawn` normal, sin pty, responde bien). NO es `--format json`, ni el flag `--dir`, ni que el `cwd` esté dentro del proyecto, ni el largo/contenido del prompt (se probó con el prompt real de 12000 caracteres que genera la app) — todos esos, uno por uno, con el modelo `opencode/muse-spark-1.3-contributor-free`, respondieron bien. El culprit real es **escribirle a OpenCode un `opencode.json` propio por-run** (el que este archivo tenía antes, con `permission: deny` y/o `mcp: {*: enabled:false}`): con ese archivo presente, la MISMA llamada (mismo modelo, mismo prompt largo, mismo `--dir`, mismo `child_process.spawn`) que acababa de funcionar en 61 s pasó a fallar en 5 s con `403 FreeTierError` ("can only be used from within OpenCode"). Conclusión: el backend gratuito de Zen valida que la config efectiva del cliente sea la default de OpenCode; cualquier `opencode.json` no-default (aunque sólo toque `permission`/`mcp`, sin tocar `tools`) alcanza para que lo rechace. Por eso **ya no se escribe ningún `opencode.json` por-run**.

**Tradeoff de seguridad, dicho explícitamente:** al no restringir `permission`/`tools`, el agente por defecto de OpenCode **sí tiene disponibles las herramientas de bash/editar/escribir/buscar en la web** si decidiera usarlas — no están bloqueadas a nivel de config. La única mitigación real son (a) la instrucción en el prompt pidiéndole explícitamente que no use ninguna herramienta y responda sólo con el HTML como texto, y (b) que el directorio de trabajo (`--dir`) es un directorio vacío y descartable **fuera del proyecto** (`os.tmpdir()/lpa-opencode/<runId>`, no `runs/` dentro del repo), así que si el modelo ignorara la instrucción y tocara archivos, sería ahí y no en el código de la app. Esto NO es un sandbox: bash con las herramientas por defecto puede en principio ejecutar cualquier comando con los permisos del usuario que corre `node server.js` (igual que si el usuario mismo corriera `opencode run` a mano). Se documenta así, honestamente, porque restringir permisos rompe el free tier de Zen y no hay una alternativa confirmada que mantenga ambas cosas (restricción real + free tier funcionando).

- `GET /api/opencode/models`: corre `opencode models` (sin shell, `execFile` con argv array; liviano, <1 s) para listar ids. **No prueba cada modelo** en cada carga (se sacó el probing activo: además de gastar presupuesto del free tier en cada apertura del diálogo, un probe podía fallar/colgarse aunque el modelo estuviera bien, dando falsos negativos). En cambio marca `recommended: true` en `opencode/muse-spark-1.3-contributor-free`, confirmado funcionando con múltiples pruebas reales (incluida la bisección) en esta sesión. Devuelve `{id, provider, model, free, recommended}`; el select de la UI muestra el recomendado primero. Se cachea `OPENCODE_MODELS_CACHE_MS` (default 30 min); `?refresh=1` fuerza releer la lista (botón "Actualizar modelos").
- `POST /api/opencode/complete` **(endpoint genérico, Feature 1/2)**: valida `{prompt, model, expect: 'text'|'html', runId?}`. `runId` lo genera el CLIENTE (no el servidor) y viaja en el cuerpo de la request: así puede cancelarla (`POST /api/opencode/cancel {runId}`) mientras sigue en cola o corriendo, sin necesitar streaming HTTP. Encola la request (`enqueue`, single-flight: nunca dos `opencode run` en paralelo en todo el servidor) y corre el mismo orquestador con fallback entre modelos gratis que antes tenía `/run`. Devuelve `{text, model, runId, attempts}` si `expect==='text'` o `{html, model, runId, attempts}` si `expect==='html'`. Usado por: generación del meta-prompt, su reparación, y la edición de HTML con IA en el Estudio (sección 6b).
- `POST /api/opencode/run` **(wrapper delgado, compatibilidad)**: misma forma de respuesta que antes (`{html, model, runId, attempts}`); por debajo llama al mismo orquestador que `/complete` con `expect:'html'`, así que respeta la misma cola single-flight. Es lo que usa la ejecución final del prompt (paso "Ejecutar Prompt" del Generador) cuando el proveedor elegido es "OpenCode local". El orquestador **prueba el modelo pedido y, si falla, hace fallback automático** al resto de modelos `-free` (el recomendado primero), hasta `OPENCODE_MAX_ATTEMPTS` (default 8) o hasta agotar `OPENCODE_TOTAL_BUDGET_MS` (default 6 min) para toda la request. Cada intento tiene `OPENCODE_ATTEMPT_TIMEOUT_MS` (default 120 s) y un timeout de "primera respuesta" (`OPENCODE_FIRST_BYTE_TIMEOUT_MS`, default 45 s) por si el free tier no manda ni un byte, con `status` en `ok | timeout | stall | sin-html | sin-texto | cancelled | error`.
- `POST /api/opencode/cancel {runId}`: cancelación cooperativa. Si ese `runId` tiene un proceso `opencode` corriendo en este momento, lo mata (`SIGTERM`, y `SIGKILL` a los 3 s si sigue vivo) inmediatamente; si todavía está esperando en la cola, se lo salta apenas le toque el turno. Responde `{ok:true, found:true|false}` — `found:false` sólo significa que ya había terminado o que el id no existe, no es un error.
- `GET /api/opencode/queue`: `{length}` — cuántas requests esperan su turno en la cola single-flight (no cuenta la que está corriendo). La UI lo usa implícitamente al mostrar "Generando…"/"Aplicando el cambio…" con cronómetro; no hay una vista dedicada de posición en cola porque con un solo usuario por sesión de navegador el caso común es 0 o 1.
- La respuesta del modelo se pide como texto plano (`--format json`, se arma concatenando los eventos NDJSON con `part.type === "text"`), nunca como archivo escrito por el modelo — así no depende de que elija bien una herramienta de escritura.
- **Sin procesos huérfanos:** cada intento corre con `detached: true` y se mata con `process.kill(-pid, 'SIGTERM')` (grupo completo) tanto al agotarse su timeout como si el cliente corta la conexión; verificado con `ps aux` que no queda nada corriendo. Se conservan sólo los últimos 20 directorios de `os.tmpdir()/lpa-opencode/` (poda automática).

En el diálogo de proveedor, elegir "OpenCode local" carga el select de modelos desde `/api/opencode/models` (recomendado primero) y sólo funciona servido por `node server.js` (no con `file://`). Durante la ejecución, si hubo fallback entre modelos, el estado del Ejecutor muestra el detalle de cada intento en español (p. ej. "Intentos: opencode/nemotron-3.5-lightning-free → sin respuesta (colgado) (45s); opencode/muse-spark-1.3-contributor-free → respondió (12s).").

Variables de entorno (todas opcionales, ver `server.js`): `OPENCODE_ATTEMPT_TIMEOUT_MS`, `OPENCODE_TOTAL_BUDGET_MS`, `OPENCODE_FIRST_BYTE_TIMEOUT_MS`, `OPENCODE_MAX_ATTEMPTS`, `OPENCODE_MODELS_CACHE_MS`, `OPENCODE_PROBE_TIMEOUT_MS`.

### Streaming de la ejecución (Ejecutor / Estudio)

`executeCurrent` pide la landing en streaming por defecto, para ver cómo se arma en vez de esperar 1,5-4 min sin señales.

- **`POST /api/proxy`** acepta `stream: true` en el payload: reenvía al proveedor con `stream: true` en su cuerpo y pasa los bytes SSE tal cual (`text/event-stream`, sin buffer). Soporta OpenAI-compatible (`delta.content`, `delta.reasoning_content` en modelos que razonan) y Anthropic (`text_delta`/`thinking_delta`). Mantiene timeout, aborta el upstream si el cliente corta y registra UNA línea `[proxy]` en la terminal (con `finish_reason` y tokens); no guarda el contenido de la respuesta.
- **`POST /api/opencode/complete`** con `stream: true` responde NDJSON (`application/x-ndjson`): `start`, `attempt`, `delta` (texto acumulado), `restart` (cambio de modelo: el cliente descarta el parcial), y al final `done` (`html|text`, `model`, `attempts`) o `error`. Si el cliente aborta se mata el proceso de `opencode`.
- **Cliente** (`app.js`): `createSseParser`/`createStreamAccumulator` (líneas partidas, CRLF, `[DONE]`, razonamiento), `runPrompt(cfg, prompt, { stream, onDelta(textoAcumulado, { reasoningChars }), signal })` y `runOpencodeComplete({ ..., stream, onDelta, signal })` devuelven la misma forma final que sin streaming (la truncación sale de `finish_reason`; un stream cortado sin `finish_reason`/`[DONE]` cuenta como truncado).
- **UI**: contador de caracteres/tokens aproximados + tiempo en `#ejecutor-status` ("Razonando… (N caracteres)" mientras sólo llega razonamiento); HTML único: cada ~800 ms el texto va al editor (sólo lectura mientras dura) y, en cuanto aparece `<body`, el HTML parcial (`partialPreviewHtml`: recorta `<script>` y etiquetas sin cerrar) se renderiza en la vista previa sandboxeada marcada "vista previa parcial"; multi-archivo: lista de archivos con tamaños a medida que aparecen los `=== FILE: … ===`. "Cancelar" aborta el `fetch` (AbortController) y el server aborta el upstream / mata opencode.
- **`loaders.js`**: con vista previa parcial visible (`#preview-wrap[data-streaming]`) el skeleton pasa a una barra fina de progreso y no tapa el contenido.
- **Respaldo**: si el proveedor rechaza `stream` (error HTTP que lo menciona) se reintenta una vez sin streaming; si responde JSON en vez de SSE se usa directo.
- No hay streaming del Generador (prompt writer): compite con la validación/reparación y aporta poco (el prompt es corto).
- **Solo pruebas**: `LPA_TEST_ALLOW_HTTP=1` permite que `/api/proxy` apunte a `http://` (upstream falso local). Apagado por defecto; nunca se usa en operación normal.

## 2. Estructura de interfaz

- **Setup**: arriba, campo libre **Descripción general** (`state.project.descripcion`, opcional) con el botón "Completar campos con IA" (mín. 30 caracteres): pide al generador configurado (`runLLM`, `expect:'text'`, cancelable) un JSON con los campos del formulario; completa los vacíos, resalta lo completado y, en los que ya tenían texto, muestra la sugerencia con "Usar sugerencia" (nunca pisa lo tipeado). La descripción viaja al meta-prompt (`Descripción general (contexto libre de quien encarga)`), al bloque CONTEXTO de la plantilla, a los prompts de ideación/imágenes/búsquedas (`briefLines`, ~800 caracteres) y al `meta.proyecto` del Banco. Además: formulario con 5 campos obligatorios (Tema, Público objetivo, Oferta, Objetivo, Competidores) y 4 opcionales (tono, referencias visuales, propuesta de valor, restricciones adicionales). Validación inline en español. Botón "Cargar ejemplo" para demostración rápida (ver sección 7).
- **Contexto y tecnologías**: chips accesibles (`role="checkbox"`, `aria-checked`) para verticales y tecnologías, selección múltiple. Los verticales son **opcionales**: 20 rubros en grilla multi-columna + chip "Otro…" que revela `#input-vertical-otro` (máx. 80, `state.customVertical`). Se puede elegir listados, solo "Otro", ambos o ninguno; el único error es "Otro" activo y vacío (inline). El rubro libre viaja como clave `custom:<texto>` (`withCustomVertical`), sin conocimiento fijo: el meta-prompt y la plantilla piden inferir psicología, mercado, confianza y restricciones del rubro (`Rubro declarado por quien encarga: «X»…`); sin ningún vertical, piden inferirlo de los datos del proyecto y la Descripción general. `customVertical` se guarda en `meta.json` del Banco y se muestra en la tarjeta. Prueba: `tests/verticals.js`.
- **Generador**: pestañas por tecnología + pestaña "Combinado" cuando hay 2+ tecnologías, generadas de forma **perezosa** (sólo la pestaña activa; el resto se genera recién cuando se abre). Panel con estado de generación ("Generando el prompt con IA… Ns" + Cancelar, o "Generado con modelo X en Ys" / "Prompt generado con plantilla de respaldo: <motivo>"), estructura del prompt, restricciones técnicas aplicadas, textarea editable y dirección creativa (sección 3b/3c).
- **Ejecutor / Estudio**: configuración de proveedor (Anthropic / compatible con OpenAI / OpenCode local) en un `<dialog>`, estado de carga/error en español con botón Cancelar cuando el proveedor es OpenCode local, y un **workspace dividido** (sección 6b): editor de código a la izquierda, preview en iframe aislado a la derecha (pestañas Código/Vista previa en pantallas angostas), panel "Pedile un cambio a la IA" y panel de versiones. Acciones: Regenerar, Guardar versión, Copiar código, Descargar HTML, Guardar en Banco.
- **Banco**: grilla de tarjetas con miniatura (iframe sandboxeado escalado con CSS, sin librerías de captura), metadatos, prompt colapsable y acciones (Abrir, **Editar** —abre el Estudio con el historial de versiones de esa landing—, Ejecutar nuevamente, Copiar prompt, Duplicar, Eliminar con confirmación).
- **Edición protegida** (Generador y Estudio): un `<dialog id="dialog-confirm">` genérico (`showConfirmDialog`, mismo patrón visual que los diálogos, Escape cancela) reemplaza `confirm()`/pérdidas silenciosas en tres puntos — Regenerar con ediciones manuales sin guardar, reemplazar el HTML del Estudio con cambios sin guardar (ofrece "Guardar versión y continuar"/"Descartar cambios"/"Cancelar"), y Ejecutar con un prompt editado a mano que no pasa `validateGeneratedPrompt`. Estado inline bajo el textarea (`#prompt-edit-status`, `role="status"`) muestra "Editado a mano" + problemas detectados (debounce 500ms); la pestaña activa repite el marcador ("· editado a mano"). `beforeunload` avisa si hay prompt o código sin guardar.

Navegación mínima: un step-indicator con los 4 pasos principales más un enlace directo a "Banco", alcanzable en cualquier momento.

### Configuración (vista `#view-config`, ítem ⚙ del riel antes de Banco)

Reemplaza al antiguo diálogo "Configurar proveedor" (los botones "Configuración" del Ejecutor y el aviso de Setup navegan a esta vista). Si no hay proveedor usable al cargar, Setup muestra un aviso con enlace a Configuración. Tres secciones:

- **Generador (prompt y landing)**: proveedor (Anthropic / Compatible con OpenAI, p. ej. DeepSeek / OpenCode local), modelo, clave y URL base, con la misma persistencia de siempre (`lpa_provider_v1`) y "Actualizar modelos" de OpenCode. Cada proveedor tiene un botón **Probar conexión** (prompt mínimo, muestra latencia o error usando los valores del formulario aunque no estén guardados).
- **Crítico (técnica 3)**: casilla "Usar el mismo que el generador" (activada por defecto). Desactivada, tiene su propio proveedor/modelo/clave/URL en `lpa_critic_provider_v1`. `runLLM({..., role:'critic'})` lo usa sólo para la auditoría posterior a la ejecución (`runCriticRound`), con el mismo respaldo a OpenCode; el creador que aplica las correcciones sigue en el generador.
- **Multimedia**: chips de estado desde `GET /api/media/status` (Pexels, Pixabay, Cloudflare, Gemini y Pollinations, que no requiere clave) y preferencias guardadas en `lpa_media_prefs_v1`: Imágenes IA (Cloudflare FLUX / Pollinations / Desactivado), fotos y videos de stock (Pexels / Pixabay / Desactivado) y Visión (Gemini / Solo paleta local). Sólo se envía `provider` al servidor cuando el usuario eligió algo; `/api/media/search`, `/generate-image` y `/describe` aceptan ese campo opcional (`pexels|pixabay|cloudflare|pollinations|none`) que limita el backend usado; sin él, el comportamiento por defecto no cambia. Video (técnica 5): Generado (fotogramas IA + ffmpeg, recomendado) / Stock (Pexels/Pixabay) / Desactivado; se aplica en el cliente (no se envía `provider`). Un chip más muestra si `ffmpeg` está disponible (`/api/media/status` devuelve `ffmpeg: true|false`). Las claves se pueden cargar en Configuración → Multimedia → "Claves de servicios" (Pexels, Pixabay, Cloudflare Account ID/API Token, Gemini, Pollinations; se guardan sólo en el navegador, `lpa_media_keys_v1`, y viajan como `keys` en el body de search / generate-image / generate-video / describe, sólo las no vacías). El servidor usa `body.keys` si es una cadena válida (recortada, <= 512, sin saltos de línea) y si no cae al `.env` (`PEXELS_API_KEY`, `PIXABAY_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY`, `POLLINATIONS_API_KEY`; reiniciar `node server.js` tras editarlo). Los chips de Configuración muestran por servicio "clave del navegador" / "clave del servidor (.env)" / "sin configurar", nunca valores; Setup ya no muestra chips de servicios. Las claves se tachan de logs y errores, y la caché de búsqueda no las incluye. Prueba: `tests/media-keys.js`.

## 3. Sistema de generación de prompts

`generatePrompt(project, verticals, technologies)` es el punto de entrada:

1. Genera una semilla (`generateSeed`).
2. Sintetiza los verticales seleccionados en un único contexto (`synthesizeVerticals`) — con nota de síntesis explícita cuando hay 2+ verticales (ej. E-commerce + Fintech → "contexto comercial + confianza financiera").
3. Deriva la dirección creativa de la ejecución (`buildCreativeDirection`) a partir de la semilla.
4. Construye la arquitectura de página (`buildPageArchitecture`), aplicando diseño sustractivo: sólo incluye secciones opcionales (prueba social, objeciones) si los datos del vertical las justifican.
5. Genera un prompt por tecnología (`buildTechnologyPrompt`) y, si hay 2+ tecnologías, un prompt combinado (`combineTechnologyPrompts`) que resuelve conflictos técnicos (Tailwind vs Bootstrap, React vs Vue) y sintetiza una única arquitectura técnica.

Cada prompt resultante contiene los 16 encabezados exigidos por la plantilla, en español, construidos con datos reales del proyecto — nunca con "N/A" en campos vacíos (los campos opcionales sin valor simplemente no generan línea).

`generatePrompt` se renombró conceptualmente a **`generateTemplatePrompt`** (alias exportado, mismo código): desde esta actualización es el **respaldo determinístico**, no el camino principal. El camino principal es que un modelo escriba el prompt (sección 3b); esta plantilla se sigue usando tal cual cuando el modelo no está disponible o no pasa la validación tras un intento de reparación.

## 3b. Generación de prompt por modelo (meta-prompt)

`buildMetaPrompt(project, verticals, technologies, target)` (`target` = una clave de tecnología, o `'combined'`) arma el **meta-prompt**: el prompt que se le manda a OpenCode local para que ESCRIBA el prompt final de 16 encabezados (no para que genere la landing). Codifica operativamente, en español, las reglas de `prompt.md`:

- **Los 16 encabezados exactos y su orden**, como `## N. ENCABEZADO`, tomados de la misma constante `PROMPT_HEADINGS` que usa `generateTemplatePrompt` — nunca pueden desincronizarse entre plantilla y validador.
- **SSoT aplicado dos veces, con entropía REAL en ambas (ver §4 — fix "landings todas iguales")**: (a) la app, no el modelo, genera una semilla real (`generateSeed()`) y deriva con ella (`buildCreativeDirection`) las decisiones grandes de dirección visual/arquitectura; el modelo que ESCRIBE el prompt las recibe como "DECISIONES DERIVADAS DE LA SEMILLA" y tiene que ELABORARLAS con concreción (hex, fuentes, grilla), no reinventarlas ni cambiarlas de categoría; (b) el prompt que ese modelo ESCRIBE debe a su vez instruir, dentro de su propio bloque `MECANISMO DE DIVERSIDAD SSoT`, al modelo EJECUTOR a usar una semilla propia para sus decisiones MENORES, incluyendo textualmente la marca `{{SSOT_SEED}}` — que la app sustituye por la cadena semilla del usuario (la misma con la que se generó el prompt) en cada ejecución (`executeCurrent`). Nunca se le pide a un LLM que "invente" la entropía grande: un LLM no tiene entropía real y colapsa al cliché de la categoría (lujo → oscuro+dorado+serif) si se lo dejás decidir solo.
- **Prompt Ambicioso**: exige desarrollar usuario, mercado (contra los competidores declarados), psicología, conversión, y arquitectura sección por sección (objetivo/información/función psicológica/copy/elemento visual/CTA/relación con la siguiente).
- **Diseño Sustractivo**: exige la pregunta "¿ayuda a comprender, navegar, confiar, decidir o convertir?" y motivo explícito de qué se descartó.
- **Restricciones Negativas confinadas a su bloque**: la lista de palabras prohibidas (`BANNED_WORDS`, la misma que usa la plantilla) se pasa como base y se exige explícitamente que sólo aparezca dentro de `RESTRICCIONES NEGATIVAS`, adaptando el resto a "no las copies mecánicamente".
- **Reglas de combinación** cuando `target==='combined'`: nunca concatenar un prompt por tecnología, detectar conflictos reales (Tailwind vs Bootstrap, React vs Vue) y resolverlos explícitamente dentro de `REQUISITOS TÉCNICOS`, y sintetizar los verticales en un único contexto de negocio si hay 2+.
- **Datos estructurados como contexto, no como adorno**: `buildVerticalContextData`/`buildTechContextData` extraen de `VERTICALS`/`TECHNOLOGIES` (motivaciones, objeciones, sesgos, sofisticación de mercado, reglas técnicas, `implies`/`conflicts`) y se los pasa al modelo como datos concretos a usar, para que no reinvente lo que la app ya sabe del dominio.
- **Contrato de salida**: exige que la respuesta sea ÚNICAMENTE el texto del prompt (sin preámbulo ni bloques de código), y que el `SALIDA FINAL` del prompt que escribe exija a su vez un único documento HTML autocontenido, con CDN para React/Vue/Tailwind/Bootstrap y Next.js simulado en React — el mismo contrato que ya exigía `buildSalidaFinalBlock` en la plantilla.

La llamada real va por `POST /api/opencode/complete` con `expect:'text'` y el modelo de OpenCode configurado (el elegido en "Configuración" si es `opencode-local`, si no `opencode/muse-spark-1.3-contributor-free` por defecto — la generación del prompt siempre usa el CLI de OpenCode, independientemente de qué proveedor esté configurado para EJECUTAR el prompt final).

## 3c. Validación, reparación y respaldo a plantilla

`validateGeneratedPrompt(text, {project})` es el gate de calidad sobre lo que devolvió el modelo. Reutiliza `extractPromptSections` (misma función que alimenta el panel "Dirección creativa" en la UI) para ubicar cada uno de los 16 encabezados por posición de texto, y valida:

1. **Los 16 encabezados presentes y en el orden exacto** — si falta uno o aparece antes de uno anterior, es una violación puntual (se reporta encabezado por encabezado, no un genérico "formato inválido").
2. **Ninguna palabra de `BANNED_WORDS` fuera del bloque `RESTRICCIONES NEGATIVAS`** — se parte el texto en secciones por encabezado y se busca cada palabra (`\b…\b`, insensible a mayúsculas) en cada sección que no sea esa.
3. **Longitud no trivial** (≥1200 caracteres) — filtra respuestas anémicas tipo "landing moderna para X" que technically tienen los 16 títulos pero ningún contenido real.
4. **Mención de datos concretos del proyecto** (tema o público, buscados literalmente en el texto) — filtra prompts genéricos que podrían servir para cualquier negocio.

Si la validación falla, hay **un único intento de reparación**: `buildRepairPrompt(previousOutput, violations)` le manda al mismo modelo su propia respuesta anterior + la lista exacta de violaciones, y le pide el prompt corregido completo (mismo contrato de salida: sin preámbulo, sin fences). Si la reparación también falla la validación, o si el modelo no respondió en absoluto (`file://`, red caída, `opencode` sin instalar, timeout, o cancelación del usuario), la pestaña cae a `generateTemplatePrompt` para ESA tecnología/combinación puntual — las demás pestañas no se ven afectadas, cada una decide su propio camino (modelo vs plantilla) de forma independiente. La UI lo muestra siempre, sin ocultar el fallback: "Prompt generado con plantilla de respaldo: `<motivo>`" en el panel de Generador y en "Dirección creativa".

Generación **perezosa y cacheada por pestaña** (`ensureTabGenerated`, `state.modelPrompts[tabKey]`): al entrar a Generador sólo se genera la pestaña activa (Combinado si hay 2+ tecnologías, si no la única). Abrir otra pestaña dispara su propia generación la primera vez; "Regenerar" vuelve a pedir SÓLO la pestaña activa (recalculando además la plantilla de respaldo, para que si vuelve a caer a plantilla no sea exactamente el mismo texto). El estado de carga muestra segundos transcurridos (`setInterval` de 1 s) y un botón Cancelar que llama `POST /api/opencode/cancel` con el `runId` de esa pestaña — la cancelación fluye naturalmente al camino de respaldo con motivo "Ejecución cancelada por el usuario.", sin una rama de código aparte.

## 3d. Técnicas seleccionables (las 8 técnicas de la guía)

**Qué es.** Cada técnica de la guía PDF se activa o apaga por separado en el paso 2 ("Técnicas de diseño con IA": 8 interruptores accesibles con número, nombre, fase y descripción; presets **Todas** / **Ninguna**; por defecto Todas). La selección vive en `state.techniques`, se persiste en `localStorage` (`lpa_techniques_v1`) y se envía al Banco como `techniques`. Al pulsar "Generar Prompt" se toma un snapshot (`state.genTechniques`); cada prompt guarda las técnicas con que se generó (`entry.techniques`) y el Generador las muestra ("Técnicas activas"). La fuente de verdad es `TECHNIQUES` en `app.js`; con `techniques === undefined` todas las funciones asumen "todas" (compatibilidad).

| # | Técnica | Fase | Con la técnica activa | Apagada |
|---|---------|------|-----------------------|---------|
| 1 | Semillas SSoT | Descubrir | Cadena semilla hex visible del usuario (`state.ssotSeed`) → ejes de `DESIGN_AXES` + paleta `derivePalette`; bloque `MECANISMO DE DIVERSIDAD SSoT` con `{{SSOT_SEED}}` (se sustituye en cada ejecución) | Dirección **determinista** derivada del proyecto + verticales (`deriveDeterministicSeed`); sin bloque ni marca |
| 2 | Prompt ambicioso · concepto rector | Descubrir | La **página misma** rompe la norma con un concepto rector del mundo del cliente (un reloj cuyas partes son los paneles y se navega girando la corona; un plano o una casa 3D; un juego; un escritorio…), no "un color audaz". Eje `interactionParadigm` (salt 80, 8 paradigmas en `INTERACTION_PARADIGMS`) + etapa "Ideando el concepto…" (`buildConceptIdeationPrompt` → 3 conceptos JSON, `parseConcepts`/`resolveConcepts` con respaldo determinista `buildFallbackConcept`) + encabezado `CONCEPTO RECTOR` (tras `CONTEXTO`) al que se subordinan dirección visual, arquitectura (secciones = partes/zonas del concepto), copy y requisitos técnicos. Psicología, mercado y conversión siguen, pero al servicio del concepto. Panel "Conceptos" en el Generador ("Usar este concepto" regenera solo la pestaña activa sin re-ideación; "Otros 3 conceptos") y concepto guardado en el Banco (`meta.concept`) | Bloques concisos (`buildUsuario/Psicologia/Mercado/ArquitecturaBlock(..., false)`); sin `CONCEPTO RECTOR`, sin paradigma de interacción y sin llamada de ideación |
| 3 | Subagentes creador/crítico | Entregar (post-ejecución) | Bucle sobre la LANDING: el crítico audita el HTML (UX, accesibilidad, persuasión) y devuelve un JSON de arreglos; el creador los aplica solo vía edición IA (diff + Aceptar/Descartar); "Rehacer arreglos" y "Segunda vuelta del crítico" (máx. 2 vueltas) | Sin auditoría |
| 4 | Imágenes generadas | Entregar | Bloque `RECURSOS VISUALES` con 2-4 prompts de imagen coherentes con la dirección | — |
| 5 | Video | Entregar | Un video protagonista (poster, scrub por scroll, fallback `prefers-reduced-motion`) en `RECURSOS VISUALES` | — |
| 6 | Diseño sustractivo | Definir | Bloque `DISEÑO SUSTRACTIVO` + auditoría | Se omite el bloque |
| 7 | Restricciones negativas | Entregar | Bloque `RESTRICCIONES NEGATIVAS` y chequeo de `BANNED_WORDS` | Se omite el bloque y el chequeo; en `CRITERIOS DE CALIDAD` quedan solo los no-negociables de accesibilidad y seguridad |
| 8 | Reescritura humana | Entregar | Post-ejecución: reescribe solo copy/microcopy, nueva versión "Reescritura humana" | — |

> **Concepto rector elegido en el paso 2 (técnica 2).** El panel `#concept-pick-panel` (entre la cadena SSoT y los recursos) idea 3 conceptos con una llamada (mismo prompt/parseo que la etapa del pipeline), permite elegir uno, editar su "La página es"/navegación o escribir uno propio, y lo guarda en `state.conceptPick` (`lpa_concept_pick_v1`, atado a cadena + tema; si cambian se conserva con el aviso "de otra cadena/proyecto" y el pipeline no lo usa). Con un concepto vigente, `runTechniquePipeline` se salta la ideación (cero llamadas extra) y el panel de recursos 4/5 usa su `conceptBrief`. En el Generador el panel "Conceptos" es informativo: "Cambiar a este (regenera el prompt)" regenera solo esa pestaña y "Elegir en el paso 2" navega al panel. Sin elección previa todo sigue como antes (ideación dentro de la generación). Pruebas: `tests/concept-panel.js`.

**Pipeline (`runTechniquePipeline`, en `ensureTabGenerated`).** Cada etapa usa su propio `runId` (Cancelar corta la etapa en curso y las siguientes) y el Generador muestra el estado por etapa con segundos y total (p. ej. "Definir · Corrigiendo el formato… 12s · total 48s — Escribiendo el prompt ✓"):

```
Descubrir   collectAssets(ctx)            hook Fase D (hoy stub: no devuelve nada)
            "Ideando el concepto…"        solo con 2: runLLM -> 3 conceptos (el 1º con el paradigma sorteado);
                                          sigue con el elegido (por defecto el 1º; "Cambiar a este" o un concepto ya elegido en el paso 2 saltan esta etapa)
            redactor  buildMetaPrompt     1 SSoT / 2 Ambicioso + CONCEPTO RECTOR / 4-5 recursos / 6 / 7 / 8 según técnicas
Definir     validar + reparar (1 intento) getHeadings + validateGeneratedPrompt (con 2: CONCEPTO RECTOR con navegación y mapeo)
Entregar    SALIDA FINAL reimpuesta       enforceSalidaFinal: la app fija el contrato (HTML único o proyecto)
            --- al ejecutar ---
            onExecutionDone(exec)         solo si hay un único HTML (se omite con exec.project / exec.files)
              (arreglo de recursos)       si faltan recursos obligatorios: edición IA -> Aceptar/Descartar
              3 crítico de la landing     buildCriticAuditPrompt -> JSON [{area, problema, arreglo, prioridad}] (máx. 8)
                                          parseCriticItems (fences / texto alrededor / viñetas como fallback);
                                          alta+media marcadas por defecto
              3 creador (automático)      buildCriticApplyInstruction + runAiEdit('critic'): diff + Aceptar/Descartar;
                                          "Rehacer arreglos" re-corre solo el creador; tras Aceptar, "Segunda vuelta del
                                          crítico" (Vuelta 2/2). Etapas: "Crítico auditando la landing… Ns" ->
                                          "Creador aplicando N arreglos… Ns" -> "Revisá el diff". Multi-archivo: se omite
              8 reescritura humana        corre DESPUÉS, sobre el HTML aceptado (o el actual si se descarta). verifyRewriteStructure: mismos conteos de etiquetas y mismos
                                          <script>/<style>; si no, se descarta con aviso y el HTML no se toca
```

**Encabezados dinámicos.** `getHeadings(techniques, {resources})` reemplaza el uso fijo de `PROMPT_HEADINGS` (que queda como la lista completa): sin 1 no existe `MECANISMO DE DIVERSIDAD SSoT`; sin 6 no existe `DISEÑO SUSTRACTIVO`; sin 7 no existe `RESTRICCIONES NEGATIVAS`; con 4 o 5 (o con recursos reales de la Fase D) se agrega `RECURSOS VISUALES` después de `COPY / MICROCOPY`. Con las 8 activas son 17 encabezados; con ninguna, 13. Lo usan `buildMetaPrompt`, `validateGeneratedPrompt`, `buildRepairPrompt`, `extractPromptSections`, `forceInsertSSoTToken`, `assemblePrompt` (omite los bloques `null`), las plantillas de respaldo y el borrador guardado (la clave del borrador incluye las técnicas). El chequeo de palabras prohibidas y de la marca `{{SSOT_SEED}}` solo se hace si están activas la 7 y la 1. El Modo espectáculo (coreografía, scroll, 3D, `prefers-reduced-motion`) se exige SIEMPRE: con 0 técnicas igual sale un prompt espectáculo sólido.

**Reglas de sinergia** (`buildSynergyRules`, inyectadas al redactor y al crítico solo cuando aplican):
- SSoT + Subagentes: los ejes derivados son ley; el crítico no los cambia y conserva `{{SSOT_SEED}}`.
- Ambicioso + Subagentes: el crítico verifica objetivo, copy, visual, animación y CTA concretos por sección.
- Concepto rector (2) + SSoT / Sustractivo / Subagentes: la paleta, tipografía y ejes de la semilla visten el concepto; el sustractivo no elimina su interacción firma; el crítico audita la usabilidad de su navegación no estándar (teclado, vista clásica, CTA en 2 interacciones).
- Sustractivo + Espectáculo: la auditoría no borra set pieces de scroll, 3D ni firma del hero si sirven a la retención; elimina decoración sin función.
- SSoT + Multimedia: tratamiento de imágenes, paleta y movimiento derivados fijan el estilo de los prompts de imagen/video (misma luz, ángulo y paleta).
- Multimedia + Restricciones: los prompts de imagen/video llevan las negativas fotográficas (sin piel perfecta, sin texturas plásticas, sin sobresaturación, sin mirar a cámara, sin fondos genéricos).
- Video + Sustractivo: un único video protagonista.
- Restricciones + Reescritura humana: la reescritura hereda la lista prohibida.
- Crítico + Reescritura humana: el crítico actúa primero sobre la estructura y se resuelve (Aceptar/Descartar); la reescritura después, solo sobre el texto visible.

**Contrato de SALIDA FINAL.** Lo escribe la app (`buildSalidaFinalBlock`, que decide HTML único vs. proyecto `=== FILE: … ===` y de ahí `promptWantsProjectFiles`), no el modelo: el meta-prompt le pide una línea provisional y `enforceSalidaFinal` reemplaza el bloque tras cada salida del modelo (redactor, reparación). La reparación tiene la instrucción de no tocarlo.

**Hooks de la Fase D.** `collectAssets(ctx)` (async, hoy devuelve `{referenceNotes:'', required:[], photos:[], generated:[], videos:[]}`) se llama antes del redactor; si su resultado tiene contenido, `buildRecursosVisualesBlock(assets, techniques)` arma `REFERENCIA VISUAL` / `RECURSOS VISUALES — OBLIGATORIOS` / `IMÁGENES GENERADAS` / `FOTOGRAFÍA REAL` / `VIDEO` (con atribución) y se agrega el encabezado `RECURSOS VISUALES` aunque 4 y 5 estén apagadas. Las plantillas de respaldo se reconstruyen con los mismos recursos (`rebuildTemplateEntry`).

**Limitaciones.** El crítico (1 auditoría + 1 creador por vuelta, hasta 2 vueltas) y la reescritura consumen llamadas adicionales al modelo, todas post-ejecución; el prompt ya no pasa por un crítico. Las pasadas post-ejecución no corren con proyectos multi-archivo ni con landings reabiertas desde el Banco (solo tras una ejecución en la sesión). La reescritura humana no se aplica sola al editor: queda como versión y un botón la carga en el Estudio.

## 4. Implementación SSoT

**Diagnóstico (landings todas iguales) y fix**: las landings colapsaban al cliché de categoría porque (1) `DIRECCIÓN VISUAL` la fijaba el propio modelo redactor "inventando" una cadena aleatoria interna — un LLM no tiene entropía real y siempre converge al modo de la categoría (lujo → oscuro+dorado+serif); (2) `MECANISMO DE DIVERSIDAD SSoT`, aplicado sobre una dirección ya cerrada, sólo podía variar trivia (bordes, sombras, orden de bloques secundarios); (3) `ARQUITECTURA DE PÁGINA` era una lista de secciones A-J fija. El fix reemplaza la "entropía inventada" por entropía real en dos puntos distintos:

**1) Ejes de diseño grandes, derivados por la app con una semilla real** (`DESIGN_AXES` + `buildCreativeDirection(seed, verticalCtx)` en `app.js`): `generateSeed()` usa `crypto.getRandomValues` para una cadena de 48 caracteres; `pickIndex(seed, dimensionSalt, modulo)` toma un tramo distinto por cada "sal" de dimensión, calcula suma de códigos de carácter + hash FNV, y el módulo elige el índice entre alternativas pre-validadas (5-8 opciones cada una, compatibles con cualquier vertical): `layoutParadigm`, `heroArchetype`, `paletteFamily` (con hex concretos), `typePairing` (fuentes reales), `narrativeAngle`, `imageryTreatment`, `motionSignature`, `density`, `cornerBorderLanguage`, `ctaStyle`, más un `sectionArchetypePool` (1-3 bloques narrativos adicionales) que varía `ARQUITECTURA DE PÁGINA`. Verificado con 20 semillas: 20/20 combinaciones distintas de los ejes de alto nivel.

En `buildMetaPrompt` (meta-prompt, camino por modelo), estas decisiones se pasan al modelo redactor como bloque **"DECISIONES DERIVADAS DE LA SEMILLA"**, con instrucción explícita de que NO son sugerencias sino la dirección a elaborar (concreta: hex, fuentes, grilla) y de que un rubro NO implica automáticamente su cliché visual (ej. lujo ≠ oscuro+dorado+serif) salvo que la semilla lo haya elegido. En `generateTemplatePrompt` (plantilla de respaldo, sin modelo), la misma `creativeDirection` alimenta directamente `buildDireccionVisualBlock`. `onRegenerate()`/`onGenerateClick()` generan una semilla nueva cada vez; la semilla cruda nunca se muestra en el flujo normal — en el panel "Dirección creativa" se resumen las decisiones derivadas y la semilla queda colapsada bajo "Detalles técnicos".

**2) Marca `{{SSOT_SEED}}` (`SSOT_TOKEN`) para las decisiones menores del modelo EJECUTOR**: el bloque `MECANISMO DE DIVERSIDAD SSoT` (`buildSSoTBlock` en la plantilla; instrucción equivalente en `buildMetaPrompt` para el camino por modelo) ya no le pide al ejecutor "inventar" una cadena — contiene la marca literal `{{SSOT_SEED}}`, que `executeCurrent()` sustituye por la **cadena semilla del usuario con la que se generó el prompt** (`state.execution.ssotSeed`; ver "SSoT visible" más abajo), a partir de la plantilla original guardada en `state.execution.promptTemplate` (no del `promptUsed` ya sustituido de la vez anterior). Desde SSoT visible ya no se sortea una cadena fresca por ejecución: "Regenerar" repite la misma dirección (el modelo puede variar su salida) y, para otra dirección, el usuario genera una cadena nueva en el paso 2. Sigue habiendo variación en las decisiones sustanciales que quedan abiertas (acentos secundarios, escala tipográfica exacta, micro-composición del hero, matiz de voz, motivos ilustrativos), sin tocar objetivo/contexto/accesibilidad/requisitos/restricciones. `validateGeneratedPrompt` exige la marca verbatim en ese bloque; si el modelo la omite o la parafrasea, `forceInsertSSoTToken` la inserta mecánicamente antes de caer a plantilla. El Banco guarda el prompt EXACTO ya sustituido (`state.execution.promptUsed` post-sustitución), nunca la plantilla con la marca sin resolver.

**SSoT visible y controlable (cadena semilla + paleta determinista)**

- **Cadena.** `state.ssotSeed` es un hexadecimal de 64 caracteres (32 bytes de `crypto.getRandomValues`, `generateSsotSeed()`), generado una vez al iniciar y persistido en `localStorage` (`lpa_ssot_seed_v1`, con try/catch; una cadena guardada corrupta se reemplaza). `pickIndex` / `rollingHash` siguen funcionando con cualquier string.
- **Panel del paso 2** (`#ssot-panel`, visible SOLO con la técnica 1 activa): muestra la cadena agrupada en bloques de 8, botones "Generar nueva cadena" y "Copiar", y un campo para pegar una cadena propia (validación: 16 a 128 caracteres hex; tolera espacios, guiones, mayúsculas y prefijo `0x`; errores en español). Debajo, la "Vista previa de decisiones", calculada sin llamar a ningún modelo con la misma `buildCreativeDirection` que usa la generación: 5 muestras de paleta (hex, rol y contraste), pareja tipográfica, paradigma de layout, arquetipo de hero, 3D, experiencias de scroll y densidad. Se actualiza al instante y anuncia el cambio con `aria-live="polite"`.
- **Determinismo.** Misma cadena + mismo proyecto/verticales/tecnologías/técnicas ⇒ `creativeDirection` idéntica. `generatePrompt`, `generateTemplatePrompt`, `buildMetaPrompt` y `buildCreativeDirection` reciben la cadena por `opts.seed` cuando la técnica 1 está activa (`makeTechniqueSeed`); con la técnica 1 apagada se sigue usando la semilla derivada del proyecto (`deriveDeterministicSeed`) y `opts.seed` se ignora.
- **`derivePalette(seed)`** (función pura) reemplaza al eje fijo `DESIGN_AXES.paletteFamily`. De la cadena salen, con un hash FNV + mezcla final de 32 bits por sal: el tono base (0-359), el esquema (`complementario`, `triádico`, `análogo`, `dividido`, `duotono`; `monocromo` solo con ~5% de probabilidad), el modo (`claro`/`oscuro`) y la banda de saturación (`suave`/`media`/`vívida`). Devuelve `{bg, surface, text, accent, accent2, scheme, mode, name, ...}` en `#RRGGBB`. **Garantías WCAG AA**: texto/fondo (y texto/superficie) apunta a 7:1 corrigiendo la luminosidad de forma iterativa y nunca baja de 4.5:1; acento y acento 2 contra el fondo apuntan a 3.5:1 (mínimo 3:1). Se evita el look genérico "IA" púrpura→azul: un `análogo` con tono base 250-290 se corre a cálidos, y si acento y acento 2 caen ambos en 235-300 el segundo se desplaza 150°.
- **En el prompt.** `creativeDirection.paletteFamily` pasa a ser un texto descriptivo (`"triádico oscuro: fondo #…, superficie #…, texto #…, acento #…, acento 2 #…"`) y `creativeDirection.palette` expone el objeto. `formatDerivedDecisionsBlock` fija la REGLA DE PALETA (los 5 hex exactos con su rol; la advertencia de "no monocroma" depende de `palette.scheme`), `buildDireccionVisualBlock` (plantilla de respaldo) lista los 5 roles con su hex y contraste, y `validateGeneratedPrompt` sigue exigiendo que al menos 2 de esos hex aparezcan en DIRECCIÓN VISUAL (`paletteHexesOf`).
- **Ejecución.** `{{SSOT_SEED}}` se sustituye por la MISMA cadena con la que se generó el prompt (`entry.ssotSeed` → `state.execution.ssotSeed`), no por una fresca. "Regenerar" en el Ejecutor repite la cadena (la salida del modelo puede cambiar) y muestra la pista "Para otra dirección, generá una nueva cadena en el paso 2". "Regenerar" en el Generador reconstruye la plantilla con la cadena ACTUAL.
- **Generador.** El panel "Dirección creativa" muestra la cadena en forma corta (copiable) y las muestras de paleta del prompt; si `state.ssotSeed` difiere de la usada por la pestaña activa aparece "La cadena cambió desde que se generó este prompt — Regenerar para aplicarla".
- **Banco.** `ssotSeed` se guarda en `meta.json` (`bank-store.js`: `create`/`update`/`list`, validada como hex 16-128 o vacía), la tarjeta muestra la forma corta y "Ejecutar nuevamente" usa el prompt ya sustituido guardado.

Verificación real (2 llamadas secuenciales a OpenCode con `buildMetaPrompt` para el ejemplo de relojería de lujo, semillas distintas): ambos prompts válidos, ambos con `{{SSOT_SEED}}` presente en `MECANISMO DE DIVERSIDAD SSoT`, y `DIRECCIÓN VISUAL` materialmente distinta — uno derivó paradigma editorial largo + paleta invertida (papel/tinta + acento bermellón, "no cambies de familia ni agregues dorado") + tipografía monoespaciada/humanista + hero ilustrado; el otro derivó narrativa por capítulos + paleta papel claro con acento óxido ("nada de dorados metálicos ni negros plenos") + serif/grotesk + hero de producto sobre fondo plano.

## 5. Plantilla de prompt generado

```
ROL
CONTEXTO
USUARIO / AUDIENCIA
OBJETIVO DE NEGOCIO
OBJETIVO DE CONVERSIÓN
PSICOLOGÍA
CONTEXTO DE MERCADO
DIRECCIÓN VISUAL
MECANISMO DE DIVERSIDAD SSoT
ARQUITECTURA DE PÁGINA
COPY / MICROCOPY
REQUISITOS TÉCNICOS
DISEÑO SUSTRACTIVO
RESTRICCIONES NEGATIVAS
CRITERIOS DE CALIDAD
SALIDA FINAL
```

Los 16 encabezados están siempre presentes, tanto en cada prompt individual por tecnología como en el prompt combinado.

## 6. Ejemplo de ejecución

Entrada (accesible vía "Cargar ejemplo" en Setup):

- Tema: Relojería de lujo
- Vertical: E-commerce
- Tecnologías: HTML + CSS + JavaScript
- Público: compradores de relojes artesanales de edición limitada
- Objetivo: reservar una pieza
- Competidores: marcas de relojería de lujo tradicionales

El prompt resultante: activa la motivación de exclusividad como líder (u otra motivación del vertical, según la semilla), incluye la objeción de precio en PSICOLOGÍA, define una arquitectura de conversión completa en ARQUITECTURA DE PÁGINA con CTA de reserva, aplica restricciones negativas específicas de e-commerce de lujo (sin countdown falso, sin CTAs de compra repetidos), y REQUISITOS TÉCNICOS con las reglas de HTML/CSS/JavaScript vainilla.

## 6b. Estudio: editor de código, click-to-code y edición con IA

El paso "Ejecutor" pasó a ser un **workspace dividido** (Feature 2): editor de código a la izquierda, preview en vivo a la derecha, con un panel de edición asistida por IA y un panel de versiones debajo.

**Editor** (`createEditor`, en `app.js`): envuelve CodeMirror 5 (cargado desde cdnjs — `codemirror.min.js/css`, modos `xml`/`javascript`/`css`/`htmlmixed`, addons `search/searchcursor` y `edit/closetag`) detrás de una interfaz mínima común: `{getValue, setValue, onChange, getSelection, replaceSelection, scrollToLine, selectRange, focus}`. Si el CDN no cargó (offline, red bloqueada — `typeof window.CodeMirror !== 'function'`), `createEditor` arma un `<textarea>` plano que implementa exactamente la misma interfaz; el resto del Estudio (click-to-code, IA, versiones) no sabe ni le importa cuál de los dos está activo. `selectRange` se agregó más allá de la lista mínima pedida porque el click-to-code necesita seleccionar un rango por índice de carácter en ambos backends por igual.

**Preview en vivo**: cada cambio en el editor dispara `schedulePreviewUpdate` (debounce ~400 ms) que manda el HTML actual a `iframe.html` vía `postMessage`, igual que la ejecución inicial. Presets de ancho (Móvil 390px / Tablet 768px / Escritorio) son sólo CSS (`.preview[data-width="…"]`), sin recargar el iframe. En pantallas angostas (<64rem) el layout dividido colapsa a pestañas "Código" / "Vista previa" (`.studio-tabs`, sin duplicar el DOM: se ocultan/muestran los mismos paneles).

**Click-to-code**: se inyecta un script pequeño (`INSPECTOR_SCRIPT`/`injectInspector`) **sólo en el HTML que se manda a la preview**, nunca en el código guardado ni en el editor — `injectInspector` se aplica justo antes de cada `sendHtmlToPreview`, sobre una copia. Con Alt+clic (o el botón "Inspeccionar" activado) dentro de la preview, ese script identifica el elemento clickeado (tag, id, clases, snippet de texto, prefijo de `outerHTML`) y hace `postMessage` hacia arriba. El mensaje cruza dos niveles de iframe sandboxeado sin `allow-same-origin` (`sandbox-frame` dentro de `iframe.html` dentro de `#preview-frame`): `iframe.html` lo relee y lo retransmite a `window.parent` **sólo si `event.source` es efectivamente su propio `sandbox-frame`** (nunca retransmite mensajes de origen desconocido), y `app.js` en el nivel superior sólo procesa el mensaje si `event.source === previewFrame.contentWindow` y el `type` empieza con el namespace `lpa:`. En el nivel superior, `locateInSource` intenta ubicar la mejor posición aproximada en el HTML fuente con una cascada de estrategias (por `id` → por prefijo literal de `outerHTML` → por `tag`+primera clase → por fragmento de texto visible → por `tag` solo) porque el `outerHTML` serializado por el navegador rara vez coincide byte a byte con el HTML de autoría (orden de atributos, auto-cierre, espacios); si ninguna estrategia encuentra nada, se lo dice explícitamente al usuario en vez de fallar en silencio.

**Consola del Estudio** (modal flotante, botón "Consola" abajo a la derecha de la vista previa; ya no es una tab): muestra lo que tira la página generada, que antes sólo se veía en las devtools del navegador. `console-capture.js` (script clásico en el navegador, CommonJS para `preview-runner.js`; `buildConsoleCaptureScript({mode, run})`) parchea `console.log/info/warn/error/debug` (serializa strings, números, `Error` → mensaje+stack, objetos → JSON con guarda de ciclos, recorte a ~2 KB), escucha `error` de la ventana (con fase de captura, así también atrapa recursos que no cargan: tag + `src`/`href`) y `unhandledrejection`, y manda latidos (`start`, `DOMContentLoaded`, `load`, `settled` a los ~800 ms, con `empty` = el body no tiene texto ni media). Posta `{type:'lpa:console', level, message, source, line, col, stack, ts, inst, run}`; tope de 300 mensajes y después un único "mensajes truncados". **Sólo vive en la preview**: nunca en el código del editor, las versiones, el Banco ni lo exportado.
- *HTML único*: `renderPreviewHtml` (en vez de `sendHtmlToPreview(injectInspector(...))`) inyecta la captura con `injectConsoleCaptureInfo` como **primer elemento de `<head>`, en la misma línea que la etiqueta** (sin saltos), así los números de línea del código original no se corren; en la única línea de inserción las columnas posteriores se corrigen con `mapConsoleLocation` (resta el largo inyectado). `iframe.html` retransmite `lpa:console` sólo si `event.source` es su `sandbox-frame`; `app.js` exige además `event.source === #preview-frame.contentWindow` y que el `run` coincida con el render actual (los mensajes rezagados de una ejecución vieja se descartan).
- *Multi-archivo*: `preview-runner.js` escribe `public/__lpa_console.js` (modo `origin`: postea sólo al origen del padre, aprendido de `lpa:hello` o `location.ancestorOrigins`, con buffer hasta entonces) en la COPIA de trabajo. Vite: `<script src>` síncrono como primer hijo de `<head>` de `index.html` (antes de cualquier módulo). Next: `<script src>` dentro de `<head>` del layout (lo crea si sólo hay `<html>`), en la misma línea. Si el layout no tiene `<html>`/`<head>`, el componente cliente del inspector lo carga **tarde** (`useEffect`): se pierde lo que tiró la hidratación inicial, todo lo posterior sí se captura. `app.js` valida `isTrustedConsoleMessage` (fuente = iframe del proyecto **y** `event.origin === origen de la preview actual`); un `inst` nuevo (recarga completa del dev server) limpia con separador.
- *UI*: badges de errores/advertencias en el botón flotante (pulsa una vez por error nuevo), lista `role="log"` (ícono + color por nivel con los tokens `--error`/`--accent-3`, mensaje, `origen:línea:col` clickeable, stack colapsable, hora), filtros Todos / Errores / Advertencias / Logs, "Limpiar" y "Copiar todo"; el resumen (`role="status"`, `aria-live="polite"`) anuncia los contadores. Cada render nuevo de la preview limpia la consola y deja "— nueva ejecución HH:MM:SS —" (los mensajes repetidos se agrupan con ×N). Clic en la ubicación: HTML único → tab Código y selecciona esa línea; multi-archivo → `resolveConsoleSource` mapea URLs de Vite (`/src/App.jsx?t=…`, `/@fs/…`) y de Next (`webpack-internal:///(app-pages-browser)/./app/page.jsx`, `/_next/static/chunks/…`) al archivo del proyecto (mejor esfuerzo: las líneas son las del código transformado por el bundler, que para JSX suele coincidir pero no está garantizado).
- *Arreglar con IA*: por error y "Arreglar todos los errores" arman la instrucción (`buildConsoleFixInstruction`: mensaje, ubicación, primeras líneas del stack y un extracto numerado de ±8 líneas alrededor) en `#ai-instruction`, con alcance "Documento completo", y llaman a `runAiEdit('console')` (HTML único o `runProjectAiEdit`): el usuario ve el diff y elige Aceptar o Descartar. Sólo dispara el LLM al hacer clic.
- *Estado del Ejecutor*: si hay errores y la última medición dice que la página está vacía, se agrega "La página tiró N errores: abrí la Consola."
- *Modal*: panel `role="dialog"` `aria-modal="false"` (no bloquea la página), arrastrable por el encabezado y redimensionable desde la esquina (pointer events; flechas en el tirador), acotado al viewport, posición/tamaño en `localStorage` (`lpa_console_modal_v1`, con try/catch), Esc lo cierra (sólo con el foco dentro) y devuelve el foco al botón; en móvil es una hoja inferior a todo el ancho. Superficie oscura propia (tokens locales `--c-*`, JetBrains Mono), barra de herramientas fija: filtros Todo/Errores/Advertencias/Logs, búsqueda, "Arreglar todos", Copiar, Limpiar y Auto-scroll.
- *Vista "Servidor"* (sólo proyectos multi-archivo): salida del dev server (Vite/Next; ANSI quitado) por polling cada ~1 s de `GET /api/preview-project/:id/logs?since=<seq>` → `{seq, lines:[{seq,ts,text,stream}], status, message, port, url}`; se sondea **solo** con el modal abierto y la vista Servidor visible. Cada línea del runner lleva un `seq` monótono (no se reinicia al detener/iniciar; tope 400). Controles: pill (Detenido / Instalando / Compilando / Listo / Error), puerto/URL y **Detener / Iniciar / Reiniciar**. Endpoints (todos validan el id `[a-f0-9]{12}`, ninguno acepta comandos): `POST :id/halt` mata sólo el proceso y conserva id, archivos y logs (se libera al vencer el TTL); `POST :id/start` y `:id/restart` relanzan el MISMO id con los archivos que manda el cliente (mismas validaciones que `create`), y si el preview ya no existe crean uno nuevo (`replaced: true`, id nuevo); `POST :id/stop` sigue liberando todo. Detenido, la preview muestra "Servidor detenido — Iniciar". Tests: `tests/console-server.js` (runner con dev server simulado + rutas HTTP en 3079) y `tests/console-panel.js`.
- Pruebas: `tests/console-panel.js` (captura evaluada en jsdom, mapeo de líneas, validación de fuente/origen, inyección de Vite/Next, panel completo con LLM simulado).

**Edición con IA** (`buildEditPrompt` + `POST /api/opencode/complete` con `expect:'html'`): el usuario escribe una instrucción y elige alcance — "Selección actual" (usa la selección de texto en el editor, o si no hay, el elemento inspeccionado por click-to-code) o "Documento completo". El prompt de edición incluye la instrucción, el HTML completo actual, el fragmento seleccionado si aplica, y el bloque `RESTRICCIONES NEGATIVAS` del prompt que generó esa landing (extraído con `extractPromptSections` sobre `state.execution.promptUsed` — funciona igual si esa landing vino de un prompt generado por modelo o de la plantilla, porque ambos usan los mismos 16 encabezados), para que el cambio puntual no rompa las restricciones originales. Exige como salida el documento HTML completo, nunca un fragmento. El resultado no se aplica directo: se muestra un resumen de diff (`diffLines`, LCS de líneas; cae a un conteo aproximado por conjuntos si el documento es enorme) y el usuario elige Aceptar (crea una versión nueva) o Descartar.

**Versiones**: cada ejecución inicial, cada edición con IA aceptada y cada "Guardar versión" manual (o Ctrl/Cmd+S) agrega `{id, source: 'generado'|'ia'|'manual', instruction?, html, date}` al principio de `state.versions`, topeado a 10 (respeta cuota de `localStorage`). "Restaurar" en cualquier versión la vuelve a poner en el editor (sin borrar el historial). Al guardar en el Banco, `saveLanding` persiste `versions` junto con el prompt y el HTML final (también topeado a 10 por si vino de una sesión con más). El botón **"Editar"** del Banco reabre el Estudio con ese historial completo (`state.pendingVersions`); "Ejecutar nuevamente" en cambio vuelve a correr el prompt exacto desde cero, con una versión "generado" nueva.

**Acciones**: "Descargar HTML" arma un `Blob` y dispara la descarga como `landing-<slug>.html` (slug derivado del tema del proyecto); "Copiar código" usa `navigator.clipboard`.

## 6c. Preview real de frameworks (React/Vue con Vite, Next.js)

**Contrato de salida.** HTML, CSS, JavaScript, Tailwind y Bootstrap siguen entregando un único HTML autocontenido. React, Vue y Next.js entregan un PROYECTO multi-archivo en bloques `=== FILE: ruta ===` … `=== END FILE ===` (sin cercas de markdown; si el modelo las agrega igual, `parseProjectFiles`/`parseFileBlocks` las pelan). Dependencias permitidas, ya instaladas: react, react-dom, vue, next, gsap, lenis, three; cualquier otro import "de paquete" (o URL remota) se rechaza con un error en español; los imports relativos son válidos si no salen del proyecto. Prioridad si hay varias: Next.js > React > Vue.

**Cómo se ejecuta.** `preview-runner.js` (Node sin dependencias):
- Plantillas en `os.tmpdir()/lpa-templates/{vite-react,vite-vue,next}` con `npm install` una sola vez (marca `.lpa-ready` con hash de las versiones fijadas: react/react-dom 19, vue 3.5, next 16, vite 8, gsap 3.15, lenis 1.3, three 0.186).
- Por ejecución: workspace `os.tmpdir()/lpa-previews/<id>/` con los archivos validados + `node_modules` por symlink a la plantilla (`preserveSymlinks` en Vite; `turbopack.root` en Next para que acepte el symlink). Las configs (`package.json`, `vite.config.mjs`, `next.config.mjs`) las escribe el runner; las que mande el modelo se ignoran.
- Dev server ligado a `127.0.0.1` en un puerto libre (`vite --strictPort` / `next dev -H 127.0.0.1`), espera HTTP 200 (timeout 90 s). En Vite además recorre los módulos del proyecto para detectar errores de compilación (Vite responde `/` con 200 aunque `main.jsx` tenga un error de sintaxis). Máximo 2 activos (se desaloja el más viejo), TTL de 20 min de inactividad (el Estudio hace ping cada 4 min y relanza solo si expiró) y se matan por grupo de procesos (`detached` + `kill(-pid)`) al salir el servidor (`exit`, SIGINT, SIGTERM, SIGHUP).

**Endpoints.** `POST /api/preview-project {technology, files, wait?}` → 202 `{previewId, status, ...}` (con `wait:true` bloquea hasta ready/error: 200 o 422); `GET /api/preview-project/:id/status` → `{status: installing|starting|ready|error|stopped, url, logsTail, error, installMs, startMs}`; `POST .../:id/stop`; `PUT .../:id/file {path, content}` (reescribe un archivo, HMR). `POST /api/opencode/complete` acepta `expect:'files'` (devuelve `text` crudo con los bloques, en vez de pasar por `extractHtml`). El Banco acepta `files` + `technology` (guarda `banco/<id>/project/` y `meta.multiFile/technology`; `index.html` es sólo una tarjeta estática para la miniatura, sin levantar dev servers). `project/` no se sirve por HTTP estático.

**Seguridad y sandbox del iframe.** El iframe del Estudio (`#preview-project-frame`) apunta a `http://127.0.0.1:<puerto>/` con `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`. `allow-same-origin` es necesario: sin él el documento tiene origen opaco (`null`) y los módulos ES de Vite (CORS), el WebSocket de HMR y los chequeos de origen de Next dev fallan. No debilita el aislamiento con la app porque el origen se define por esquema+host+PUERTO: la app vive en `localhost:3000` y cada dev server en otro puerto, así que sus scripts no pueden leer el `localStorage` (claves de API) ni el DOM de la app, ni el iframe puede quitarse el sandbox (sólo es posible entre documentos del mismo origen). "Abrir en ventana nueva" abre esa misma URL. Defensa en profundidad de lo que escribe el modelo: rutas sin `..`/absolutas/dotfiles, tope de archivos y tamaño, extensiones permitidas, import allowlist, y en Next (donde el código corre también del lado del servidor) se rechazan rutas API, `pages/`, middleware, server actions, `child_process`, `eval`, `new Function` y `process.*` (salvo `process.env.NODE_ENV`).

**Limitaciones.** No es un sandbox de proceso: un modelo malicioso podría idear evasiones del filtro de código de servidor de Next (el código corre con los permisos del usuario, igual que cualquier proyecto generado que se ejecute localmente). Inspector, versiones del Estudio y edición con IA siguen siendo de HTML único (en proyectos se editan los archivos a mano; el selector de archivos reescribe en el workspace). La primera ejecución de cada plantilla necesita red para `npm install`.

## 6d. Multimedia real (Fase D)

Las landings dejan de ser "solo CSS": el pipeline reúne recursos reales ANTES de que el redactor escriba el prompt y les exige usarlos con sus URLs exactas.

**Servicios y claves (solo servidor).** Creá un archivo `.env` en la raíz del proyecto con el bloque de abajo (parser propio en `media.js`, sin dependencias; no pisa variables ya definidas en el entorno). `.env` y cualquier dotfile devuelven 403 por `isBlockedPath`, y las claves nunca viajan al navegador ni se escriben en los logs.

```
# .env  (plantilla; no hay `.env.example` en el repo porque una regla de permisos bloqueó crearlo: copiá este bloque)
PEXELS_API_KEY=            # fotos y videos de stock (pexels.com/api) - 200 req/h, atribución obligatoria
PIXABAY_API_KEY=           # opcional: respaldo (se descarga al servidor; Pixabay prohíbe el hotlink permanente)
CLOUDFLARE_ACCOUNT_ID=     # imágenes IA: Workers AI @cf/black-forest-labs/flux-1-schnell (10 000 neuronas/día gratis)
CLOUDFLARE_API_TOKEN=
GEMINI_API_KEY=            # visión para describir la referencia (gemini-3.8-flash; respaldo gemini-3.5-flash-lite)
POLLINATIONS_API_KEY=      # opcional: image.pollinations.ai (sin key) tiene límite de tasa; con key se prueba gen.pollinations.ai
```

**Endpoints (`media.js`, ruteados en `server.js`).**
- `GET /api/media/status` -> `{pexels, pixabay, cloudflare, gemini}` (booleanos; nunca valores). Se muestra como chips en el Setup y en el diálogo de proveedor.
- `POST /api/media/upload {name, mime, dataBase64, kind:'reference'|'required', session?}` -> guarda en `media/<sesión>/<id>.<ext>`. Allowlist: image/jpeg, png, webp, gif, avif; video/mp4, webm. Topes: imagen 10 MB, video 60 MB (límite de body propio de 85 MB). La firma binaria debe coincidir con un formato permitido (un SVG o un HTML renombrado se rechaza) y manda el tipo real.
- `GET /media/<sesión>/<archivo>` -> solo esos tipos, con `Range`, `Access-Control-Allow-Origin: *` y `Cross-Origin-Resource-Policy: cross-origin` (los dev servers de Vite/Next en otros puertos cargan `http://127.0.0.1:3000/media/...`). El directorio `media/` no se sirve por el estático genérico.
- `POST /api/media/describe {assetIds?:[], frames?:[{mime,dataBase64}]}` -> Gemini `generateContent` (inline_data). Videos: el navegador extrae 4 fotogramas y se envían como imágenes (un video <=15 MB también puede ir entero). Si el modelo principal da 404 se prueba el de respaldo y se informa.
- `POST /api/media/search {queries:[{query, orientation?, role?}], type:'photo'|'video', perQuery}` -> Pexels (`Authorization: <KEY>`; fotos `src.large2x`; video: mp4 <=1920 de ancho, prefiere `hd`) -> Pixabay -> lista normalizada `{url, width, height, alt, credit, creditUrl, source, poster?}`. Caché en memoria de 24 h por consulta. Sin ninguna key devuelve una lista vacía con aviso.
- `POST /api/media/generate-image {prompt, width, height}` -> Cloudflare FLUX (`steps: 4`, lee `result.image` o `image`, base64) -> Pollinations -> archivo guardado en `media/` (nunca hotlink). 
- **Proveedor de visión elegible.** `POST /api/media/describe` acepta `vision:{kind:'gemini'|'openai-compatible'|'anthropic', baseUrl?, apiKey?, model?}` (por defecto `gemini`). `openai-compatible` hace `POST {baseUrl}/chat/completions` con partes `image_url` (data URI); `anthropic` usa `POST https://api.anthropic.com/v1/messages` con bloques `image` base64. Mismos prompts y mismo parseo que Gemini (salidas intercambiables), máx. 4 imágenes, `baseUrl` sólo `https://`, sin respaldo automático entre proveedores: el error ("DeepSeek respondió 400: …") vuelve al cliente, que usa el análisis local y avisa nombrando el proveedor. Sólo JPEG/PNG/GIF/WebP (las AVIF se omiten con aviso; nunca se envían bytes de video). Modelo por defecto `deepseek-flash` (acepta imágenes; `deepseek-v4-pro` no, según la documentación de DeepSeek). En Configuración → Multimedia → "Visión (análisis de imágenes)" se elige el proveedor y se usan las credenciales del generador o unas propias; se guardan sólo en el `localStorage` del navegador (`lpa_media_prefs_v1.visionCfg`) y viajan en el cuerpo del pedido: el servidor nunca las guarda ni las loguea. Prueba: `tests/vision-provider.js`.
- `POST /api/media/describe` acepta además `mode:'layout'`: pide a Gemini un JSON compacto para maquetar (5 colores hex, posición del sujeto, espacio libre para texto, tono del texto, luz, textura, mood, mejor uso). Si el modelo principal responde 404 o 503 se prueba el de respaldo.
- `POST /api/media/generate-video {frames:[/media/generated/x.png,…], durationPerFrame?, motion?:['zoom-in'|'zoom-out'|'pan-left'|'pan-right'], fps?, width?, height?, webm?}` -> monta con ffmpeg (`spawn` con argv, sin shell, timeout 90 s, un montaje a la vez) un mp4 H.264 yuv420p sin audio y `faststart`, de 6 a 10 s: cada fotograma con zoompan (Ken Burns) más fundidos `xfade`, y un clip final estático con el primer fotograma para que el bucle sea suave. Devuelve `{url, poster, webm?, duration, width, height, fps, frames, motion, source:'ffmpeg'}` y guarda mp4, jpg (póster) y opcionalmente webm (VP9) en `media/generated/`. Solo acepta 2 a 6 imágenes ya generadas en este servidor (`/media/generated/…`). ffmpeg se busca en `FFMPEG_PATH`, el `PATH` y rutas conocidas (`~/.local/bin/ffmpeg`). Sin `frames` (solo `prompt`) sigue respondiendo 501: el texto a video no está disponible (es el antiguo stub de Veo).
- Cada llamada externa deja una línea `[media] hora servicio recurso -> estado en Ns` (sin claves ni query strings). Todos los errores llegan en español.

**Flujo del pipeline (`collectAssets`, etapa Descubrir).** Cada etapa cancela con el botón Cancelar y falla en blando (se anota un aviso visible en el panel Recursos y se sigue):
1. "Analizando referencia..." -> Gemini describe estilo, paleta hex, composición, mood y texturas (o, sin Gemini, solo la paleta de 5 colores medida en el navegador con median cut sobre `<canvas>`; en videos, 4 fotogramas). Alimenta DIRECCIÓN VISUAL. Con la técnica 1 (SSoT) la referencia fija el tono y la semilla varía dentro de ese espacio (regla de sinergia).
2. Multimedia obligatoria -> `required[]` con URL absoluta, rol y `alt` (el pie que escribiste o el nombre del archivo).
3. "Buscando fotos reales..." (SIEMPRE, sin depender de técnicas): el modelo propone 4-8 búsquedas en inglés (JSON) por sección/rol y se consulta Pexels -> Pixabay; sin ninguna key se omite con aviso.
4. Técnica 4: "Generando imagen k/n..." -> el modelo escribe 2-4 prompts (hero, textura, ilustración de marca) alineados con la dirección/referencia (+ negativas fotográficas si la 7 está activa; el hero pide una zona calma para el texto) y se generan de a una, ANTES del prompt final. Después, "Analizando activos generados..." mira cada imagen: con Gemini (`/describe` modo `layout`) o, sin Gemini o si falla, con un análisis local en `<canvas>` (5 colores por median cut + grilla 3x3 de luminancia/detalle que estima el espacio libre). El resultado (`analysis`) alimenta el bloque REFERENCIA DESDE LOS ACTIVOS GENERADOS: el hero ubica titular y CTA en el espacio libre, los roles de la paleta de la semilla se reparten para armonizar con los colores medidos (mismos hex, tintes con `color-mix`), las texturas son fondos de sección y la ilustración de marca define el estilo de íconos. La regla del meta-prompt es "la página se diseña alrededor de los activos generados, no los pega encima". Validación suave: con la técnica 4 el prompt debe citar la URL del hero generado y mencionar composición/espacio libre; si no, hay una única reparación (si falla, se conserva el prompt original). El panel Recursos muestra muestras de color y "espacio libre: …" por imagen.
5. Técnica 5 (honesto: NO es un modelo texto->video; no hay opción gratuita): con la preferencia "Generado" el modelo escribe un *shot list* JSON de 3-4 fotogramas clave de la misma escena (misma luz y paleta, alineado con la dirección visual y con el concepto rector si la técnica 2 está activa; etapas "Planeando la secuencia de video...", "Generando fotograma k/n...", "Montando el video..."), se generan de a uno con Cloudflare (1280x720) y ffmpeg los une en un mp4 con zoom/paneo y fundidos (~8 s, bucle suave) más un póster. El video entra a `assets.videos[]` (rol hero, `source:'ffmpeg'`), su póster también se analiza y el prompt lo exige como capa de motion design (fondo del hero, `muted playsinline loop poster`, movimiento que guía al CTA, solo póster con `prefers-reduced-motion`). Si falta ffmpeg o Cloudflare, o algo falla, se usa como respaldo un clip de stock de Pexels/Pixabay (<=1920, mp4, con `poster`) y un aviso explica el motivo. Con "Stock" solo se busca el clip; con "Desactivado" no hay video.

Los resultados se reutilizan entre pestañas de una misma tanda de "Generar Prompt". El panel **Recursos** del Generador muestra miniaturas con créditos y permite quitar cualquier recurso antes de ejecutar (se elimina también del texto del prompt).

**Uso obligatorio y verificación.** El bloque RECURSOS VISUALES exige las URLs EXACTAS, el rol y el `alt`, y un renglón de atribución en el footer ("Foto de X en Pexels" + enlace). Tras ejecutar, el Estudio compara cada URL (sin query string) con el HTML o los archivos y muestra "Recursos usados: X/Y". Si falta una obligatoria (o no se usó ninguna foto real) en un HTML único, se dispara la pasada de edición con IA existente (con diff para Aceptar/Descartar); en proyectos multi-archivo solo se avisa. También se avisa si falta el crédito a Pexels.

**Banco.** Al guardar, los archivos de `media/` referenciados se copian a `banco/<id>/assets/` y las URLs del HTML (y de las versiones) se reescriben a relativas (`assets/x.jpg`, `../assets/x.jpg` en `versiones/`); `/banco/<id>/assets/*` se sirve con allowlist de tipos y las páginas guardadas mantienen su CSP `sandbox`. Al abrir en el Estudio se convierten a `/banco/<id>/assets/...` para que el iframe las cargue. En proyectos multi-archivo (Vite/Next) las URLs quedan ABSOLUTAS a `http://<host>:<puerto>/media/...` (un dev server en otro puerto no resuelve rutas relativas a esta app; los binarios no caben en el mapa `{ruta: texto}` de `files`) y se copian a `assets/` solo como respaldo. `meta.json` guarda ahora `techniques`, `mediaAssets` y el `proyecto.media` (referencias y obligatorias).

**Privacidad y límites.** Lo que subís queda en tu disco (`media/`, ignorada por git). Solo "describir la referencia" envía la imagen (o 4 fotogramas del video) a Google Gemini, y solo si configuraste `GEMINI_API_KEY`; se avisa junto al campo. Las fotos de Pexels se enlazan directo (hotlink permitido, con atribución); las de Pixabay y las generadas se descargan. Pexels: 200 req/h. Pollinations sin key aplica límite de tasa (la app reintenta una vez); Cloudflare consume neuronas de la cuota diaria. No hay generación de video texto->video gratuita: el video de la técnica 5 se arma localmente con fotogramas IA y ffmpeg (los fotogramas y el mp4 quedan en `media/generated/`, y el mp4 y su póster se copian al Banco como cualquier otro archivo de `media/`); si eso no es posible, se usa video de stock. El análisis de los activos generados envía la imagen a Gemini solo si hay `GEMINI_API_KEY` y la visión no está desactivada; si no, todo se mide en el navegador.

### Recursos generados antes del prompt (paso 2, técnicas 4 y 5)

Con la técnica 4 y/o 5 activa, el paso 2 muestra el panel **Recursos generados** (`#pregen-panel`), como el panel de la semilla SSoT: **Generar imagen**, **Generar video** y **Elegir de la biblioteca** (siempre disponible; la única vía sin APIs). Las etiquetas dicen "Generar" aunque el backend sea stock. Una línea de estado indica qué se usará según `/api/media/status` y Configuración (p. ej. "Imágenes: Cloudflare FLUX · Video: fotogramas IA + ffmpeg" o "Sin API: usá la biblioteca").

- **Imagen:** una llamada corta al modelo escribe 2 a 4 prompts (`buildImagePromptsPrompt`) con lo que ya se conoce (paleta en hex, pareja tipográfica, layout, paradigma con técnica 2, notas de referencia si hay); se generan en secuencia con miniaturas y progreso, y cada una se analiza al terminar (colores y espacio libre). Cada tarjeta permite **Regenerar** (mismo prompt, editable) y **Quitar**.
- **Video:** según Configuración, fotogramas IA + ffmpeg ("Generando fotograma k/n…", "Montando el video…") o stock; si el modo generado falla, cae a stock con aviso. Tarjeta con `<video muted loop playsinline controls poster>`.
- **Biblioteca:** `GET /api/media/library?type=image|video` lista `media/<sesión>/` y `banco/<id>/assets/` (solo imágenes/videos con nombre permitido, más nuevos primero, tope 200, sin duplicados por nombre). Lo elegido entra con el rol que indiques.
- **Buscar en internet:** botón junto a Generar y Biblioteca (deshabilitado con pista "Cargá la clave de Pexels o Pixabay en Configuración" si no hay clave). Abre un modal (`<dialog>` `#pregen-web`, Esc/Cerrar, trampa de foco, devuelve el foco al botón; hoja inferior en móvil) con "¿Qué buscar?", **Sugerir búsqueda** (una llamada al LLM, solo al clic; `buildSuggestSearchPrompt`), orientación segmentada y **Buscar** (`POST /api/media/search`, Pexels → Pixabay). Muestra de a 3 tarjetas grandes (esqueletos al cargar; video con póster, duración y vista previa muda al pasar/enfocar); clic o Espacio elige ("Me quedo con esta") y cada elegida tiene su rol (hero, luego galería…); flechas mueven entre tarjetas. **Otras 3** pagina sobre la misma consulta (caché y `perQuery` creciente hasta 12) conservando lo elegido; **Nueva búsqueda** edita la consulta. **Agregar al proyecto** suma a `state.pregen` con `origin: 'stock'` (insignia "Internet" vs "IA"; solo Quitar); el crédito queda en el ítem para el panel Recursos, no en la página. Se analizan con la visión de Configuración (`mode: 'layout'`; `remoteUrls` para Pexels y `cdn.pixabay.com`, lista cerrada en `media.js`; en video, el póster); sin visión: "sin análisis (visión no disponible)". `collectAssets` los usa como los generados y los excluye de la búsqueda automática (dedupe por URL). Prueba: `tests/pregen-search.js`.
- **Persistencia:** `state.pregen` en `localStorage['lpa_pregen_v1']` (con el tema); si el tema cambió se conserva pero se marca "de otro proyecto" y se descarta al generar nuevos.
- **Pipeline:** `collectAssets(ctx.pregen)` usa esos recursos tal cual (entran a RECURSOS VISUALES / REFERENCIA DESDE LOS ACTIVOS GENERADOS), omite la generación propia de la técnica 4/5 y solo analiza los que no traen análisis. Si el panel está vacío, todo se genera dentro del pipeline como antes (el panel lo avisa). En el Generador, esos recursos se marcan "generado antes del prompt". Los de `/media/` se copian al Banco como siempre; los que provienen solo de `banco/<otro-id>/assets/` no se copian a un Banco nuevo.

### Limpiar todo (vaciar el trabajo en pantalla)

Botón «Limpiar todo» en el rail (antes de Configuración) y arriba del Setup. Pide confirmación (`#dialog-confirm`) y, al confirmar, vacía SOLO el trabajo en memoria y en pantalla: formulario y descripción, sugerencias de IA, multimedia elegida (los archivos de `media/` no se borran), verticales/rubro propio/tecnologías, técnicas (vuelven a «todas»), concepto elegido, recursos pre-generados y el modal de búsqueda en internet, prompts/ediciones/dirección creativa, ejecución, editor, vista previa, versiones, consola y cambios propuestos por la IA. Cancela lo que esté en curso por las rutas existentes y detiene el dev server de la preview actual (limpieza local). Después vuelve al Setup, enfoca la descripción y avisa con un aviso («toast»).

- Claves de `localStorage` que se borran: `lpa_media_v1`, `lpa_techniques_v1`, `lpa_concept_pick_v1`, `lpa_pregen_v1`, `lpa_prompt_draft_v1`, `lpa_studio_draft_v1`.
- Se conservan: Banco (disco/servidor y `lpa_bank_v1`/`lpa_bank_migrated_v1`), `media/`, `.env`, Configuración (`lpa_provider_v1`, `lpa_critic_provider_v1`, `lpa_media_keys_v1`, `lpa_media_prefs_v1`, visión), la cadena SSoT (`lpa_ssot_seed_v1`), `lpa_media_session` y la disposición de la UI (`lpa_studio_layout_v1`, `lpa_console_modal_v1`).
- No hace pedidos a `/api/banco` ni a `/api/media`. Prueba: `tests/reset-all.js`.

## 7. Auditoría sustractiva

Elementos considerados y descartados explícitamente, con motivo:

- **Autenticación / cuentas de usuario**: descartado. No aporta a comprender, navegar, confiar, decidir o convertir dentro del alcance (crear → generar → ejecutar → guardar); el Banco persiste como archivos en disco (`banco/<id>/`, servidos por `server.js`) sin necesidad de login.
- **Backend / build step**: descartado. El enunciado exige vanilla sin build; añadirlo introduciría complejidad sin función.
- **Modo oscuro**: ya **no** se descarta (actualización sobre la versión anterior de este documento). El rediseño lo incorpora vía `@media (prefers-color-scheme: dark)` redefiniendo las variables de la paleta "cobalto-piedra"; se justifica porque respeta la preferencia del sistema operativo sin agregar un control de UI adicional (cero elementos nuevos, sólo variables CSS condicionales).
- **Rail vertical con labels de texto completos en mobile**: descartado por debajo de 64rem; en pantallas angostas el rail colapsa a una barra superior horizontal con envoltura (`flex-wrap`) en vez de forzar scroll horizontal, para cumplir "responsive hasta 360px sin scroll horizontal".
- **Grid de dos columnas para "Estructura del prompt" / "Restricciones técnicas" en Generador**: descartado por la propia decisión SSoT de layout ("apilado simple"); ambos bloques quedan siempre en una sola columna, uno debajo del otro, independientemente del ancho de pantalla.
- **Librería de capturas de pantalla para miniaturas del Banco**: descartada explícitamente por el enunciado; se usa un `<iframe sandbox srcdoc>` escalado con CSS (`transform: scale()`), sin dependencias.
- **Carrusel/slider para mostrar tecnologías o verticales**: descartado; se usan chips en grilla simple, sin animación ni estado adicional que gestionar.
- **Sección de "testimonios" o "prueba social" fija en toda landing generada**: descartada como bloque obligatorio; sólo se incluye cuando el vertical seleccionado tiene señales de confianza (`trustSignals`) y el sesgo de prueba social es relevante (ver `buildPageArchitecture`), aplicando diseño sustractivo también al *contenido generado*, no sólo a la interfaz.
- **Sección "Objeciones" separada**: descartada cuando el vertical no registra objeciones relevantes (no aplica hoy con el catálogo actual, pero el mecanismo queda listo para verticales futuros sin objeciones fuertes).
- **Botón "Exportar a PDF/imagen" en el Banco**: descartado; el objetivo del Banco es guardar prompt + HTML reproducible, no generar activos adicionales no pedidos.
- **"Cargar ejemplo" en Setup**: se mantiene (no se descarta) porque, a diferencia de los anteriores, sí cumple una función clara: permite verificar el flujo completo sin inventar datos, tanto en demo como en la verificación automatizada del propio proyecto.
- **Paso "06 · Estudio" separado en la navegación**: descartado (ver sección 0). El Ejecutor ya es la vista de "ver el resultado"; convertirlo en workspace dividido reutiliza el mismo estado (`state.execution`) y el mismo iframe de preview en vez de duplicarlos en un paso nuevo.
- **Vista de posición en cola dedicada** (barra de progreso, número grande, etc.): descartada. `GET /api/opencode/queue` existe y la UI podría consultarlo, pero con una sola pestaña de navegador por sesión la cola casi siempre está en 0; se prefirió mostrar sólo el cronómetro de la operación en curso ("Generando… Ns" / "Aplicando el cambio… Ns") en vez de un componente nuevo para un caso que rara vez ocurre.
- **Streaming de la respuesta del modelo (SSE/WebSocket) para mostrar el prompt mientras se escribe**: descartado. El endpoint sigue siendo request/response simple; la cancelación (que sí es un requisito real) se resolvió con `runId` generado del lado del cliente en vez de necesitar streaming — más simple, mismo resultado percibido (el usuario puede cancelar en cualquier momento).
- **Fold/plegado de código, minimapa, autocompletado en el editor**: descartados de los addons de CodeMirror. Se incluyeron sólo `search/searchcursor` (útil para ubicarse en un documento largo) y `edit/closetag` (evita HTML roto al editar a mano); un minimapa o autocompletado no ayudan a "entender, navegar, confiar, decidir o convertir" en una landing de una sola página.
- **Selector de modelo específico para el meta-prompt / edición con IA, separado del proveedor de ejecución**: descartado. Se reutiliza el modelo de OpenCode ya elegido en "Configuración" (o el recomendado por defecto) — agregar un segundo selector duplicaría una decisión que el usuario ya tomó, sin que haya evidencia de que necesite ser distinta.
- **Editor de código de sólo lectura para landings del Banco sin acción "Editar"**: descartado; "Abrir" sigue siendo de sólo vista previa (sin inicializar CodeMirror innecesariamente si sólo se quiere mirar), pero cualquier landing puede pasar a edición con un clic en "Editar" sin una tercera variante de vista.
- **Precarga eager de las 16 secciones extraídas en un objeto separado por fuera de `validation.sections`**: descartado; `extractPromptSections` ya calcula esas secciones como parte de `validateGeneratedPrompt`, y tanto la UI ("Dirección creativa") como la edición con IA (extracción de `RESTRICCIONES NEGATIVAS`) reutilizan esa misma función bajo demanda en vez de mantener un caché paralelo.
- **`original.html` como copia aparte del documento de una sola pieza**: descartado (Banco en disco). El HTML canónico que necesita el Estudio se reensambla en memoria a partir de `index.html` + `styles.css` + `script.js` (`reassembleCanonicalHtml`); guardar una copia adicional sólo agregaría un segundo lugar donde el contenido pudiera desincronizarse tras un `PUT`, sin aportar nada que la reconstrucción no dé ya.
- **"Descargar carpeta" (.zip) en las tarjetas del Banco**: descartado explícitamente por el enunciado de la tarea; ya existe "Abrir en pestaña nueva" (`/banco/<id>/index.html`) y "Descargar HTML" dentro del Estudio, así que zippear la carpeta no agrega una acción que falte.
- **Partición "parcial" de scripts/estilos cuando hay riesgo de interleaving**: descartado a favor de todo-o-nada. Si entre el primer y el último `<script>`/`<style>` "extraíble" hay un script/link externo de por medio, intentar adivinar cuáles sí se pueden mover sin romper el orden de ejecución/cascada agrega complejidad y un modo de falla silencioso; es más simple y más seguro dejar el documento entero sin partir (`split:{css:false,js:false}`) y registrar esa decisión en `meta.json`.
- **Archivos de versión incrementales (no reescribir `versiones/` completa en cada `PUT`)**: descartado. Con el tope de 20 versiones, reescribir toda la carpeta en cada guardado es más simple y evita el estado adicional de "qué archivo quedó huérfano tras podar" que un esquema incremental necesitaría.
- **Listar `prompt`/`html` completos en `GET /api/banco` (lista)**: descartado; la lista lee sólo `meta.json` (liviana, para pintar N tarjetas rápido). El prompt completo y el HTML se piden bajo demanda con `GET /api/banco/:id` (al abrir el `<details>` "Prompt asociado", o al abrir/editar/duplicar/copiar una landing), con una caché en memoria del lado del cliente para no repetir el pedido dentro de la misma sesión.
- **Panel dedicado de "borradores"/historial de auto-guardado**: descartado. Los borradores de prompt (`lpa_prompt_draft_v1`) y de código del Estudio (`lpa_studio_draft_v1`) son un respaldo silencioso en localStorage, acotado (10 y 5 entradas respectivamente, LRU) y sin UI propia más allá de un aviso inline con un botón "Descartar borrador"; no hay explorador de borradores ni comparación de versiones de borrador.
- **Bloquear Ejecutar cuando el prompt editado a mano tiene problemas**: descartado. `validateGeneratedPrompt` informa, no impide: el usuario puede tener razones válidas para apartarse del formato (ver "Ejecutar igual" en el diálogo de confirmación); bloquear sería paternalista para una herramienta de ingeniería de prompts.

## 8. Restricciones negativas

Aplicadas en dos niveles:

**A la interfaz** (`styles.css`): sin degradados púrpuras, sin bento grid, sin glassmorphism, sin exceso de tarjetas ni card-in-card, sin sombras flotantes, sin bordes redondeados aplicados de forma indiscriminada (radio de 2px sólo donde hay borde funcional), sin carruseles, sin múltiples CTAs compitiendo (un solo botón primario por vista).

**A los prompts generados** (bloque `RESTRICCIONES NEGATIVAS`, `buildRestriccionesBlock`): lista fija de palabras de copy vacías (revolucionario, potenciar, ecosistema, innovador, soluciones integrales, desbloquear, sinergia, seamless, robusto, transformador, siguiente nivel) con instrucción explícita de no sustituirlas por sinónimos igualmente vacíos; restricciones visuales, estructurales y de autenticidad fijas; más un subconjunto de restricciones **específicas del vertical** elegido mediante SSoT (`creativeDirection.emphasizedConstraints`) y las restricciones adicionales que haya indicado quien encargó el proyecto. Estas últimas nunca se copian mecánicamente: varían según el vertical sintetizado.

### Modo espectáculo (override del usuario)

`prompt.md` describe una dirección visual sobria (editorial, sin sombras, sin 3D, motion "reveal sutil"). Diagnóstico real sobre el Banco: los prompts generados heredaban esa sobriedad al pie de la letra ("sin sombras pesadas ni brillos", "movimiento mínimo y funcional") y las landings resultantes no tenían ninguna fuente de imagen (0 `<img>` en casi todos los casos, un caso hotlinkeando `source.unsplash.com`, que ya no resuelve). El usuario pidió explícitamente lo contrario para **todas** las landings generadas de acá en adelante: esto es un override consciente de la sobriedad de `prompt.md`, no un bug fix.

Cambios (`app.js`):
- `DESIGN_AXES` suma ejes nuevos — `scrollExperience` (2 por página), `threeD`, `heroSpectacle`, `microInteractions`, `sectionTransitions` — y vuelve más expresivos `layoutParadigm`, `paletteFamily` (duotonos, neón, risografía, malla de gradiente propia — nunca el degradado púrpura→azul genérico de IA) y `typePairing` (Syne, Unbounded, Bricolage Grotesque, Anton, Rubik Mono One, Fraunces con ejes "wonk"). `motionSignature` deja de tener la opción "sin animación".
- `buildCreativeDirection` deriva estos ejes con salts 50-55 (sin colisión con los salts existentes).
- `buildDireccionVisualBlock` agrega una subsección "Coreografía de movimiento" (qué anima, trigger, duración/easing, librería, fallback de accesibilidad) y el presupuesto mínimo de espectáculo. `defineSections`/`buildArquitecturaBlock` agregan el campo "Animación / interacción" por sección.
- `TECHNOLOGIES.javascript`/`html`/`css` ya no prohíben librerías externas: permiten GSAP + ScrollTrigger, Lenis y three.js r128 por CDN como mejora progresiva (el contenido crítico debe seguir funcionando si el CDN falla). `buildTecnicoBlockSingle`/`Combined` agregan siempre la estrategia de imágenes (`loremflickr.com` con keywords por sección, `source.unsplash.com` prohibido por caído, `onerror` con SVG de respaldo, mínimo ~6 elementos visuales), video (CC0 de MDN o canvas procedural) y los no-negociables de accesibilidad/performance.
- `buildRestriccionesBlock` ya no prohíbe sombras/3D/degradados/esquinas redondeadas en general: sólo prohíbe el degradado "IA" genérico, bento grid, glassmorphism decorativo sin función, stock genérico, carruseles sin propósito, motion que oculte contenido, scroll-jacking y layout shift. Las bans de copy (`BANNED_WORDS`) no cambiaron.
- `buildMetaPrompt` instruye al modelo redactor con las mismas reglas (para que el prompt que ESCRIBE ya las incluya) y `validateGeneratedPrompt` agrega chequeos nuevos: falta de la subsección "Coreografía de movimiento", ausencia de mención a scroll, a 3D/three.js, o a `prefers-reduced-motion` → dispara el camino de reparación existente en vez de dejarlo pasar.

No negociables que se mantienen sin importar la semilla: `prefers-reduced-motion` deja la página estática pero íntegra (nunca vacía/rota), navegación por teclado y foco visible, contraste AA, animar sólo `transform`/`opacity`, `loading="lazy"` fuera del viewport inicial, pausar three.js/canvas fuera de viewport con `IntersectionObserver`, y `devicePixelRatio` topeado a 2.

`server.js`/`loaders.js`: el HTML ejecutado ahora es más pesado de generar (GSAP/three.js, más imágenes/SVG, coreografía descripta). Se separó el timeout por intento: `OPENCODE_ATTEMPT_TIMEOUT_MS` (120s) sigue rigiendo solo `expect:'text'` (meta-prompt/reparación); se sumó `OPENCODE_HTML_ATTEMPT_TIMEOUT_MS` (240s, override por env) para `expect:'html'`, con `OPENCODE_HTML_TOTAL_BUDGET_MS` (9 min) como presupuesto total de esa request. `loaders.js` sube el `expectedMs` del loader `ejecutor-status` a 150000 para reflejarlo.

## 9. Criterios de aceptación

- **SSoT**: el proceso de generación de la propia app usa una semilla real (`crypto.getRandomValues`) manipulada por hashing/suma-módulo para derivar 8 decisiones independientes; dos generaciones del mismo contexto producen, con altísima probabilidad, direcciones creativas distintas (verificado, ver más abajo); las secciones y restricciones obligatorias no cambian nunca; SSoT no se reduce a una paleta fija.
- **Prompt ambicioso**: cada prompt contextualiza usuario, problema, objetivo, psicología, mercado, conversión, arquitectura sección por sección y microcopy, construido a partir de los datos reales cargados en Setup — no es reutilizable sin cambios para otro negocio.
- **Diseño sustractivo**: evidenciado tanto en la interfaz (sección 7) como en el contenido generado (secciones opcionales que se omiten según los datos del vertical, sin imprimir "N/A" en campos vacíos).
- **Restricciones negativas**: presentes y adaptadas por vertical en cada prompt (sección 8).
- **Funcionalidad**: el flujo crear → generar → revisar → ejecutar → visualizar/editar → guardar → volver a ejecutar está implementado de punta a punta (Setup → Contexto → Generador → Ejecutor/Estudio → Banco → "Ejecutar nuevamente"), incluyendo el ciclo de edición (Estudio → versión nueva → Guardar en Banco → "Editar" recupera el historial).
- **Prompt escrito por modelo, con validación real**: `validateGeneratedPrompt` rechaza encabezados faltantes o fuera de orden, palabras prohibidas fuera de su bloque, longitud trivial y prompts sin datos concretos del proyecto — verificado con casos positivos y negativos construidos a mano (sección "Resultado de la verificación automatizada" más abajo) y con una corrida real contra OpenCode (ver informe de verificación en el reporte de esta tarea).
- **Nunca falla en silencio**: si el modelo no está disponible o no pasa la validación ni tras reparar, se avisa explícitamente en español con el motivo ("Prompt generado con plantilla de respaldo: …") en vez de mostrar un prompt genérico sin decir de dónde salió.
- **Edición con IA no rompe las restricciones originales**: `buildEditPrompt` siempre re-inyecta el bloque `RESTRICCIONES NEGATIVAS` del prompt que generó la landing en edición.
- **Banco persistente en disco, no en el navegador**: guardar una landing crea `banco/<id>/` con `index.html` (+ `styles.css`/`script.js` si el documento se pudo partir), `prompt.md`, `meta.json` y `versiones/`; los datos sobreviven a limpiar el navegador y son archivos de verdad, versionables con git.
- **Split seguro, nunca rompe la landing**: el HTML servido en `banco/<id>/index.html` (con `<link>`/`<script src>` relativos si hubo split) renderiza igual que el original de una sola pieza; si hay riesgo de que partir cambie el orden de ejecución/cascada, no se parte nada (ver sección 7).
- **API sin path traversal**: ids inválidos o con `../` son rechazados (400/403/404) tanto en las rutas REST como en las estáticas de `banco/`; `meta.json`/`prompt.md` nunca se sirven como archivo suelto.
- **No se pierden ediciones en silencio**: Regenerar, re-ejecutar (Ejecutor/Ejecutar/"Ejecutar nuevamente" desde el Banco) y recargar la página siempre avisan antes de descartar un prompt editado a mano o código del Estudio sin guardar (`showConfirmDialog`, `beforeunload`); nunca se sobrescribe sin preguntar.
- **Prompts editados a mano se re-validan**: `validateGeneratedPrompt` corre sobre el texto del textarea (debounce 500ms al tipear, y siempre justo antes de Ejecutar); no bloquea, pero avisa con el detalle de qué encabezado falta o qué palabra prohibida aparece fuera de `RESTRICCIONES NEGATIVAS`.
- **Borradores sobreviven a un reload**: el prompt editado (por contexto de proyecto+verticales+tecnologías+pestaña) y el código del Estudio (por id de ejecución/Banco) se guardan en localStorage acotados en cantidad (10 y 5, LRU) y se restauran con aviso + opción de descartar al volver al mismo contexto.

### Resultado de la verificación automatizada

Ejecutado con Node sobre las funciones puras exportadas de `app.js` (sin DOM):

```
node --check app.js                → OK (sin errores de sintaxis)
Dos generaciones (ejemplo lujo)    → direcciones creativas DISTINTAS
16 encabezados en español          → presentes en prompt individual y combinado
Combinado HTML+Tailwind+Bootstrap  → single prompt, menciona "Conflicto" y resolución
Palabras prohibidas fuera del      → ninguna aparición fuera del bloque
bloque de Restricciones Negativas
```

### Resultado de la verificación del Banco en disco (`bank-store.js` + `server.js`)

Ejecutado end-to-end contra un `node server.js` real en `127.0.0.1:3000` (no mocks):

```
node --check server.js bank-store.js app.js         → OK (sin errores de sintaxis)

POST /api/banco  (style+script simples, +1 <script src> CDN)
  → 201, split:{css:true, js:true}
  → banco/<id>/index.html enlaza ./styles.css y ./script.js, CDN script intacto
  → banco/<id>/styles.css y script.js con el contenido esperado

GET /api/banco                                       → 200, entrada listada, más nueva primero
GET /api/banco/:id                                    → 200, prompt + html reensamblado + versions[].html presentes
PUT /api/banco/:id (html sin <style>, versions nuevas) → 200, split:{css:false,js:false}, styles.css/script.js
                                                          viejos se borran del disco (ya no aplican)
POST /api/banco/:id/duplicate                         → 201, carpeta nueva con id distinto, versiones copiadas
DELETE /api/banco/:id                                 → 200; sobre id inexistente → 404

Estático banco/<id>/index.html                        → 200, Content-Type: text/html; charset=utf-8
Estático banco/<id>/styles.css                        → 200, Content-Type: text/css; charset=utf-8
Estático banco/<id>/script.js                         → 200, Content-Type: text/javascript; charset=utf-8
Estático banco/<id>/versiones/v1.html                 → 200, Content-Type: text/html; charset=utf-8
Estático banco/<id>/meta.json                         → 403 (nunca se sirve suelto)
Estático banco/<id>/prompt.md                         → 403 (nunca se sirve suelto)
Estático banco/<id>/ (listado de directorio)          → 403

Traversal /banco/../server.js                         → 403
Traversal /api/banco/..%2F..%2Fserver.js               → 403
Traversal /banco/<id>/../../server.js                  → 403
Id inválido en GET/PUT/DELETE /api/banco/:id           → 400

Muestra React + <script type="text/babel">             → split:{css:false,js:false}, el <script type="text/babel">
                                                          queda intacto e inline (no se extrae)

Todo getElementById/querySelector(All) de app.js       → 62/62 ids y las 4 clases usadas existen en index.html

Servidor: sin procesos huérfanos tras detenerlo (ps aux limpio)
banco/ al terminar la verificación: 0 entradas (se borraron todas las de prueba)
```

## 10. Código

- `index.html`
- `styles.css`
- `app.js`
- `iframe.html`
- `server.js` (servidor estático + proxy local, opcional, ver "Cómo ejecutar" en la sección 1)

## Pruebas

Las pruebas viven en `tests/` (la app no tiene dependencias; `jsdom` es solo para las pruebas y ya está en `tests/node_modules`; si falta: `cd tests && npm install`).

```
node tests/run.js           # todas
node tests/run.js integ     # solo las que contienen "integ" en el nombre
```

Las de integración levantan servidores propios en los puertos 3088/3089 (nunca tocan el 3000) y usan un opencode SIMULADO en `tests/fakehome/.opencode/bin/opencode` (vía `HOME`); si falta, `run.js` se corta antes para no llamar al opencode real.

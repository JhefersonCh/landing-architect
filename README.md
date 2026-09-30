# Landing Page Prompt Architect

Estudio de ingeniería de prompts para generar **landing pages con IA** que no parezcan hechas con IA.
La app transforma **contexto de negocio → decisiones de diseño → prompt → ejecución → landing page**,
aplicando las 8 técnicas de la guía *"8 Técnicas Avanzadas de Diseño de Landing Pages con IA"*.

Proyecto académico (Sistemas Expertos, ITP). HTML, CSS y JavaScript vanilla, con un servidor Node sin dependencias.

---

## Qué hace

1. **Setup**: contás el proyecto (tema, público, oferta, objetivo, competidores…). Podés escribir una
   *Descripción general* en lenguaje natural y dejar que la IA complete los campos.
2. **Contexto y tecnologías**: elegís verticales de negocio (20 rubros o uno propio, opcional), tecnologías
   (HTML/CSS/JS, Tailwind, Bootstrap, React, Vue, Next.js — las incompatibles se bloquean solas) y qué
   técnicas aplicar. Antes del prompt podés:
   - fijar la **cadena semilla (SSoT)** y ver en vivo la paleta y las decisiones que salen de ella;
   - **idear y elegir el concepto rector** (técnica 2): la página *es* algo del mundo del cliente;
   - **generar imágenes y video** (técnicas 4 y 5) o elegirlos de la biblioteca.
3. **Generador**: un modelo escribe el prompt (con validación, reparación y plantilla de respaldo).
4. **Ejecutor / Estudio**: se genera la landing en vivo (streaming), con vista previa aislada, editor de
   código, edición con IA con diff, crítico de UX/conversión, reescritura humana del copy y versiones.
   Los proyectos React, Vue y Next.js corren en un servidor de desarrollo real.
5. **Banco**: las landings se guardan en disco (`banco/`) con el prompt exacto que las generó.

### Las 8 técnicas (seleccionables por separado)

| # | Técnica | Qué hace en la app |
|---|---|---|
| 1 | Cadenas semilla (SSoT) | Cadena hex visible y controlable; de ella salen paleta, tipografía, layout, estructura y más, de forma determinista |
| 2 | Prompt ambicioso | Concepto rector: la página es un objeto, juego, escritorio, plano… con su propia navegación |
| 3 | Subagentes | Un crítico audita la landing (UX, accesibilidad, persuasión, conversión) y un creador aplica los arreglos |
| 4 | Generación de imágenes | Imágenes con Cloudflare FLUX, analizadas para diseñar la página alrededor de ellas |
| 5 | Generación de video | Fotogramas IA montados con ffmpeg (respaldo: video de stock de Pexels) |
| 6 | Diseño sustractivo | Cada elemento debe justificar su existencia |
| 7 | Restricciones negativas | Bloquea clichés de IA en copy, visual y estructura |
| 8 | Reescritura humana | Reescribe solo el copy visible con voz humana, sin tocar la estructura |

---

## Requisitos

- **Node.js 18 o superior** (usa `fetch` nativo) y **npm** en el PATH.
- **Opcional**: `ffmpeg` (video generado), `opencode` CLI (modelos gratuitos de OpenCode Zen).

## Cómo arrancar

```bash
node server.js
```

Abrí **http://localhost:3000**. No abras `index.html` con doble clic: varias funciones necesitan el servidor.

Otro puerto: `PORT=4000 node server.js`.

---

## Configuración

Todo se configura en la vista **⚙ Configuración** de la app. Las claves se guardan **solo en tu navegador**
y viajan al servidor local únicamente en los pedidos que las usan.

- **Generador** (prompt y landing): DeepSeek u otro proveedor compatible con OpenAI, Anthropic, u OpenCode
  local. Incluye el nivel de *razonamiento* del modelo y un botón para probar la conexión.
- **Crítico** (técnica 3): el mismo proveedor que el generador u otro.
- **Multimedia**: claves de Pexels, Pixabay, Cloudflare (Account ID + API Token), Gemini y Pollinations;
  preferencias de imágenes, stock, video y visión (Gemini, DeepSeek u otro compatible, o solo paleta local).

### `.env` (opcional, respaldo)

Si un campo de Configuración queda vacío, el servidor usa la clave del archivo `.env` en la raíz:

```
PEXELS_API_KEY=
PIXABAY_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
GEMINI_API_KEY=
POLLINATIONS_API_KEY=
```

`.env` nunca se sirve por HTTP y está en `.gitignore`.

| Servicio | Para qué | Plan gratuito |
|---|---|---|
| [Pexels](https://www.pexels.com/api/) | Fotos y videos reales | 200 pedidos/hora |
| [Cloudflare Workers AI](https://dash.cloudflare.com) | Imágenes IA (FLUX-1 schnell) | 10 000 neuronas/día |
| [Gemini](https://aistudio.google.com/apikey) | Visión (describir imágenes) | Con cuota |
| [DeepSeek](https://platform.deepseek.com) | Generador y visión (`deepseek-flash`) | De pago |

---

## Estructura

```
index.html          Interfaz (vistas: Setup, Contexto, Generador, Ejecutor, Configuración, Banco)
styles.css          Estilos
app.js              Lógica del cliente: técnicas, prompts, SSoT, pipeline, Estudio, Banco
iframe.html         Superficie aislada para la vista previa del HTML generado
loaders.js, fx.js   Animaciones de carga y efectos de la interfaz
server.js           Servidor local: estáticos, proxy a proveedores, OpenCode, Banco, multimedia
media.js            Multimedia: subidas, Pexels/Pixabay, Cloudflare, visión, video con ffmpeg
preview-runner.js   Vista previa real de proyectos React/Vue (Vite) y Next.js
bank-store.js       Persistencia del Banco en disco
prompt.md           Especificación original del proyecto
DOCUMENTACION.md    Documentación técnica detallada (decisiones, técnicas, auditoría)
```

Se crean al usar la app (fuera de git): `banco/` (landings guardadas) y `media/` (imágenes y videos).

## Pruebas

```bash
node tests/run.js           # todas
node tests/run.js integ     # solo las que contienen "integ"
```

No hacen llamadas reales a APIs de pago: usan respuestas simuladas y un opencode simulado.
Hoy la carpeta `tests/` está en `.gitignore`, así que solo existe en la copia local.

---

## Seguridad y límites

- El HTML generado se muestra en un `iframe` con `sandbox` (sin acceso al origen de la app); las landings del
  Banco y las vistas en ventana nueva se sirven con `Content-Security-Policy: sandbox`.
- En proyectos React/Vue/Next.js se puede usar cualquier paquete npm: se verifica que exista en el registro y
  se instala con `--ignore-scripts`. Se rechazan los módulos internos de Node.
- El servidor escucha solo en `127.0.0.1`. Pensado para uso local: no validar `Origin`/`Host` es una
  limitación conocida si se expusiera en red.
- No hay generación de video con IA gratuita: el video se arma con fotogramas generados + ffmpeg.

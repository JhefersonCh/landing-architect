/*
 * Landing Page Prompt Architect — server.js
 *
 * Servidor estático + proxy local, sin dependencias externas (sólo Node
 * >=18, que trae `fetch` nativo). Tres funciones:
 *
 *   1) Servir los archivos estáticos del proyecto (index.html, styles.css,
 *      app.js, iframe.html, etc.) por http://localhost, para que la app no
 *      dependa de file:// (algunos proveedores bloquean CORS para el origen
 *      "null" que usa file://).
 *   2) POST /api/proxy: reenvía una petición a un proveedor externo (por
 *      ejemplo Anthropic o un endpoint compatible con OpenAI) desde el
 *      servidor, evitando el bloqueo de CORS del navegador.
 *   3) GET /api/opencode/models y POST /api/opencode/run: ejecutan el CLI de
 *      OpenCode instalado localmente (no la API HTTP de opencode Zen, cuyo
 *      nivel gratuito rechaza clientes que no sean el propio OpenCode). Ver
 *      DOCUMENTACION.md para el porqué.
 *
 * Uso: `node server.js` (o `PORT=4000 node server.js`) y abrir la URL que
 * imprime por consola.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');
const { extractHtml, extractPlainText, normalizeProjectFilesText, createStreamAccumulator } = require('./app.js');
const { isValidId: isValidBancoId, makeBankStore, ID_RE: BANCO_ID_RE } = require('./bank-store.js');
const { createPreviewRunner, looksLikeFileBlocks } = require('./preview-runner.js');
const { createMedia, loadEnvFile, UPLOAD_MAX_BODY_BYTES: MEDIA_MAX_BODY_BYTES } = require('./media.js');

const ROOT = __dirname;
// Claves de servicios externos (Pexels, Cloudflare, Gemini...): .env en la
// raíz, parser propio sin dependencias. No pisa variables ya definidas y el
// archivo jamás se sirve por HTTP (isBlockedPath bloquea todo dotfile).
loadEnvFile(path.join(ROOT, '.env'));
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = '127.0.0.1';

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB
const BANCO_MAX_BODY_BYTES = 20 * 1024 * 1024; // 20 MB: landings con varias versiones embebidas pesan más que 2 MB
const PROXY_TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT_MS) || 10 * 60 * 1000; // 10 minutos: modelos que razonan + landings largas

// Vista previa efímera del Estudio ("Abrir en ventana nueva"): el HTML
// (posiblemente sin guardar todavía) se sube acá y se sirve por GET
// /preview/<id> con Content-Security-Policy: sandbox (origen opaco), para
// que la pestaña nueva NUNCA comparta origen con esta app — si compartiera
// origen, un script del HTML generado podría leer el localStorage donde
// viven las claves de API de los proveedores. Ver handlePreviewCreate/Get.
const PREVIEW_MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB: mismo orden que una landing con versiones
const PREVIEW_TTL_MS = 30 * 60 * 1000; // 30 minutos
const PREVIEW_MAX_ENTRIES = 20;
const PREVIEW_SANDBOX_CSP = 'sandbox allow-scripts allow-popups allow-forms';
const previews = new Map(); // id -> { html, expiresAt }

// Preview de proyectos multi-archivo (Vite React/Vue, Next.js): ver
// preview-runner.js. Levanta dev servers en 127.0.0.1 (puerto libre) y los
// mata por grupo de procesos al salir.
const PROJECT_PREVIEW_MAX_BODY_BYTES = 6 * 1024 * 1024;
const previewRunner = createPreviewRunner();

const RUNS_DIR = path.join(ROOT, 'runs'); // legado: ya no se escribe acá, se deja el bloqueo en isBlockedPath por las dudas

// Banco (landings guardadas), persistido en disco dentro del proyecto. Ver
// bank-store.js para el layout exacto de banco/<id>/ y DOCUMENTACION.md §1.
const BANCO_DIR = path.join(ROOT, 'banco');
const MEDIA_DIR = path.join(ROOT, 'media'); // subidas, fotos de stock descargadas e imágenes generadas (ver media.js)
const bankStore = makeBankStore(BANCO_DIR, { mediaDir: MEDIA_DIR }); // crea banco/ si no existe
const media = createMedia({ mediaDir: MEDIA_DIR, bancoDir: BANCO_DIR });

// Directorio de trabajo de OpenCode, FUERA del proyecto (en el tmp del SO).
// Confirmado con bisección real (ver DOCUMENTACION.md): un `opencode.json`
// por-run con `permission`/`mcp` restrictivos hace que opencode Zen rechace
// la llamada con 403 FreeTierError ("can only be used from within
// OpenCode") — la sola presencia de un config no-default alcanza para
// gatillarlo. Por eso ya NO se escribe ningún `opencode.json` acá: el único
// aislamiento es que este directorio está vacío y fuera del proyecto.
const OPENCODE_WORKSPACE_ROOT = path.join(os.tmpdir(), 'lpa-opencode');

// Tiempos de OpenCode, todos overrideables por variable de entorno (ver
// DOCUMENTACION.md). El nivel gratuito de opencode Zen es inestable: a veces
// responde en 10 s, a veces se queda mudo (ni un byte de stdout) de forma
// indefinida. Por eso todo tiene un timeout corto y hay fallback automático
// entre modelos gratis en vez de un único timeout largo.
const OPENCODE_ATTEMPT_TIMEOUT_MS = Number(process.env.OPENCODE_ATTEMPT_TIMEOUT_MS) || 120000; // por intento (expect:'text' — meta-prompt/reparación)
const OPENCODE_TOTAL_BUDGET_MS = Number(process.env.OPENCODE_TOTAL_BUDGET_MS) || 6 * 60 * 1000; // total de la request cuando expect:'text'
// Modo espectáculo (ver DOCUMENTACION.md): el HTML ejecutado ahora pide GSAP
// ScrollTrigger, three.js y más contenido (imágenes, SVG, coreografía de
// movimiento), por lo que el modelo tarda más en producirlo. La generación
// de prompt (expect:'text') se queda en 120s/6min; solo la ejecución
// (expect:'html') sube su timeout por intento y su presupuesto total.
const OPENCODE_HTML_ATTEMPT_TIMEOUT_MS = Number(process.env.OPENCODE_HTML_ATTEMPT_TIMEOUT_MS) || 240000; // por intento, solo expect:'html'
const OPENCODE_HTML_TOTAL_BUDGET_MS = Number(process.env.OPENCODE_HTML_TOTAL_BUDGET_MS) || 9 * 60 * 1000; // total de la request, solo expect:'html'
const OPENCODE_FIRST_BYTE_TIMEOUT_MS = Number(process.env.OPENCODE_FIRST_BYTE_TIMEOUT_MS) || 45000; // "stall": nada de stdout todavía
const OPENCODE_MAX_ATTEMPTS = Number(process.env.OPENCODE_MAX_ATTEMPTS) || 8; // techo de intentos; el límite real de tiempo lo pone OPENCODE_TOTAL_BUDGET_MS
const OPENCODE_MODELS_CACHE_MS = Number(process.env.OPENCODE_MODELS_CACHE_MS) || 30 * 60 * 1000; // 30 minutos
const OPENCODE_MAX_RUNS_KEPT = 20;
const OPENCODE_RECOMMENDED_MODEL = 'opencode/muse-spark-1.3-contributor-free'; // confirmado funcionando con pruebas reales repetidas en esta sesión

/* =========================================================================
 * Cola single-flight + cancelación
 *
 * El nivel gratis de opencode Zen es anti-abuso: dos llamadas simultáneas
 * pueden hacer que ambas fallen. Por eso TODO lo que ejecuta el CLI de
 * OpenCode (generación de landing, meta-prompt, reparación, edición con IA)
 * pasa por esta misma cola: sólo hay un proceso `opencode run` corriendo a
 * la vez en todo el servidor, sea cual sea el endpoint que lo pidió.
 *
 * `runId`: lo genera el cliente (o se genera acá si no lo manda) y viaja en
 * el cuerpo de la request ANTES de que la respuesta HTTP se resuelva —así
 * el cliente puede cancelar (POST /api/opencode/cancel) mientras la
 * request original sigue en cola o corriendo, sin necesitar streaming.
 * ========================================================================= */

const activeRuns = new Map(); // runId -> { cancelled: bool, killCurrent: fn|null }
let queueLength = 0; // requests esperando su turno (no cuenta la que está corriendo)
let queueTail = Promise.resolve();

function enqueue(taskFn) {
  queueLength++;
  const runP = queueTail.then(() => {
    queueLength--;
    return taskFn();
  });
  // Nunca dejar que un rechazo corte la cadena para el siguiente en la cola.
  queueTail = runP.then(() => {}, () => {});
  return runP;
}

function registerRun(runId) {
  const entry = { cancelled: false, killCurrent: null };
  activeRuns.set(runId, entry);
  return entry;
}

function isCancelled(runId) {
  const entry = activeRuns.get(runId);
  return !!(entry && entry.cancelled);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readRequestBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(Object.assign(new Error('Cuerpo demasiado grande'), { code: 'PAYLOAD_TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const bancoDirWithSep = BANCO_DIR.endsWith(path.sep) ? BANCO_DIR : BANCO_DIR + path.sep;

// Dentro de banco/<id>/ sólo se sirven por HTTP estático los archivos que
// el navegador necesita cargar directamente (index.html vía <link>/<script>
// relativos, y las versiones del Estudio); meta.json y prompt.md sólo se
// exponen a través del REST JSON (GET /api/banco/:id), nunca como archivo
// estático suelto.
function isServableBancoFile(requestedPath) {
  const rel = path.relative(BANCO_DIR, requestedPath).split(path.sep);
  if (rel.length === 2 && (rel[1] === 'index.html' || rel[1] === 'styles.css' || rel[1] === 'script.js')) return true;
  if (rel.length === 3 && rel[1] === 'versiones' && /^v\d+\.html$/.test(rel[2])) return true;
  // Multimedia copiada al guardar (banco/<id>/assets/<archivo>): solo tipos de imagen/video permitidos.
  if (rel.length === 3 && rel[1] === 'assets' && /^[A-Za-z0-9_-]{1,64}\.(jpg|jpeg|png|webp|gif|avif|mp4|webm)$/.test(rel[2])) return true;
  return false;
}

// Subconjunto de isServableBancoFile: sólo los documentos HTML de una
// landing guardada (index.html y versiones/vN.html), nunca styles.css ni
// script.js. Son estos los que se sirven con CSP sandbox para que abrir una
// landing guardada directamente por URL quede en un origen opaco, igual que
// /preview/<id> (Feature 3 del Estudio).
function isBancoHtmlFile(requestedPath) {
  // Sólo archivos DENTRO de banco/: sin este chequeo, el index.html de la app
  // (relativo "../index.html") matcheaba y recibía la CSP sandbox.
  if (!requestedPath.startsWith(bancoDirWithSep)) return false;
  const rel = path.relative(BANCO_DIR, requestedPath).split(path.sep);
  if (rel.length === 2 && rel[1] === 'index.html') return true;
  if (rel.length === 3 && rel[1] === 'versiones' && /^v\d+\.html$/.test(rel[2])) return true;
  return false;
}

function isBlockedPath(requestedPath) {
  const basename = path.basename(requestedPath);
  if (basename === 'server.js') return true;
  if (basename.startsWith('.')) return true; // dotfiles (.env, .git, etc.)
  const runsWithSep = RUNS_DIR.endsWith(path.sep) ? RUNS_DIR : RUNS_DIR + path.sep;
  if (requestedPath === RUNS_DIR || requestedPath.startsWith(runsWithSep)) return true; // los runs se sirven sólo vía la API JSON
  const mediaWithSep = MEDIA_DIR.endsWith(path.sep) ? MEDIA_DIR : MEDIA_DIR + path.sep;
  if (requestedPath === MEDIA_DIR || requestedPath.startsWith(mediaWithSep)) return true; // /media/... lo sirve media.js (allowlist propia)
  if (requestedPath === BANCO_DIR || requestedPath.startsWith(bancoDirWithSep)) {
    return !isServableBancoFile(requestedPath); // whitelist estricta dentro de banco/
  }
  return false;
}

function resolveStaticPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch (e) {
    return null;
  }
  if (decoded === '/' || decoded === '') decoded = '/index.html';

  const joined = path.normalize(path.join(ROOT, decoded));
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (joined !== ROOT && !joined.startsWith(rootWithSep)) {
    return null; // fuera del directorio del proyecto: traversal bloqueado
  }
  return joined;
}

function serveStatic(req, res) {
  const resolved = resolveStaticPath(req.url);
  if (!resolved) {
    sendJson(res, 403, { error: 'Acceso denegado: ruta fuera del directorio del proyecto.' });
    return;
  }
  if (isBlockedPath(resolved)) {
    sendJson(res, 403, { error: 'Acceso denegado.' });
    return;
  }

  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) {
      sendJson(res, 404, { error: 'No encontrado.' });
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    // no-cache: sin esto el navegador cachea app.js/styles.css por heurística
    // y sigue usando versiones viejas después de editar los archivos.
    const headers = { 'Content-Type': contentType, 'Content-Length': stats.size, 'Cache-Control': 'no-cache' };
    if (isBancoHtmlFile(resolved)) {
      headers['Content-Security-Policy'] = PREVIEW_SANDBOX_CSP;
      headers['X-Content-Type-Options'] = 'nosniff';
    }
    // Videos guardados en banco/<id>/assets/: Range para poder buscar en el video (Safari lo exige).
    const rangeM = (ext === '.mp4' || ext === '.webm') ? /^bytes=(\d+)-(\d*)$/.exec(String(req.headers.range || '')) : null;
    if (rangeM && Number(rangeM[1]) < stats.size) {
      const start = Number(rangeM[1]);
      const end = rangeM[2] ? Math.min(Number(rangeM[2]), stats.size - 1) : stats.size - 1;
      if (start <= end) {
        res.writeHead(206, Object.assign({}, headers, { 'Content-Range': `bytes ${start}-${end}/${stats.size}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' }));
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(resolved, { start, end }).pipe(res);
        return;
      }
    }
    res.writeHead(200, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(resolved).pipe(res);
  });
}

// Streaming de /api/proxy: copia los bytes SSE del proveedor al cliente sin
// bufferear (flush por chunk) y, en paralelo, arma el texto final con el mismo
// acumulador que usa el cliente para loguear UNA vez (línea [proxy]).
// Si el cliente corta, se aborta el upstream (controller.abort()).
async function pipeSseResponse({ upstream, res, controller, logLine, target, model }) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  const acc = createStreamAccumulator();
  const decoder = new TextDecoder();
  let bytes = 0;
  let clientGone = false;
  const onClose = () => { if (!res.writableEnded) { clientGone = true; controller.abort(); } };
  res.on('close', onClose);
  let outcome = 'ok';
  try {
    for await (const chunk of upstream.body) {
      if (clientGone) break;
      bytes += chunk.length;
      acc.feed(decoder.decode(chunk, { stream: true }));
      if (!res.write(chunk)) {
        await new Promise((resolve) => { res.once('drain', resolve); res.once('close', resolve); });
      }
    }
  } catch (e) {
    outcome = clientGone ? 'ABORTADO' : (e && e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR');
    if (!clientGone && !res.writableEnded) {
      const msg = outcome === 'TIMEOUT' ? 'El proveedor no terminó dentro del tiempo máximo de espera.' : 'Se cortó la conexión con el proveedor.';
      try { res.write(`event: error\ndata: ${JSON.stringify({ error: { message: msg } })}\n\n`); } catch (e2) { /* cliente ya cerrado */ }
    }
  } finally {
    res.off('close', onClose);
  }
  if (clientGone) outcome = 'ABORTADO';
  acc.feed(decoder.decode());
  acc.flush();
  let extra = `(${(bytes / 1024).toFixed(1)} KB) stream texto=${acc.text.length}`;
  if (acc.reasoning.length) extra += ` razonamiento=${acc.reasoning.length}`;
  const fin = acc.finish || acc.stopReason;
  if (fin) extra += ` finish_reason=${fin}`;
  const outTokens = acc.usage && (acc.usage.completion_tokens != null ? acc.usage.completion_tokens : acc.usage.output_tokens);
  if (outTokens != null) extra += ` tokens_salida=${outTokens}`;
  if (acc.error) extra += ` error=${acc.error.slice(0, 200)}`;
  logLine(outcome === 'ok' ? upstream.status : outcome, extra);
  if (!res.writableEnded) res.end();
}

async function handleProxy(req, res) {
  let raw;
  try {
    raw = await readRequestBody(req, MAX_BODY_BYTES);
  } catch (e) {
    if (e.code === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { error: 'El cuerpo de la solicitud supera el límite permitido (2 MB).' });
    } else {
      sendJson(res, 400, { error: 'No se pudo leer el cuerpo de la solicitud.' });
    }
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8') || '{}');
  } catch (e) {
    sendJson(res, 400, { error: 'El cuerpo debe ser JSON válido.' });
    return;
  }

  const { url, headers, body } = payload || {};
  // Sólo https://. Excepción de PRUEBAS (LPA_TEST_ALLOW_HTTP=1, apagada por
  // defecto): permite http:// para apuntar a un upstream falso local.
  const allowedScheme = process.env.LPA_TEST_ALLOW_HTTP === '1' ? /^https?:\/\//i : /^https:\/\//i;
  if (!url || typeof url !== 'string' || !allowedScheme.test(url)) {
    sendJson(res, 400, { error: 'La URL de destino debe ser una URL https:// válida.' });
    return;
  }

  const outgoingHeaders = (headers && typeof headers === 'object') ? headers : {};
  // stream:true (a nivel del payload) -> se reenvía al proveedor con
  // `stream: true` en su cuerpo y la respuesta SSE se pasa tal cual.
  const streamMode = payload.stream === true;
  let outgoingBody;
  if (streamMode) {
    let b = body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
    if (b && typeof b === 'object') { b = Object.assign({}, b, { stream: true }); outgoingBody = JSON.stringify(b); }
    else outgoingBody = typeof body === 'string' ? body : JSON.stringify(body || {});
  } else {
    outgoingBody = typeof body === 'string' ? body : JSON.stringify(body || {});
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  // Streaming: si el cliente corta antes de que el proveedor conteste, se
  // aborta el upstream (una vez emitidos los headers SSE lo maneja pipeSseResponse).
  if (streamMode) res.on('close', () => { if (!res.writableEnded) controller.abort(); });

  // Log de una línea por llamada (nunca headers ni claves): destino, modelo,
  // estado, duración, tamaño y finish_reason, para saber si el proveedor
  // respondió bien o falló.
  const startedAt = Date.now();
  let target = url;
  try { const u = new URL(url); target = u.host + u.pathname; } catch (e) { /* url ya validada arriba */ }
  const model = (body && typeof body === 'object' && body.model) || '?';
  const logLine = (status, extra) => console.log(`[proxy] ${new Date().toLocaleTimeString('es')} ${target} modelo=${model} → ${status} en ${((Date.now() - startedAt) / 1000).toFixed(1)}s${extra ? ' ' + extra : ''}`);

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: outgoingHeaders,
      body: outgoingBody,
      signal: controller.signal,
    });
    if (streamMode && upstream.ok && /text\/event-stream/i.test(upstream.headers.get('content-type') || '') && upstream.body) {
      await pipeSseResponse({ upstream, res, controller, logLine, target, model });
      return;
    }
    const text = await upstream.text();
    let extra = `(${(Buffer.byteLength(text) / 1024).toFixed(1)} KB)`;
    try {
      const parsed = JSON.parse(text);
      const choice = parsed.choices && parsed.choices[0];
      if (choice && choice.finish_reason) extra += ` finish_reason=${choice.finish_reason}`;
      if (parsed.usage && parsed.usage.completion_tokens != null) extra += ` tokens_salida=${parsed.usage.completion_tokens}`;
      if (!upstream.ok) extra += ` error=${JSON.stringify(parsed.error || parsed).slice(0, 200)}`;
    } catch (e) { if (!upstream.ok) extra += ` error=${text.slice(0, 200)}`; }
    logLine(upstream.status, extra);
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
    res.writeHead(upstream.status, {
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(text),
    });
    res.end(text);
  } catch (e) {
    if (streamMode && res.destroyed) { logLine('ABORTADO', 'antes de la primera respuesta'); return; }
    logLine(e && e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR', e && e.message);
    if (e && e.name === 'AbortError') {
      sendJson(res, 504, { error: 'El proveedor no respondió dentro del tiempo máximo de espera (10 minutos).' });
    } else {
      sendJson(res, 502, { error: 'No se pudo conectar con el proveedor configurado. Verificá la URL y tu conexión.' });
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/* =========================================================================
 * Vista previa efímera ("Abrir en ventana nueva" del Estudio)
 * ========================================================================= */

function prunePreviews() {
  const now = Date.now();
  for (const [id, entry] of previews) {
    if (entry.expiresAt <= now) previews.delete(id);
  }
  while (previews.size > PREVIEW_MAX_ENTRIES) {
    const oldestId = previews.keys().next().value; // Map conserva orden de inserción
    previews.delete(oldestId);
  }
}

async function handlePreviewCreate(req, res) {
  let raw;
  try {
    raw = await readRequestBody(req, PREVIEW_MAX_BODY_BYTES);
  } catch (e) {
    sendJson(res, e.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400, {
      error: e.code === 'PAYLOAD_TOO_LARGE' ? 'El HTML supera el límite permitido (10 MB).' : 'No se pudo leer el cuerpo de la solicitud.',
    });
    return;
  }
  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8') || '{}');
  } catch (e) {
    sendJson(res, 400, { error: 'El cuerpo debe ser JSON válido.' });
    return;
  }
  if (typeof payload.html !== 'string' || !payload.html.trim()) {
    sendJson(res, 400, { error: 'Falta el HTML a previsualizar.' });
    return;
  }
  prunePreviews();
  const id = crypto.randomBytes(12).toString('hex');
  previews.set(id, { html: payload.html, expiresAt: Date.now() + PREVIEW_TTL_MS });
  sendJson(res, 201, { url: `/preview/${id}` });
}

function handlePreviewGet(req, res, id) {
  prunePreviews();
  const entry = previews.get(id);
  if (!entry) { sendJson(res, 404, { error: 'La vista previa no existe o ya expiró.' }); return; }
  const body = entry.html;
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Content-Security-Policy': PREVIEW_SANDBOX_CSP,
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') { res.end(); return; }
  res.end(body);
}

const RE_PREVIEW_ITEM = /^\/preview\/([a-f0-9]{24})\/?$/;

/* =========================================================================
 * OpenCode CLI local (proveedor "OpenCode local")
 * ========================================================================= */

function resolveOpencodeBin() {
  const homeCandidate = path.join(os.homedir(), '.opencode', 'bin', 'opencode');
  if (fs.existsSync(homeCandidate)) return homeCandidate;
  return 'opencode'; // se resuelve por PATH; si no existe, execFile falla con ENOENT
}

const OPENCODE_BIN = resolveOpencodeBin();

let modelsCache = null; // { at: number, models: [{id, provider, model, free, verified, status, ms, error}] }

function parseModelsOutput(stdout) {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && /^[^/\s]+\/[^/\s]+$/.test(line))
    .map((id) => {
      const slash = id.indexOf('/');
      const provider = id.slice(0, slash);
      const model = id.slice(slash + 1);
      return { id, provider, model, free: /-free$/i.test(model) };
    });
}

function fetchOpencodeModels() {
  return new Promise((resolve, reject) => {
    execFile(OPENCODE_BIN, ['models'], { timeout: 30000, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err) {
        if (err.code === 'ENOENT') {
          reject(Object.assign(new Error('No se encontró el binario de OpenCode. Instalalo o verificá que esté en el PATH (o en ~/.opencode/bin/opencode).'), { userMessage: true }));
        } else {
          reject(new Error('No se pudo listar los modelos de OpenCode: ' + (err.message || 'error desconocido')));
        }
        return;
      }
      resolve(parseModelsOutput(stdout || ''));
    });
  });
}

// Junta el texto final de una respuesta `opencode run --format json`
// (NDJSON: un evento por línea). Cada evento con part.type === "text" trae
// el texto acumulado de esa parte hasta ese momento; nos quedamos con el
// último valor visto por part.id y concatenamos en orden de aparición.
// Confirmado con pruebas reales contra los 6 modelos gratis.
function assembleTextFromNdjson(raw) {
  const parts = new Map();
  let order = 0;
  String(raw || '').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let evt;
    try { evt = JSON.parse(trimmed); } catch (e) { return; }
    const part = evt && evt.part;
    if (!part || part.type !== 'text' || typeof part.text !== 'string') return;
    if (parts.has(part.id)) parts.get(part.id).text = part.text;
    else parts.set(part.id, { order: order++, text: part.text });
  });
  return Array.from(parts.values()).sort((a, b) => a.order - b.order).map((p) => p.text).join('\n').trim();
}

// Ejecuta `opencode run` una vez, sin reintentos, con dos timeouts propios:
//   - attemptTimeoutMs: tiempo total máximo del intento.
//   - firstByteTimeoutMs: si no llega ni un byte de stdout en este tiempo,
//     se corta antes ("stall"): es el síntoma real que reportó el usuario
//     (el backend gratis de opencode Zen a veces no responde nada, nunca).
// No usa pty: confirmado con pruebas reales (múltiples corridas exitosas
// via execFile/spawn directo, sin pseudo-terminal) que la versión 1.18.32
// no necesita una pty para responder por stdout; el comentario anterior
// sobre "se cuelga sin pty" no se reprodujo y el pty+python fue removido.
function runOpencodeAttempt({ model, message, runDir, attemptTimeoutMs, firstByteTimeoutMs, onSpawn, onText }) {
  return new Promise((resolve) => {
    const args = ['run', '-m', model, '--dir', runDir, '--format', 'json', message];
    const startedAt = Date.now();
    let settled = false;
    let firstByteAt = null;
    let stdoutBuf = '';
    let stderrBuf = '';

    const child = spawn(OPENCODE_BIN, args, { cwd: runDir, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });

    const killGroup = (signal) => {
      try { process.kill(-child.pid, signal); } catch (e) { try { child.kill(signal); } catch (e2) { /* ya terminó */ } }
    };

    // Le pasamos al llamador una forma de matar ESTE intento desde afuera
    // (cancelación pedida por el usuario mientras el proceso ya está corriendo).
    if (typeof onSpawn === 'function') onSpawn(killGroup);

    let attemptTimer;
    let stallTimer;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(attemptTimer);
      clearTimeout(stallTimer);
      resolve(Object.assign({ ms: Date.now() - startedAt }, result));
    };

    // Streaming: ensambla incrementalmente las partes de texto (misma lógica
    // que assembleTextFromNdjson) y avisa el texto acumulado vía onText.
    const liveParts = new Map();
    let liveOrder = 0;
    let liveLineBuf = '';
    const liveFeed = (str) => {
      liveLineBuf += str;
      let nl;
      let changed = false;
      while ((nl = liveLineBuf.indexOf('\n')) >= 0) {
        const line = liveLineBuf.slice(0, nl).trim();
        liveLineBuf = liveLineBuf.slice(nl + 1);
        if (!line) continue;
        let evt;
        try { evt = JSON.parse(line); } catch (e) { continue; }
        const part = evt && evt.part;
        if (!part || part.type !== 'text' || typeof part.text !== 'string') continue;
        if (liveParts.has(part.id)) liveParts.get(part.id).text = part.text;
        else liveParts.set(part.id, { order: liveOrder++, text: part.text });
        changed = true;
      }
      if (changed) onText(Array.from(liveParts.values()).sort((a, b) => a.order - b.order).map((p) => p.text).join('\n'));
    };

    child.stdout.on('data', (chunk) => {
      if (firstByteAt === null) { firstByteAt = Date.now(); clearTimeout(stallTimer); }
      const str = chunk.toString('utf8');
      stdoutBuf += str;
      if (typeof onText === 'function' && !settled) liveFeed(str);
    });
    child.stderr.on('data', (chunk) => { stderrBuf += chunk.toString('utf8'); });

    child.on('error', (err) => {
      finish({
        status: 'error',
        error: err && err.code === 'ENOENT'
          ? 'No se encontró el binario de OpenCode.'
          : (err.message || 'Error desconocido al iniciar OpenCode.'),
      });
    });

    child.on('close', (code, signal) => {
      if (settled) return; // ya resuelto por timeout/stall; esto es sólo la salida tardía del proceso matado
      if (signal) {
        finish({ status: 'error', error: `El proceso terminó por señal ${signal}.` });
        return;
      }
      const text = assembleTextFromNdjson(stdoutBuf);
      if (!text) {
        finish({ status: 'error', error: (stderrBuf || stdoutBuf || 'OpenCode no devolvió texto.').slice(-1000) });
        return;
      }
      finish({ status: 'ok', text });
    });

    attemptTimer = setTimeout(() => {
      finish({ status: 'timeout', error: `Sin respuesta completa dentro de ${Math.round(attemptTimeoutMs / 1000)}s.` });
      killGroup('SIGTERM');
      setTimeout(() => killGroup('SIGKILL'), 3000);
    }, attemptTimeoutMs);

    stallTimer = setTimeout(() => {
      finish({ status: 'stall', error: `Sin primera respuesta dentro de ${Math.round(firstByteTimeoutMs / 1000)}s (el backend gratuito no contestó nada).` });
      killGroup('SIGTERM');
      setTimeout(() => killGroup('SIGKILL'), 3000);
    }, firstByteTimeoutMs);
  });
}

// NO se prueba cada modelo `-free` en cada request (a diferencia de una
// versión anterior de este archivo). Confirmado con pruebas reales: mandar
// probes extra consume presupuesto del nivel gratis y a veces el probe
// mismo se cuelga/rechaza aunque el modelo esté bien — probar de más
// empeora justo lo que se quiere medir. En cambio: se lista lo que devuelve
// `opencode models` (llamada liviana, <1s) y se marca `recommended: true`
// en `opencode/muse-spark-1.3-contributor-free`, confirmado funcionando con
// múltiples pruebas reales en esta sesión (bisección incluida). El usuario
// elige otro modelo si quiere; el fallback automático de POST
// /api/opencode/run se encarga de saltar al siguiente si el elegido falla.
async function getOpencodeModels(forceRefresh) {
  const now = Date.now();
  if (!forceRefresh && modelsCache && (now - modelsCache.at) < OPENCODE_MODELS_CACHE_MS) {
    return modelsCache.models;
  }
  const raw = await fetchOpencodeModels();
  const models = raw.map((m) => Object.assign({}, m, { recommended: m.id === OPENCODE_RECOMMENDED_MODEL }));
  modelsCache = { at: now, models };
  return models;
}

async function handleOpencodeModelsRequest(req, res) {
  try {
    const forceRefresh = /[?&]refresh=1(&|$)/.test(req.url || '');
    const models = await getOpencodeModels(forceRefresh);
    sendJson(res, 200, { models, cachedForMs: OPENCODE_MODELS_CACHE_MS });
  } catch (e) {
    sendJson(res, 502, { error: e.message || 'No se pudo obtener la lista de modelos de OpenCode.' });
  }
}

function pruneOldRuns() {
  fs.readdir(OPENCODE_WORKSPACE_ROOT, (err, entries) => {
    if (err) return;
    const dirs = entries.filter((name) => {
      try { return fs.statSync(path.join(OPENCODE_WORKSPACE_ROOT, name)).isDirectory(); } catch (e) { return false; }
    }).sort();
    const excess = dirs.length - OPENCODE_MAX_RUNS_KEPT;
    if (excess <= 0) return;
    dirs.slice(0, excess).forEach((name) => {
      fs.rm(path.join(OPENCODE_WORKSPACE_ROOT, name), { recursive: true, force: true }, () => {});
    });
  });
}

const NO_TOOLS_SUFFIX = 'No uses ninguna herramienta: no leas ni escribas archivos, no ejecutes comandos, no busques en la web.';

// expect:'files' (proyectos multi-archivo): devuelve el texto CRUDO con los
// bloques `=== FILE: ruta ===` … `=== END FILE ===`. extractHtml los
// destruiría; acá sólo se recorta lo que haya antes/después de los bloques.
function extractFilesText(raw) {
  if (!raw) return '';
  // Mismo lector tolerante que el cliente (marcadores decorados, cierre
  // olvidado, formato markdown "ruta + bloque ```").
  const text = normalizeProjectFilesText(String(raw).replace(/\r\n/g, '\n'));
  if (!looksLikeFileBlocks(text)) return '';
  const start = text.search(/^[ \t]*=== FILE:/m);
  const endMarker = '=== END FILE ===';
  const end = text.lastIndexOf(endMarker);
  return text.slice(start, end + endMarker.length).trim();
}

function buildOpencodeInstruction(prompt, expect) {
  if (expect === 'files') {
    return `${prompt}\n\nRespondé ÚNICAMENTE con los archivos del proyecto, cada uno dentro de un bloque \`=== FILE: ruta/relativa ===\` … \`=== END FILE ===\`, directamente como tu respuesta de texto, sin explicaciones antes o después y sin bloques de código markdown alrededor de los archivos. ${NO_TOOLS_SUFFIX}`;
  }
  if (expect === 'text') {
    return `${prompt}\n\nRespondé ÚNICAMENTE con el texto pedido, directamente como tu respuesta, sin preámbulo, sin explicaciones antes o después, sin bloques de código markdown ni comillas triples alrededor. ${NO_TOOLS_SUFFIX}`;
  }
  return `${prompt}\n\nRespondé ÚNICAMENTE con el documento HTML completo y autocontenido de la landing page (arrancando en <!DOCTYPE html> y terminando en </html>). Escribí el HTML directamente como tu respuesta de texto, sin explicaciones ni bloques de código markdown alrededor. ${NO_TOOLS_SUFFIX}`;
}

// Arma el orden de modelos a probar: el pedido por el usuario primero,
// después `OPENCODE_RECOMMENDED_MODEL` si no es el mismo (confirmado
// funcionando con pruebas reales), después el resto de los modelos gratis,
// como fallback automático. Nunca cae solo a modelos pagos sin que el
// usuario lo haya pedido explícitamente. Ya no hay `verified`/`ms` por
// modelo (se sacó el probing, ver getOpencodeModels), así que el orden es
// simple: pedido → recomendado → resto.
function buildFallbackOrder(models, requestedModel) {
  const requested = models.find((m) => m.id === requestedModel);
  const others = models
    .filter((m) => m.id !== requestedModel && m.free)
    .sort((a, b) => (a.recommended ? 0 : 1) - (b.recommended ? 0 : 1));
  return [requested].concat(others).filter(Boolean).slice(0, OPENCODE_MAX_ATTEMPTS);
}

// Orquestador genérico: corre `opencode run` con fallback secuencial entre
// modelos gratis hasta conseguir una respuesta válida (HTML o texto plano,
// según `expect`), respetando cancelación cooperativa vía `activeRuns`.
// Usado tanto por /api/opencode/complete como por /api/opencode/run (thin
// wrapper para compatibilidad). NO gestiona la cola: quien lo llama debe
// haberlo hecho ya dentro de `enqueue()`.
async function runOpencodeOrchestrated({ prompt, model, expect, runId, req, streamRes, onStreamEvent }) {
  let models;
  try {
    models = await getOpencodeModels(false);
  } catch (e) {
    return { ok: false, status: 502, body: { error: e.message || 'No se pudo validar el modelo contra OpenCode.', runId } };
  }
  if (!models.some((m) => m.id === model)) {
    return { ok: false, status: 400, body: { error: `El modelo "${model}" no está disponible en OpenCode. Consultá /api/opencode/models.`, runId } };
  }

  const dirId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const runDir = path.join(OPENCODE_WORKSPACE_ROOT, dirId); // fuera del proyecto, vacío, sin opencode.json propio (ver comentario en OPENCODE_WORKSPACE_ROOT)
  try {
    fs.mkdirSync(runDir, { recursive: true });
  } catch (e) {
    return { ok: false, status: 500, body: { error: 'No se pudo crear el directorio de trabajo para la ejecución.', runId } };
  }

  const message = buildOpencodeInstruction(prompt, expect);
  const order = buildFallbackOrder(models, model);
  const attempts = [];
  const budgetStart = Date.now();
  let finalText = '';
  let htmlFallback = '';
  let finalModel = '';
  let abortedByClient = false;

  // expect:'html' (ejecución del prompt final, Modo espectáculo) recibe más
  // tiempo por intento y más presupuesto total que expect:'text' (generación
  // del prompt): ver constantes arriba.
  const longRun = expect === 'html' || expect === 'files';
  const totalBudgetMs = longRun ? OPENCODE_HTML_TOTAL_BUDGET_MS : OPENCODE_TOTAL_BUDGET_MS;
  const perAttemptTimeoutMs = longRun ? OPENCODE_HTML_ATTEMPT_TIMEOUT_MS : OPENCODE_ATTEMPT_TIMEOUT_MS;

  const onClose = () => { abortedByClient = true; };
  if (req) req.on('close', onClose);
  // Streaming: la conexión de RESPUESTA se corta cuando el cliente cancela
  // (AbortController): se mata el proceso de opencode en curso.
  const onResClose = () => {
    if (streamRes.writableEnded) return;
    abortedByClient = true;
    const entry = activeRuns.get(runId);
    if (entry) {
      entry.cancelled = true;
      if (entry.killCurrent) {
        entry.killCurrent('SIGTERM');
        setTimeout(() => { if (entry.killCurrent) entry.killCurrent('SIGKILL'); }, 3000);
      }
    }
  };
  if (streamRes) streamRes.on('close', onResClose);
  let streamedAny = false;

  for (const m of order) {
    if (abortedByClient || isCancelled(runId)) { attempts.push({ model: m.id, status: 'cancelled' }); break; }

    const remaining = totalBudgetMs - (Date.now() - budgetStart);
    if (remaining <= 5000) break; // no queda presupuesto para otro intento serio

    const attemptTimeoutMs = Math.min(perAttemptTimeoutMs, remaining);
    const firstByteTimeoutMs = Math.min(OPENCODE_FIRST_BYTE_TIMEOUT_MS, attemptTimeoutMs);

    if (typeof onStreamEvent === 'function') {
      // Cambio de modelo tras un intento que ya había emitido texto: el
      // cliente descarta el parcial anterior.
      if (streamedAny) { onStreamEvent({ type: 'restart', model: m.id }); streamedAny = false; }
      onStreamEvent({ type: 'attempt', model: m.id });
    }

    // eslint-disable-next-line no-await-in-loop -- fallback secuencial, intencional
    const result = await runOpencodeAttempt({
      model: m.id,
      message,
      runDir,
      attemptTimeoutMs,
      firstByteTimeoutMs,
      onText: typeof onStreamEvent === 'function'
        ? (textSoFar) => { streamedAny = true; onStreamEvent({ type: 'delta', text: textSoFar }); }
        : undefined,
      onSpawn: (killGroup) => {
        const entry = activeRuns.get(runId);
        if (entry) entry.killCurrent = killGroup;
      },
    });

    if (isCancelled(runId)) {
      attempts.push({ model: m.id, status: 'cancelled', ms: result.ms });
      break;
    }

    if (result.status === 'ok') {
      let text = expect === 'text' ? extractPlainText(result.text) : (expect === 'files' ? extractFilesText(result.text) : extractHtml(result.text));
      if (!text && expect === 'files') {
        // Respaldo: el modelo devolvió un HTML único en vez del proyecto.
        const html = extractHtml(result.text);
        if (html) { htmlFallback = html; text = '(html)'; }
      }
      if (text) {
        attempts.push({ model: m.id, status: 'ok', ms: result.ms });
        finalText = text;
        finalModel = m.id;
        break;
      }
      attempts.push({ model: m.id, status: expect === 'text' ? 'sin-texto' : (expect === 'files' ? 'sin-archivos' : 'sin-html'), ms: result.ms, error: 'La respuesta no contenía contenido reconocible.' });
      continue;
    }
    attempts.push({ model: m.id, status: result.status, ms: result.ms, error: result.error });
  }

  if (req) req.off('close', onClose);
  if (streamRes) streamRes.off('close', onResClose);
  pruneOldRuns();

  if (abortedByClient) return { ok: false, aborted: true };

  if (finalText) {
    const body = { model: finalModel, runId, attempts };
    if (htmlFallback) {
      body.text = '';
      body.html = htmlFallback;
      body.htmlFallback = true;
    } else {
      body[(expect === 'text' || expect === 'files') ? 'text' : 'html'] = finalText;
    }
    return { ok: true, status: 200, body };
  }

  const cancelledLast = attempts.length && attempts[attempts.length - 1].status === 'cancelled';
  return {
    ok: false,
    status: cancelledLast ? 499 : 504,
    body: {
      error: cancelledLast
        ? 'Ejecución cancelada por el usuario.'
        : `Ningún modelo gratuito de OpenCode respondió con ${expect === 'text' ? 'texto' : (expect === 'files' ? 'archivos de proyecto (bloques === FILE ===)' : 'un HTML')} válido dentro del presupuesto total. Mirá "attempts" para el detalle de cada intento.`,
      attempts,
      runId,
    },
  };
}

function normalizeRunId(payload) {
  const clientId = typeof payload.runId === 'string' ? payload.runId.trim() : '';
  if (clientId && /^[a-zA-Z0-9_-]{1,128}$/.test(clientId)) return clientId;
  return `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function readAndValidateOpencodePayload(req) {
  let raw;
  try {
    raw = await readRequestBody(req, MAX_BODY_BYTES);
  } catch (e) {
    return { error: e.code === 'PAYLOAD_TOO_LARGE' ? { status: 413, message: 'El cuerpo de la solicitud supera el límite permitido (2 MB).' } : { status: 400, message: 'No se pudo leer el cuerpo de la solicitud.' } };
  }
  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8') || '{}');
  } catch (e) {
    return { error: { status: 400, message: 'El cuerpo debe ser JSON válido.' } };
  }
  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
  const model = typeof payload.model === 'string' ? payload.model.trim() : '';
  if (!prompt) return { error: { status: 400, message: 'Falta el prompt a ejecutar.' } };
  if (!model || !/^[^/\s]+\/[^/\s]+$/.test(model)) return { error: { status: 400, message: 'El modelo debe tener el formato proveedor/modelo.' } };
  return { payload, prompt, model };
}

// POST /api/opencode/complete {prompt, model, expect: 'text'|'html'|'files', runId?}
// Endpoint genérico de Feature 1/2: meta-prompt, reparación y edición con IA
// pasan por acá con expect:'text' o expect:'html' según corresponda. Encola
// (single-flight) para nunca correr dos procesos de OpenCode en paralelo.
async function handleOpencodeComplete(req, res) {
  const parsed = await readAndValidateOpencodePayload(req);
  if (parsed.error) { sendJson(res, parsed.error.status, { error: parsed.error.message }); return; }
  const { payload, prompt, model } = parsed;
  const expect = payload.expect === 'text' ? 'text' : (payload.expect === 'files' ? 'files' : 'html');
  const runId = normalizeRunId(payload);
  registerRun(runId);

  // stream:true -> NDJSON (application/x-ndjson), un objeto por línea:
  //   {type:'start',runId} · {type:'attempt',model} · {type:'delta',text:<acumulado>}
  //   · {type:'restart',model} (cambio de modelo: descartar parcial)
  //   · {type:'done',...body} | {type:'error',status,...body}
  // El texto de 'delta' es el acumulado completo (opencode entrega partes de
  // texto acumuladas); 'append' no se usa para no depender del orden.
  if (payload.stream === true) {
    res.writeHead(200, {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    const send = (obj) => { if (!res.writableEnded && !res.destroyed) { try { res.write(JSON.stringify(obj) + '\n'); } catch (e) { /* cliente cerrado */ } } };
    send({ type: 'start', runId });
    try {
      const result = await enqueue(() => runOpencodeOrchestrated({ prompt, model, expect, runId, req: null, streamRes: res, onStreamEvent: send }));
      if (result.aborted) { if (!res.writableEnded) res.end(); return; }
      send(result.ok ? Object.assign({ type: 'done' }, result.body) : Object.assign({ type: 'error', status: result.status }, result.body));
      res.end();
    } finally {
      activeRuns.delete(runId);
    }
    return;
  }

  try {
    const result = await enqueue(() => runOpencodeOrchestrated({ prompt, model, expect, runId, req }));
    if (result.aborted) return; // el cliente ya cortó la conexión
    sendJson(res, result.status, result.body);
  } finally {
    activeRuns.delete(runId);
  }
}

// POST /api/opencode/run — wrapper delgado sobre /complete para compatibilidad
// (misma forma de respuesta que antes: {html, model, runId, attempts}).
async function handleOpencodeRun(req, res) {
  const parsed = await readAndValidateOpencodePayload(req);
  if (parsed.error) { sendJson(res, parsed.error.status, { error: parsed.error.message }); return; }
  const { payload, prompt, model } = parsed;
  const runId = normalizeRunId(payload);
  registerRun(runId);

  try {
    const result = await enqueue(() => runOpencodeOrchestrated({ prompt, model, expect: 'html', runId, req }));
    if (result.aborted) return;
    sendJson(res, result.status, result.body);
  } finally {
    activeRuns.delete(runId);
  }
}

// POST /api/opencode/cancel {runId}: cancelación cooperativa. Si el run ya
// está corriendo un proceso, lo mata (SIGTERM→SIGKILL) de inmediato; si
// todavía está en cola, se salta apenas le toque el turno.
async function handleOpencodeCancel(req, res) {
  let raw;
  try {
    raw = await readRequestBody(req, MAX_BODY_BYTES);
  } catch (e) {
    sendJson(res, 400, { error: 'No se pudo leer el cuerpo de la solicitud.' });
    return;
  }
  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8') || '{}');
  } catch (e) {
    sendJson(res, 400, { error: 'El cuerpo debe ser JSON válido.' });
    return;
  }
  const runId = typeof payload.runId === 'string' ? payload.runId.trim() : '';
  if (!runId) { sendJson(res, 400, { error: 'Falta runId.' }); return; }

  const entry = activeRuns.get(runId);
  if (!entry) { sendJson(res, 200, { ok: true, found: false }); return; }
  entry.cancelled = true;
  if (entry.killCurrent) {
    entry.killCurrent('SIGTERM');
    setTimeout(() => { if (entry.killCurrent) entry.killCurrent('SIGKILL'); }, 3000);
  }
  sendJson(res, 200, { ok: true, found: true });
}

// GET /api/opencode/queue: posición aproximada en la cola single-flight,
// para que la UI pueda mostrar "en cola" mientras espera su turno.
function handleOpencodeQueue(req, res) {
  sendJson(res, 200, { length: queueLength });
}

/* =========================================================================
 * Banco — REST sobre banco/<id>/ (ver bank-store.js)
 * ========================================================================= */

const RE_BANCO_COLLECTION = /^\/api\/banco\/?$/;
const RE_BANCO_ITEM = new RegExp(`^/api/banco/(${BANCO_ID_RE.source.slice(1, -1)})/?$`);
const RE_BANCO_DUPLICATE = new RegExp(`^/api/banco/(${BANCO_ID_RE.source.slice(1, -1)})/duplicate/?$`);

async function readJsonBody(req, limitBytes) {
  const raw = await readRequestBody(req, limitBytes);
  return JSON.parse(raw.toString('utf8') || '{}');
}

function handleBancoList(req, res) {
  try {
    sendJson(res, 200, { entries: bankStore.list() });
  } catch (e) {
    sendJson(res, 500, { error: 'No se pudo leer el Banco desde disco.' });
  }
}

function handleBancoGet(req, res, id) {
  if (!isValidBancoId(id)) { sendJson(res, 400, { error: 'Id de landing inválido.' }); return; }
  try {
    const entry = bankStore.get(id);
    if (!entry) { sendJson(res, 404, { error: 'No se encontró esa landing en el Banco.' }); return; }
    sendJson(res, 200, entry);
  } catch (e) {
    sendJson(res, 500, { error: 'No se pudo leer la landing desde disco.' });
  }
}

function validateBancoCreatePayload(payload) {
  if (!payload || typeof payload !== 'object') return 'El cuerpo debe ser un objeto JSON.';
  if (payload.files !== undefined) {
    // Proyecto multi-archivo (Next.js / Vite): se guarda en banco/<id>/project/.
    if (!payload.files || typeof payload.files !== 'object' || Array.isArray(payload.files) || !Object.keys(payload.files).length) return 'Los archivos del proyecto deben ser un objeto { ruta: contenido } no vacío.';
    if (typeof payload.technology !== 'string' || !payload.technology) return 'Falta la tecnología del proyecto multi-archivo.';
  } else if (typeof payload.html !== 'string' || !payload.html.trim()) return 'Falta el HTML de la landing a guardar.';
  if (payload.project && typeof payload.project !== 'object') return 'El proyecto debe ser un objeto.';
  if (payload.verticals && !Array.isArray(payload.verticals)) return 'Las verticales deben ser una lista.';
  if (payload.technologies && !Array.isArray(payload.technologies)) return 'Las tecnologías deben ser una lista.';
  if (payload.versions && !Array.isArray(payload.versions)) return 'Las versiones deben ser una lista.';
  return null;
}

async function handleBancoCreate(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req, BANCO_MAX_BODY_BYTES);
  } catch (e) {
    sendJson(res, e.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: e.code === 'PAYLOAD_TOO_LARGE' ? 'El cuerpo de la solicitud supera el límite permitido (20 MB).' : 'El cuerpo debe ser JSON válido.' });
    return;
  }
  const invalidMsg = validateBancoCreatePayload(payload);
  if (invalidMsg) { sendJson(res, 400, { error: invalidMsg }); return; }
  try {
    const entry = bankStore.create(payload);
    sendJson(res, 201, entry);
  } catch (e) {
    if (e && e.code === 'VALIDATION') { sendJson(res, 400, { error: e.message }); return; }
    sendJson(res, 500, { error: 'No se pudo guardar la landing en disco.' });
  }
}

async function handleBancoUpdate(req, res, id) {
  if (!isValidBancoId(id)) { sendJson(res, 400, { error: 'Id de landing inválido.' }); return; }
  let payload;
  try {
    payload = await readJsonBody(req, BANCO_MAX_BODY_BYTES);
  } catch (e) {
    sendJson(res, e.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: e.code === 'PAYLOAD_TOO_LARGE' ? 'El cuerpo de la solicitud supera el límite permitido (20 MB).' : 'El cuerpo debe ser JSON válido.' });
    return;
  }
  if (payload.html !== undefined && typeof payload.html !== 'string') { sendJson(res, 400, { error: 'El HTML debe ser una cadena de texto.' }); return; }
  if (payload.versions !== undefined && !Array.isArray(payload.versions)) { sendJson(res, 400, { error: 'Las versiones deben ser una lista.' }); return; }
  try {
    const entry = bankStore.update(id, payload);
    if (!entry) { sendJson(res, 404, { error: 'No se encontró esa landing en el Banco.' }); return; }
    sendJson(res, 200, entry);
  } catch (e) {
    if (e && e.code === 'VALIDATION') { sendJson(res, 400, { error: e.message }); return; }
    sendJson(res, 500, { error: 'No se pudo actualizar la landing en disco.' });
  }
}

function handleBancoDuplicate(req, res, id) {
  if (!isValidBancoId(id)) { sendJson(res, 400, { error: 'Id de landing inválido.' }); return; }
  try {
    const entry = bankStore.duplicate(id);
    if (!entry) { sendJson(res, 404, { error: 'No se encontró esa landing en el Banco.' }); return; }
    sendJson(res, 201, entry);
  } catch (e) {
    sendJson(res, 500, { error: 'No se pudo duplicar la landing en disco.' });
  }
}

function handleBancoDelete(req, res, id) {
  if (!isValidBancoId(id)) { sendJson(res, 400, { error: 'Id de landing inválido.' }); return; }
  try {
    const ok = bankStore.remove(id);
    if (!ok) { sendJson(res, 404, { error: 'No se encontró esa landing en el Banco.' }); return; }
    sendJson(res, 200, { ok: true });
  } catch (e) {
    sendJson(res, 500, { error: 'No se pudo eliminar la landing de disco.' });
  }
}

function routeBanco(req, res, urlPath) {
  let m;
  if (req.method === 'GET' && RE_BANCO_COLLECTION.test(urlPath)) { handleBancoList(req, res); return true; }
  if (req.method === 'POST' && RE_BANCO_COLLECTION.test(urlPath)) { handleBancoCreate(req, res); return true; }
  if (req.method === 'POST' && (m = urlPath.match(RE_BANCO_DUPLICATE))) { handleBancoDuplicate(req, res, m[1]); return true; }
  if (req.method === 'GET' && (m = urlPath.match(RE_BANCO_ITEM))) { handleBancoGet(req, res, m[1]); return true; }
  if (req.method === 'PUT' && (m = urlPath.match(RE_BANCO_ITEM))) { handleBancoUpdate(req, res, m[1]); return true; }
  if (req.method === 'DELETE' && (m = urlPath.match(RE_BANCO_ITEM))) { handleBancoDelete(req, res, m[1]); return true; }
  return false;
}

/* =========================================================================
 * Preview de proyectos multi-archivo (ver preview-runner.js)
 *
 *   POST /api/preview-project            {technology, files:{ruta:contenido}, wait?}
 *        -> {previewId, status, url, logsTail, ...}. Sin `wait` responde 202 de
 *           inmediato (status "installing") y el cliente consulta /status;
 *           con `wait:true` bloquea hasta ready/error (útil para curl/tests).
 *   GET  /api/preview-project/:id/status -> mismo objeto (renueva el TTL)
 *   POST /api/preview-project/:id/stop     -> libera el preview (proceso + workspace + id)
 *   POST /api/preview-project/:id/halt     -> detiene SÓLO el dev server; el id y los archivos quedan
 *   POST /api/preview-project/:id/start    -> vuelve a levantar el mismo id con sus archivos actuales;
 *        si el preview ya no existe y el cuerpo trae {technology, files} crea uno nuevo (otro id)
 *   POST /api/preview-project/:id/restart  -> halt + start
 *   GET  /api/preview-project/:id/logs?since=<seq> -> {seq, lines:[{seq,ts,text,stream}], status, message, port, url}
 *   PUT  /api/preview-project/:id/file   {path, content} (HMR del dev server)
 *   Ningún endpoint ejecuta comandos: sólo aceptan el id (y, start, archivos de respaldo).
 * ========================================================================= */

const RE_PROJECT_COLLECTION = /^\/api\/preview-project\/?$/;
const PROJECT_ACTIONS = 'status|stop|halt|start|restart|logs|file';
const RE_PROJECT_ITEM = new RegExp(`^/api/preview-project/([a-f0-9]{12})/(${PROJECT_ACTIONS})/?$`);
const RE_PROJECT_ANY_ITEM = new RegExp(`^/api/preview-project/([^/]+)/(${PROJECT_ACTIONS})/?$`);

async function readProjectBody(req, res) {
  try {
    return await readJsonBody(req, PROJECT_PREVIEW_MAX_BODY_BYTES);
  } catch (e) {
    sendJson(res, e.code === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: e.code === 'PAYLOAD_TOO_LARGE' ? 'El proyecto supera el límite de tamaño (6 MB).' : 'El cuerpo debe ser JSON válido.' });
    return null;
  }
}

async function handleProjectCreate(req, res) {
  const payload = await readProjectBody(req, res);
  if (!payload) return;
  try {
    const view = previewRunner.create({ technology: payload.technology, files: payload.files });
    if (payload.wait === true) {
      const done = await previewRunner.waitFor(view.previewId);
      sendJson(res, done && done.status === 'ready' ? 200 : 422, done || view);
      return;
    }
    sendJson(res, 202, view);
  } catch (e) {
    if (e && e.code === 'VALIDATION') { sendJson(res, 400, { error: e.message }); return; }
    sendJson(res, 500, { error: 'No se pudo iniciar la vista previa del proyecto.' });
  }
}

async function handleProjectItem(req, res, id, action) {
  if (action === 'status' && req.method === 'GET') {
    const view = previewRunner.status(id);
    if (!view) { sendJson(res, 404, { error: 'La vista previa no existe o expiró.' }); return; }
    sendJson(res, 200, view);
    return;
  }
  if (action === 'logs' && req.method === 'GET') {
    const q = new URL(req.url || '/', 'http://localhost').searchParams.get('since');
    if (q !== null && !/^\d{1,12}$/.test(q)) { sendJson(res, 400, { error: 'El parámetro since debe ser un entero.' }); return; }
    const out = previewRunner.logs(id, q === null ? 0 : Number(q));
    if (!out) { sendJson(res, 404, { error: 'La vista previa no existe o expiró.' }); return; }
    sendJson(res, 200, out);
    return;
  }
  if (action === 'stop' && req.method === 'POST') {
    sendJson(res, 200, { ok: true, found: previewRunner.stop(id) });
    return;
  }
  if (action === 'halt' && req.method === 'POST') {
    const view = previewRunner.halt(id);
    if (!view) { sendJson(res, 404, { error: 'La vista previa no existe o expiró.' }); return; }
    sendJson(res, 200, view);
    return;
  }
  if ((action === 'start' || action === 'restart') && req.method === 'POST') {
    const payload = await readProjectBody(req, res);
    if (!payload) return;
    try {
      let view = action === 'start' ? previewRunner.start(id, payload) : previewRunner.restart(id, payload);
      let replaced = false;
      if (!view) {
        // El preview se venció o fue desalojado: se recrea desde los archivos del cliente (id nuevo).
        if (!payload.files || typeof payload.files !== 'object') { sendJson(res, 404, { error: 'La vista previa no existe o expiró.' }); return; }
        view = previewRunner.create({ technology: payload.technology, files: payload.files });
        replaced = true;
      }
      sendJson(res, 202, Object.assign({ replaced }, view));
    } catch (e) {
      if (e && e.code === 'VALIDATION') { sendJson(res, 400, { error: e.message }); return; }
      sendJson(res, 500, { error: 'No se pudo iniciar el servidor de la vista previa.' });
    }
    return;
  }
  if (action === 'file' && req.method === 'PUT') {
    const payload = await readProjectBody(req, res);
    if (!payload) return;
    try {
      const r = await previewRunner.writeFile(id, payload.path, payload.content);
      if (!r.ok) { sendJson(res, 404, { error: 'La vista previa no existe o expiró.' }); return; }
      sendJson(res, 200, { ok: true });
    } catch (e) {
      if (e && e.code === 'VALIDATION') { sendJson(res, 400, { error: e.message }); return; }
      sendJson(res, 500, { error: 'No se pudo escribir el archivo.' });
    }
    return;
  }
  sendJson(res, 405, { error: 'Método no permitido.' });
}

function routePreviewProject(req, res, urlPath) {
  let m;
  if (req.method === 'POST' && RE_PROJECT_COLLECTION.test(urlPath)) { handleProjectCreate(req, res); return true; }
  if ((m = urlPath.match(RE_PROJECT_ITEM))) { handleProjectItem(req, res, m[1], m[2]); return true; }
  if (RE_PROJECT_ANY_ITEM.test(urlPath)) { sendJson(res, 400, { error: 'Id de vista previa inválido.' }); return true; }
  return false;
}

/* =========================================================================
 * Multimedia real (Fase D) — ver media.js
 *
 *   GET  /api/media/status          -> {pexels, pixabay, cloudflare, gemini} (booleanos, nunca valores)
 *   GET  /api/media/library?type=image|video -> archivos de media/ y banco/<id>/assets/ (más nuevos primero, tope 200)
 *   POST /api/media/upload          {name, mime, dataBase64, kind, role?, session?}
 *   POST /api/media/describe        {assetIds?:[], frames?:[{mime,dataBase64}]}  -> Gemini visión
 *   POST /api/media/search          {queries:[{query,orientation?,role?}], type, perQuery}
 *   POST /api/media/generate-image  {prompt, width, height}
 *   POST /api/media/generate-video  {frames:[/media/generated/x.png,…], durationPerFrame?, motion?:[], fps?, width?, height?, webm?} -> mp4+poster (ffmpeg); sin frames: 501 (texto->video no disponible)
 *   GET  /media/<sesion>/<archivo>  (solo imágenes/videos permitidos, con Range)
 * ========================================================================= */

async function handleMediaPost(req, res, fn, limitBytes) {
  let payload;
  try {
    payload = await readJsonBody(req, limitBytes);
  } catch (e) {
    const tooBig = e && e.code === 'PAYLOAD_TOO_LARGE';
    sendJson(res, tooBig ? 413 : 400, { error: tooBig ? 'El cuerpo de la solicitud supera el límite permitido.' : 'El cuerpo debe ser JSON válido.' });
    return;
  }
  try {
    const out = await fn(payload);
    sendJson(res, out.status, out.body);
  } catch (e) {
    console.log(`[media] error inesperado: ${(e && e.message) || e}`);
    sendJson(res, 500, { error: 'Error inesperado en el servicio de multimedia.' });
  }
}

function routeMedia(req, res, urlPath) {
  if (req.method === 'GET' && urlPath === '/api/media/status') { const out = media.status(); sendJson(res, out.status, out.body); return true; }
  if (req.method === 'GET' && urlPath === '/api/media/library') {
    const qs = new URLSearchParams(String(req.url || '').split('?')[1] || '');
    const out = media.library({ type: qs.get('type') || '' });
    sendJson(res, out.status, out.body);
    return true;
  }
  if (req.method !== 'POST') return false;
  if (urlPath === '/api/media/upload') { handleMediaPost(req, res, (p) => media.upload(p), MEDIA_MAX_BODY_BYTES); return true; }
  if (urlPath === '/api/media/describe') { handleMediaPost(req, res, (p) => media.describe(p), 24 * 1024 * 1024); return true; }
  if (urlPath === '/api/media/search') { handleMediaPost(req, res, (p) => media.search(p), MAX_BODY_BYTES); return true; }
  if (urlPath === '/api/media/generate-image') { handleMediaPost(req, res, (p) => media.generateImage(p), MAX_BODY_BYTES); return true; }
  if (urlPath === '/api/media/generate-video') { handleMediaPost(req, res, (p) => media.generateVideo(p), MAX_BODY_BYTES); return true; }
  return false;
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (urlPath.indexOf('/api/media/') === 0 && routeMedia(req, res, urlPath)) {
    return;
  }
  if (urlPath.indexOf('/media/') === 0 && (req.method === 'GET' || req.method === 'HEAD')) {
    media.serveMedia(req, res, urlPath);
    return;
  }

  if (urlPath.indexOf('/api/preview-project') === 0 && routePreviewProject(req, res, urlPath)) {
    return;
  }

  if (urlPath.indexOf('/api/banco') === 0 && routeBanco(req, res, urlPath)) {
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/proxy') {
    handleProxy(req, res);
    return;
  }
  if (req.method === 'POST' && urlPath === '/api/preview') {
    handlePreviewCreate(req, res);
    return;
  }
  {
    const previewMatch = urlPath.match(RE_PREVIEW_ITEM);
    if (previewMatch && (req.method === 'GET' || req.method === 'HEAD')) {
      handlePreviewGet(req, res, previewMatch[1]);
      return;
    }
  }
  if (req.method === 'GET' && urlPath === '/api/opencode/models') {
    handleOpencodeModelsRequest(req, res);
    return;
  }
  if (req.method === 'POST' && urlPath === '/api/opencode/run') {
    handleOpencodeRun(req, res);
    return;
  }
  if (req.method === 'POST' && urlPath === '/api/opencode/complete') {
    handleOpencodeComplete(req, res);
    return;
  }
  if (req.method === 'POST' && urlPath === '/api/opencode/cancel') {
    handleOpencodeCancel(req, res);
    return;
  }
  if (req.method === 'GET' && urlPath === '/api/opencode/queue') {
    handleOpencodeQueue(req, res);
    return;
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
    return;
  }
  sendJson(res, 405, { error: 'Método no permitido.' });
});

server.listen(PORT, HOST, () => {
  console.log(`Landing Page Prompt Architect en http://localhost:${PORT}`);
});

// Los dev servers de preview corren en grupos de procesos propios: hay que
// matarlos explícitamente al salir o quedarían huérfanos.
process.on('exit', () => { previewRunner.killAllSync(); });
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((sig) => {
  process.on(sig, () => { previewRunner.killAllSync(); process.exit(0); });
});

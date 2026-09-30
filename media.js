/*
 * Landing Page Prompt Architect — media.js (Fase D, multimedia real)
 *
 * Módulo SIN dependencias (solo Node core) que usa server.js:
 *   - loadEnvFile(): parser propio de `.env` (no pisa variables ya definidas).
 *   - createMedia(opts): handlers puros {status, body} para
 *       upload / describe / search / generateImage / generateVideo / status
 *     y serveMedia() para GET /media/<sesion>/<archivo>.
 *
 * Las claves (PEXELS_API_KEY, PIXABAY_API_KEY, CLOUDFLARE_ACCOUNT_ID,
 * CLOUDFLARE_API_TOKEN, GEMINI_API_KEY) viven SOLO en el servidor: nunca se
 * devuelven al navegador ni se escriben en los logs.
 *
 * `opts.fetch` y `opts.env` son inyectables para poder testear con fetch
 * simulado (ver DOCUMENTACION.md, sección Multimedia).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

/* =========================================================================
 * .env
 * ========================================================================= */

function parseEnv(text) {
  const out = {};
  String(text || '').split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) return;
    let value = m[2].trim();
    const q = value[0];
    if ((q === '"' || q === "'") && value.lastIndexOf(q) > 0) {
      value = value.slice(1, value.lastIndexOf(q));
    } else {
      const hash = value.search(/\s#/);
      if (hash !== -1) value = value.slice(0, hash).trim();
    }
    out[m[1]] = value;
  });
  return out;
}

// Carga `.env` en `env` (por defecto process.env) sin pisar lo ya definido.
// Devuelve la cantidad de variables aplicadas (nunca sus valores).
function loadEnvFile(file, env) {
  const target = env || process.env;
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { return 0; }
  const parsed = parseEnv(raw);
  let applied = 0;
  Object.keys(parsed).forEach((k) => {
    if (target[k] === undefined && parsed[k] !== '') { target[k] = parsed[k]; applied++; }
  });
  return applied;
}

/* =========================================================================
 * Constantes
 * ========================================================================= */

const IMAGE_MIMES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
const VIDEO_MIMES = { 'video/mp4': 'mp4', 'video/webm': 'webm' };
const EXT_TO_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm',
};
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const UPLOAD_MAX_BODY_BYTES = 85 * 1024 * 1024; // base64 de 60 MB ≈ 80 MB + JSON
const GEMINI_INLINE_VIDEO_MAX = 15 * 1024 * 1024;
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_CACHE_MAX = 300;
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
const CF_MODEL = '@cf/black-forest-labs/flux-1-schnell';
const FFMPEG_FALLBACK_PATHS = ['/home/jhefer/.local/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg'];
const VIDEO_TIMEOUT_MS = 90 * 1000;
const VIDEO_XFADE_S = 0.8;      // duración del fundido entre fotogramas
const VIDEO_TAIL_S = 0.5;       // "cola" estática del fotograma inicial (cierre del bucle)
const VIDEO_MIN_S = 6;
const VIDEO_MAX_S = 10;
const VIDEO_MOTIONS = ['zoom-in', 'zoom-out', 'pan-left', 'pan-right'];

const SESSION_RE = /^[a-z0-9_-]{1,40}$/;
const FILE_RE = /^([A-Za-z0-9_-]{1,64})\.(jpg|jpeg|png|webp|gif|avif|mp4|webm)$/;
const MEDIA_URL_RE = /^\/media\/([a-z0-9_-]{1,40})\/([A-Za-z0-9_-]{1,64}\.(?:jpg|jpeg|png|webp|gif|avif|mp4|webm))$/;

/* =========================================================================
 * Utilidades
 * ========================================================================= */

// Firma binaria -> mime real (defensa: no se confía solo en el mime declarado).
function sniffMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.slice(0, 4).toString('latin1') === 'GIF8') return 'image/gif';
  if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  if (buf.slice(4, 8).toString('latin1') === 'ftyp') {
    const brand = buf.slice(8, 12).toString('latin1');
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    return 'video/mp4';
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'video/webm';
  return null;
}

function extForMime(mime) { return IMAGE_MIMES[mime] || VIDEO_MIMES[mime] || null; }
function randomId() { return crypto.randomBytes(6).toString('hex'); }
function cleanText(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, max || 200); }

const BODY_KEY_MAP = {
  pexels: 'PEXELS_API_KEY', pixabay: 'PIXABAY_API_KEY', cloudflareAccountId: 'CLOUDFLARE_ACCOUNT_ID',
  cloudflareToken: 'CLOUDFLARE_API_TOKEN', gemini: 'GEMINI_API_KEY', pollinations: 'POLLINATIONS_API_KEY',
};
// Una clave válida: cadena sin saltos de línea/control, recortada, <= 512.
function cleanKey(v) {
  if (typeof v !== 'string') return '';
  const t = v.trim();
  if (!t || t.length > 512 || /[\u0000-\u001f\u007f]/.test(t)) return '';
  return t;
}
function makeError(status, message) { return { status, body: { error: message } }; }

/* =========================================================================
 * ffmpeg (video generado a partir de fotogramas IA)
 * ========================================================================= */

function isExecutable(file) {
  try { fs.accessSync(file, fs.constants.X_OK); return fs.statSync(file).isFile(); } catch (e) { return false; }
}

// FFMPEG_PATH (si es válido) -> PATH -> rutas conocidas. Devuelve la ruta o null.
function findFfmpeg(env) {
  const e = env || process.env;
  if (typeof e.FFMPEG_PATH === 'string' && e.FFMPEG_PATH.trim() && isExecutable(e.FFMPEG_PATH.trim())) return e.FFMPEG_PATH.trim();
  const dirs = String(e.PATH || '').split(path.delimiter).filter(Boolean);
  for (const d of dirs) {
    const f = path.join(d, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    if (isExecutable(f)) return f;
  }
  for (const f of FFMPEG_FALLBACK_PATHS) if (isExecutable(f)) return f;
  return null;
}

// Expresiones de zoompan (sin comas: no hace falta escapar) para un movimiento.
// `pos` es el progreso 0..1 del clip ("on/N") o "0" para dejarlo estático en su estado inicial.
function motionExpressions(motion, pos) {
  const cx = 'iw/2-(iw/zoom/2)';
  const cy = 'ih/2-(ih/zoom/2)';
  switch (motion) {
    case 'zoom-out': return { z: `1.18-0.18*${pos}`, x: cx, y: cy };
    case 'pan-left': return { z: '1.14', x: `(iw-iw/zoom)*(1-${pos})`, y: cy };
    case 'pan-right': return { z: '1.14', x: `(iw-iw/zoom)*${pos}`, y: cy };
    default: return { z: `1+0.18*${pos}`, x: cx, y: cy };
  }
}

// Plan de tiempos: n fotogramas + 1 clip final (el primer fotograma, estático) para cerrar el bucle.
// Total = n*visible + xfade + cola, acotado a 6-10 s.
function planVideoTimeline(n, durationPerFrame) {
  const dpf = Number(durationPerFrame) > 0 ? Number(durationPerFrame) : 2.2;
  const overhead = VIDEO_XFADE_S + VIDEO_TAIL_S;
  const total = Math.min(VIDEO_MAX_S, Math.max(VIDEO_MIN_S, n * dpf + overhead));
  const visible = (total - overhead) / n;
  const lengths = [];
  for (let i = 0; i < n; i++) lengths.push(visible + VIDEO_XFADE_S);
  lengths.push(VIDEO_XFADE_S + VIDEO_TAIL_S);
  const offsets = [];
  let acc = 0;
  for (let k = 1; k <= n; k++) { acc += lengths[k - 1]; offsets.push(Number((acc - k * VIDEO_XFADE_S).toFixed(3))); }
  return { total: Number(total.toFixed(3)), visible: Number(visible.toFixed(3)), lengths, offsets };
}

// argv de ffmpeg para el mp4 (sin shell). Devuelve { args, plan }.
function buildFfmpegArgs({ inputs, motions, width, height, fps, outFile, timeline }) {
  const n = inputs.length;
  const plan = timeline || planVideoTimeline(n, 2.2);
  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  inputs.forEach((f) => { args.push('-i', f); });
  args.push('-i', inputs[0]); // clip final = primer fotograma (cierra el bucle)
  const parts = [];
  const bw = width * 3 / 2; // lienzo 1.5x para que zoompan no "tiemble"
  for (let i = 0; i <= n; i++) {
    const frames = Math.max(2, Math.round(plan.lengths[i] * fps));
    const first = i === n;
    const motion = first ? motions[0] : motions[i];
    const denom = Math.max(1, Math.round((plan.lengths[first ? 0 : i]) * fps));
    const e = motionExpressions(motion, first ? '0' : `on/${denom}`);
    parts.push(`[${i}:v]scale=${bw}:${height * 3 / 2}:force_original_aspect_ratio=increase,crop=${bw}:${height * 3 / 2},setsar=1,zoompan=z='${e.z}':x='${e.x}':y='${e.y}':d=${frames}:s=${width}x${height}:fps=${fps},format=yuv420p[v${i}]`);
  }
  let last = 'v0';
  for (let k = 1; k <= n; k++) {
    const out = k === n ? 'vout' : `x${k}`;
    parts.push(`[${last}][v${k}]xfade=transition=fade:duration=${VIDEO_XFADE_S}:offset=${plan.offsets[k - 1]}[${out}]`);
    last = out;
  }
  args.push('-filter_complex', parts.join(';'), '-map', '[vout]', '-an',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', String(fps),
    '-movflags', '+faststart', outFile);
  return { args, plan };
}

function createMedia(opts) {
  const o = opts || {};
  const mediaDir = o.mediaDir || path.join(__dirname, 'media');
  const env = o.env || process.env;
  const doFetch = o.fetch || ((...a) => globalThis.fetch(...a));
  const logFn = o.log || ((line) => console.log(line));
  const mediaDirWithSep = mediaDir.endsWith(path.sep) ? mediaDir : mediaDir + path.sep;
  const bancoDir = o.bancoDir || path.join(path.dirname(mediaDir), 'banco');
  const searchCache = new Map(); // clave -> { at, value }
  let videoBusy = false; // un solo montaje de video a la vez
  const resolveFfmpeg = () => (o.ffmpegPath !== undefined ? (o.ffmpegPath || null) : findFfmpeg(env));

  const SECRET_NAMES = ['PEXELS_API_KEY', 'PIXABAY_API_KEY', 'CLOUDFLARE_API_TOKEN', 'GEMINI_API_KEY', 'CLOUDFLARE_ACCOUNT_ID', 'POLLINATIONS_API_KEY'];
  // Claves recibidas por pedido (body.keys): se recuerdan sólo en memoria y sólo
  // para tacharlas de logs/errores (acotado).
  const seenSecrets = [];
  function rememberSecret(v) {
    if (typeof v !== 'string' || v.length <= 3 || seenSecrets.indexOf(v) !== -1) return;
    seenSecrets.push(v);
    if (seenSecrets.length > 64) seenSecrets.shift();
  }
  // Credenciales de un pedido: body.keys (cadena no vacía) o, si falta, el .env.
  function credsFor(payload) {
    const body = payload && typeof payload === 'object' && payload.keys && typeof payload.keys === 'object' ? payload.keys : {};
    const c = {};
    SECRET_NAMES.forEach((n) => { c[n] = cleanKey(env[n]); });
    Object.keys(BODY_KEY_MAP).forEach((k) => {
      const v = cleanKey(body[k]);
      if (v) { c[BODY_KEY_MAP[k]] = v; rememberSecret(v); }
    });
    return c;
  }
  const configured = (c) => {
    const k = c || credsFor(null);
    return {
      pexels: !!k.PEXELS_API_KEY,
      pixabay: !!k.PIXABAY_API_KEY,
      cloudflare: !!(k.CLOUDFLARE_ACCOUNT_ID && k.CLOUDFLARE_API_TOKEN),
      gemini: !!k.GEMINI_API_KEY,
    };
  };
  // Preferencia opcional `provider` enviada por el cliente (Configuración).
  const pickProvider = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

  // Quita cualquier clave del texto antes de loguearlo o devolverlo.
  function scrub(text) {
    let out = String(text == null ? '' : text);
    SECRET_NAMES.forEach((k) => {
      const v = env[k];
      if (typeof v === 'string' && v.length > 3) out = out.split(v).join('***');
    });
    seenSecrets.forEach((v) => { out = out.split(v).join('***'); });
    return out;
  }

  // Una línea por llamada externa (igual criterio que el log [proxy]): nunca
  // headers, query string ni claves.
  function logCall(service, what, status, startedAt, extra) {
    logFn(`[media] ${new Date().toLocaleTimeString('es')} ${service} ${what} → ${status} en ${((Date.now() - startedAt) / 1000).toFixed(1)}s${extra ? ' ' + scrub(extra) : ''}`);
  }

  async function timedFetch(url, init, timeoutMs) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await doFetch(url, Object.assign({}, init || {}, { signal: controller.signal }));
    } finally {
      clearTimeout(t);
    }
  }

  function describeFetchError(e, service) {
    if (e && e.name === 'AbortError') return `${service} no respondió a tiempo.`;
    return `No se pudo conectar con ${service}.`;
  }

  function ensureSessionDir(session) {
    const dir = path.join(mediaDir, session);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  function saveBuffer(session, buf, mime) {
    const ext = extForMime(mime);
    const id = randomId();
    const dir = ensureSessionDir(session);
    fs.writeFileSync(path.join(dir, `${id}.${ext}`), buf);
    return { id, ext, url: `/media/${session}/${id}.${ext}` };
  }

  function readMediaByUrlPath(urlPath) {
    const m = MEDIA_URL_RE.exec(String(urlPath || '').split('?')[0]);
    if (!m) return null;
    const abs = path.join(mediaDir, m[1], m[2]);
    if (!abs.startsWith(mediaDirWithSep)) return null;
    try {
      const buf = fs.readFileSync(abs);
      const ext = m[2].split('.').pop().toLowerCase();
      return { buf, mime: EXT_TO_MIME[ext], abs };
    } catch (e) { return null; }
  }

  /* ---------------------------------------------------------------- status */

  function status() {
    // pollinations no requiere clave: siempre "disponible" (puede limitar tasa).
    return { status: 200, body: Object.assign(configured(), { pollinations: true, ffmpeg: !!resolveFfmpeg() }) };
  }

  /* ---------------------------------------------------------------- upload */

  function upload(payload) {
    const p = payload || {};
    const kind = p.kind === 'reference' ? 'reference' : (p.kind === 'required' ? 'required' : null);
    if (!kind) return makeError(400, 'El tipo debe ser "reference" o "required".');
    const declared = String(p.mime || '').toLowerCase();
    if (!IMAGE_MIMES[declared] && !VIDEO_MIMES[declared]) {
      return makeError(415, 'Formato no permitido. Usá imagen (JPG, PNG, WebP, GIF, AVIF) o video (MP4, WebM).');
    }
    if (typeof p.dataBase64 !== 'string' || !p.dataBase64) return makeError(400, 'Falta el contenido del archivo.');
    const isVideo = !!VIDEO_MIMES[declared];
    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    // Estimación previa al decode para no alocar buffers enormes.
    if (Math.floor(p.dataBase64.length * 3 / 4) > limit + 4) {
      return makeError(413, `El archivo supera el límite (${isVideo ? '60 MB para videos' : '10 MB para imágenes'}).`);
    }
    const buf = Buffer.from(p.dataBase64, 'base64');
    if (!buf.length) return makeError(400, 'El archivo está vacío o no es base64 válido.');
    if (buf.length > limit) return makeError(413, `El archivo supera el límite (${isVideo ? '60 MB para videos' : '10 MB para imágenes'}).`);
    const real = sniffMime(buf);
    if (!real || (isVideo ? !VIDEO_MIMES[real] : !IMAGE_MIMES[real])) {
      return makeError(415, 'El contenido del archivo no coincide con un formato de imagen o video permitido.');
    }
    const session = SESSION_RE.test(String(p.session || '')) ? p.session : 'general';
    const saved = saveBuffer(session, buf, real);
    logFn(`[media] ${new Date().toLocaleTimeString('es')} upload ${kind} ${real} (${(buf.length / 1024).toFixed(0)} KB) → ${saved.url}`);
    return {
      status: 201,
      body: {
        id: saved.id, url: saved.url, mime: real, type: VIDEO_MIMES[real] ? 'video' : 'image',
        kind, size: buf.length, name: cleanText(p.name, 120), role: cleanText(p.role, 40), caption: cleanText(p.caption, 200),
      },
    };
  }

  /* -------------------------------------------------------------- describe */

  function buildGeminiBody(parts, cfg) {
    return {
      contents: [{ parts }],
      generationConfig: Object.assign({ temperature: 0.4, maxOutputTokens: 900 }, cfg || {}),
    };
  }

  function parseGeminiText(data) {
    const cand = data && data.candidates && data.candidates[0];
    const parts = cand && cand.content && cand.content.parts;
    if (!Array.isArray(parts)) return '';
    return parts.map((x) => (x && typeof x.text === 'string' ? x.text : '')).join('').trim();
  }

  const DESCRIBE_INSTRUCTION = [
    'Sos director de arte. Analizá la(s) imagen(es) o fotogramas de referencia visual para una landing page y respondé en español, conciso (máx. 170 palabras), con estas líneas exactas:',
    'Estilo: (movimiento/estética y época)',
    'Paleta: (5 colores dominantes en hex, ej. #1A1A2E)',
    'Composición: (encuadre, jerarquía, espacios, grilla)',
    'Mood: (emoción y atmósfera)',
    'Texturas y materiales: (grano, brillo, papel, vidrio, etc.)',
    'Tipografía sugerida: (si se aprecia)',
    'Describí solo lo visual; no inventes marcas ni texto que no se vea.',
  ].join('\n');

  // Modo "layout": análisis de un activo GENERADO para maquetar alrededor de él.
  const LAYOUT_INSTRUCTION = [
    'Sos director de arte y maquetador web. Mirá la imagen generada para una landing page y decidí cómo maquetar texto alrededor de ella.',
    'Respondé SOLO un JSON (sin vallas ni explicación), en español, con esta forma exacta:',
    '{"colors":["#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB","#RRGGBB"],"subject":"dónde está el sujeto principal (ej: mitad derecha, centrado)","negativeSpace":"dónde hay espacio libre para texto sin tapar el sujeto (ej: tercio izquierdo oscuro y liso)","textTone":"claro|oscuro (color de texto que contrasta en ese espacio)","light":"dirección y calidad de la luz","texture":"textura o material predominante","mood":"atmósfera en pocas palabras","bestUse":"hero|fondo de sección|acento"}',
    'Los 5 colores son los dominantes en hex. Cada valor máx. 90 caracteres. No inventes lo que no se ve.',
  ].join('\n');

  // Foto remota de Pexels para el análisis de layout: solo https en el host de
  // imágenes de Pexels (sin SSRF), versión reducida y sin guardarla en disco.
  const REMOTE_DESCRIBE_HOSTS = ['images.pexels.com'];
  async function fetchRemoteImage(rawUrl) {
    const startedAt = Date.now();
    try {
      const u = new URL(String(rawUrl));
      if (u.protocol !== 'https:' || REMOTE_DESCRIBE_HOSTS.indexOf(u.hostname) === -1) return null;
      u.search = '?auto=compress&cs=tinysrgb&w=800';
      const res = await timedFetch(u.toString(), {}, 30000);
      if (!res.ok) { logCall(u.hostname, 'describe-fetch', res.status, startedAt); return null; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length || buf.length > MAX_IMAGE_BYTES) return null;
      const mime = sniffMime(buf);
      return mime && IMAGE_MIMES[mime] ? { buf, mime } : null;
    } catch (e) { return null; }
  }

  /* ---- Proveedores de visión alternativos (elegidos en Configuración) ----
   * Sin respaldo automático entre proveedores: si el elegido falla, se devuelve
   * el error para que el navegador use su análisis local y avise. Las claves
   * viajan en el cuerpo del pedido, sólo se usan en memoria y nunca se guardan
   * ni se loguean. */
  const VISION_MAX_IMAGES = 4;
  const VISION_KINDS = ['gemini', 'openai-compatible', 'anthropic'];
  const ANTHROPIC_VISION_URL = 'https://api.anthropic.com/v1/messages';

  function visionAllowedScheme(url) {
    const re = process.env.LPA_TEST_ALLOW_HTTP === '1' ? /^https?:\/\//i : /^https:\/\//i;
    return re.test(String(url || ''));
  }

  // Nombre legible del proveedor para los mensajes (p. ej. "DeepSeek").
  function visionProviderName(v) {
    if (v.kind === 'anthropic') return 'Anthropic';
    let host = '';
    try { host = new URL(v.baseUrl).hostname; } catch (e) { /* baseUrl ya validada antes */ }
    if (/deepseek/i.test(host)) return 'DeepSeek';
    return host || 'El proveedor compatible con OpenAI';
  }

  const VISION_OPENAI_MAX_TOKENS = 8000;

  function chatCompletionsUrl(baseUrl) {
    const b = String(baseUrl).trim().replace(/\/+$/, '');
    return /\/chat\/completions$/.test(b) ? b : `${b}/chat/completions`;
  }

  // Cuerpo + headers del pedido; images = [{ mime, data(base64) }].
  function buildVisionRequest(v, instruction, images, layoutMode) {
    const temperature = layoutMode ? 0.2 : 0.4;
    if (v.kind === 'anthropic') {
      return {
        url: ANTHROPIC_VISION_URL,
        headers: { 'content-type': 'application/json', 'x-api-key': v.apiKey, 'anthropic-version': '2023-06-01' },
        body: {
          model: v.model, max_tokens: 1200, temperature,
          messages: [{ role: 'user', content: images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.mime, data: im.data } })).concat([{ type: 'text', text: instruction }]) }],
        },
      };
    }
    return {
      url: chatCompletionsUrl(v.baseUrl),
      headers: { 'content-type': 'application/json', authorization: `Bearer ${v.apiKey}` },
      body: {
        // Alto a propósito: modelos que razonan (p. ej. deepseek-flash)
        // descuentan el razonamiento de max_tokens; con 1200 la respuesta
        // llegaba vacía o con el JSON cortado y el cliente caía al análisis local.
        model: v.model, max_tokens: VISION_OPENAI_MAX_TOKENS, temperature,
        ...(v.reasoning && !v.reasoningUnsupported ? (v.reasoning === 'none' ? { thinking: { type: 'disabled' } } : { thinking: { type: 'enabled' }, reasoning_effort: v.reasoning }) : {}),
        messages: [{ role: 'user', content: [{ type: 'text', text: instruction }].concat(images.map((im) => ({ type: 'image_url', image_url: { url: `data:${im.mime};base64,${im.data}` } }))) }],
      },
    };
  }

  function parseVisionText(kind, data) {
    if (kind === 'anthropic') {
      const c = data && data.content;
      if (typeof c === 'string') return c.trim();
      return Array.isArray(c) ? c.map((x) => (x && typeof x.text === 'string' ? x.text : '')).join('').trim() : '';
    }
    const msg = data && data.choices && data.choices[0] && data.choices[0].message;
    const c = msg && msg.content;
    if (typeof c === 'string') return c.trim();
    return Array.isArray(c) ? c.map((x) => (typeof x === 'string' ? x : (x && typeof x.text === 'string' ? x.text : ''))).join('').trim() : '';
  }

  // Valida el objeto `vision` del cuerpo. Devuelve { v } o { error }.
  function normalizeVision(raw) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const kind = VISION_KINDS.indexOf(r.kind) !== -1 ? r.kind : 'gemini';
    if (kind === 'gemini') return { v: { kind } };
    const apiKey = typeof r.apiKey === 'string' ? r.apiKey.trim() : '';
    const model = cleanText(r.model, 120) || (kind === 'anthropic' ? 'claude-sonnet-5' : 'deepseek-flash');
    if (!apiKey) return { error: makeError(400, `Falta la clave de API para la visión (${kind === 'anthropic' ? 'Anthropic' : 'proveedor compatible con OpenAI'}): se usa la paleta extraída en el navegador.`) };
    if (kind === 'anthropic') return { v: { kind, apiKey, model } };
    const baseUrl = typeof r.baseUrl === 'string' ? r.baseUrl.trim() : '';
    if (!visionAllowedScheme(baseUrl)) return { error: makeError(400, 'La URL base del proveedor de visión debe ser una URL https:// válida.') };
    try { new URL(baseUrl); } catch (e) { return { error: makeError(400, 'La URL base del proveedor de visión no es válida.') }; }
    const reasoning = ['none', 'low', 'high', 'max'].indexOf(r.reasoning) !== -1 ? r.reasoning : '';
    return { v: { kind, apiKey, model, baseUrl, reasoning } };
  }

  async function describeWithVision(v, instruction, images, layoutMode) {
    const name = visionProviderName(v);
    const req = buildVisionRequest(v, instruction, images.slice(0, VISION_MAX_IMAGES), layoutMode);
    let host = 'api.anthropic.com';
    if (v.kind !== 'anthropic') { try { host = new URL(req.url).hostname; } catch (e) { host = 'proveedor'; } }
    const secret = (t) => String(t == null ? '' : t).split(v.apiKey).join('***');
    const startedAt = Date.now();
    const count = Math.min(images.length, VISION_MAX_IMAGES);
    try {
      const res = await timedFetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) }, 90000);
      const text = await res.text();
      // finish_reason / tokens / razonamiento en el log, para distinguir "respondió
      // bien" de "respondió 200 pero se cortó razonando".
      let finish = '';
      let extra = `(${count} imagen/es)`;
      try {
        const j = JSON.parse(text);
        const ch = j && j.choices && j.choices[0];
        finish = (ch && ch.finish_reason) || (j && j.stop_reason) || '';
        const outTok = j && j.usage && (j.usage.completion_tokens != null ? j.usage.completion_tokens : j.usage.output_tokens);
        const reasoning = ch && ch.message && ch.message.reasoning_content ? String(ch.message.reasoning_content).length : 0;
        if (finish) extra += ` finish_reason=${finish}`;
        if (outTok != null) extra += ` tokens_salida=${outTok}`;
        if (reasoning) extra += ` razonamiento=${reasoning} caracteres`;
      } catch (e) { /* no JSON: se informa abajo */ }
      logCall(host, `vision ${v.model}`, res.status, startedAt, extra);
      // El proveedor no acepta thinking/reasoning_effort: un reintento sin ellos.
      if (res.status === 400 && v.reasoning && !v.reasoningUnsupported && /thinking|reasoning/i.test(text)) {
        return describeWithVision(Object.assign({}, v, { reasoningUnsupported: true }), instruction, images, layoutMode);
      }
      if (!res.ok) {
        let detail = '';
        try {
          const j = JSON.parse(text);
          const e = j && j.error;
          detail = typeof e === 'string' ? e : ((e && e.message) || (j && j.message) || '');
        } catch (e) { /* no JSON */ }
        return makeError(res.status === 429 ? 429 : 502, `${name} respondió ${res.status}${detail ? `: ${secret(scrub(detail)).slice(0, 200)}` : ''}.`);
      }
      let data;
      try { data = JSON.parse(text); } catch (e) { return makeError(502, `${name} devolvió una respuesta ilegible.`); }
      const out = parseVisionText(v.kind, data);
      if (finish === 'length' || finish === 'max_tokens') {
        return makeError(502, `${name} cortó la respuesta por límite de tokens (el modelo ${v.model} probablemente razonó de más): se usa el análisis local.`);
      }
      if (!out) return makeError(502, `${name} no devolvió texto (¿el modelo ${v.model} acepta imágenes?).`);
      return { status: 200, body: { description: out, model: v.model } };
    } catch (e) {
      logCall(host, `vision ${v.model}`, e && e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR', startedAt);
      return makeError(504, describeFetchError(e, name));
    }
  }

  async function describe(payload) {
    const p = payload || {};
    if (pickProvider(p.provider) === 'none') {
      return makeError(503, 'La visión con IA está desactivada en Configuración: se usa la paleta extraída en el navegador.');
    }
    const norm = normalizeVision(p.vision);
    if (norm.error) return norm.error;
    const vision = norm.v;
    const creds = credsFor(p);
    const isGemini = vision.kind === 'gemini';
    if (isGemini && !configured(creds).gemini) {
      return makeError(503, 'Gemini no está configurado (cargá la clave en Configuración o GEMINI_API_KEY en .env): se usa la paleta extraída en el navegador.');
    }
    const layoutMode = p.mode === 'layout';
    const instruction = layoutMode ? LAYOUT_INSTRUCTION : DESCRIBE_INSTRUCTION;
    const images = []; // [{ mime, data(base64) }]
    const ids = Array.isArray(p.assetIds) ? p.assetIds.slice(0, 3) : [];
    for (const id of ids) {
      const found = readMediaByUrlPath(String(id).startsWith('/media/') ? id : `/media/${id}`);
      if (!found) return makeError(404, `No se encontró el recurso "${cleanText(id, 80)}".`);
      if (VIDEO_MIMES[found.mime]) {
        if (!isGemini) return makeError(400, 'Este proveedor de visión solo analiza imágenes: el navegador envía fotogramas del video.');
        if (found.buf.length > GEMINI_INLINE_VIDEO_MAX) {
          return makeError(413, 'El video es muy pesado para enviarlo entero; el navegador envía 4 fotogramas en su lugar.');
        }
      }
      images.push({ mime: found.mime, data: found.buf.toString('base64') });
    }
    const remote = Array.isArray(p.remoteUrls) ? p.remoteUrls.slice(0, Math.max(0, 3 - ids.length)) : [];
    for (const ru of remote) {
      // eslint-disable-next-line no-await-in-loop
      const got = await fetchRemoteImage(ru);
      if (!got) return makeError(404, 'No se pudo obtener la foto remota (solo se admiten fotos de Pexels).');
      images.push({ mime: got.mime, data: got.buf.toString('base64') });
    }
    const frames = Array.isArray(p.frames) ? p.frames.slice(0, 8) : [];
    for (const f of frames) {
      const mime = String((f && f.mime) || 'image/jpeg').toLowerCase();
      if (!IMAGE_MIMES[mime] || typeof f.dataBase64 !== 'string') continue;
      if (f.dataBase64.length > 3 * 1024 * 1024) continue; // fotograma absurdamente grande
      images.push({ mime, data: f.dataBase64 });
    }
    const count = images.length;
    if (!count) return makeError(400, 'Enviá al menos un recurso (assetIds, remoteUrls) o fotogramas (frames).');
    if (!isGemini) {
      // DeepSeek y Anthropic aceptan JPEG/PNG/GIF/WebP (no AVIF): se omiten las AVIF con aviso.
      const usable = images.filter((im) => im.mime !== 'image/avif');
      if (!usable.length) return makeError(415, 'Este proveedor de visión no acepta imágenes AVIF (sólo JPEG, PNG, GIF o WebP): se usa el análisis local.');
      const out = await describeWithVision(vision, instruction, usable, layoutMode);
      if (out.status === 200 && usable.length < images.length) out.body.notice = `Se omitieron ${images.length - usable.length} imagen/es AVIF: ${visionProviderName(vision)} sólo acepta JPEG, PNG, GIF o WebP.`;
      return out;
    }

    const parts = [{ text: instruction }].concat(images.map((im) => ({ inline_data: { mime_type: im.mime, data: im.data } })));
    let lastError = 'Gemini no respondió.';
    let tried404 = [];
    for (const model of GEMINI_MODELS) {
      const startedAt = Date.now();
      try {
        const res = await timedFetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(creds.GEMINI_API_KEY)}`,
          { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(buildGeminiBody(parts, layoutMode ? { temperature: 0.2, maxOutputTokens: 1200 } : null)) },
          90000,
        );
        const text = await res.text();
        logCall('gemini', `${model} generateContent`, res.status, startedAt, `(${count} imagen/es)`);
        if (res.status === 404 || res.status === 503) { tried404.push(model); lastError = res.status === 404 ? `El modelo ${model} no existe (404).` : `El modelo ${model} está saturado (503).`; continue; }
        if (!res.ok) {
          let detail = '';
          try { detail = (JSON.parse(text).error || {}).message || ''; } catch (e) { /* no JSON */ }
          return makeError(res.status === 429 ? 429 : 502, `Gemini respondió ${res.status}${detail ? `: ${scrub(detail).slice(0, 160)}` : ''}.`);
        }
        let data;
        try { data = JSON.parse(text); } catch (e) { return makeError(502, 'Gemini devolvió una respuesta ilegible.'); }
        const out = parseGeminiText(data);
        if (!out) return makeError(502, 'Gemini no devolvió texto (¿imagen bloqueada por sus filtros?).');
        return { status: 200, body: { description: out, model, fallbackFrom: tried404.length ? tried404 : undefined } };
      } catch (e) {
        logCall('gemini', `${model} generateContent`, e && e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR', startedAt);
        return makeError(504, describeFetchError(e, 'Gemini'));
      }
    }
    return makeError(502, `${lastError} Tampoco respondió el modelo de respaldo.`);
  }

  /* ---------------------------------------------------------------- search */

  function cacheGet(key) {
    const hit = searchCache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > SEARCH_CACHE_TTL_MS) { searchCache.delete(key); return null; }
    return hit.value;
  }
  function cacheSet(key, value) {
    if (searchCache.size >= SEARCH_CACHE_MAX) searchCache.delete(searchCache.keys().next().value);
    searchCache.set(key, { at: Date.now(), value });
  }

  function pexelsPhotoItem(ph, query, role) {
    const src = ph.src || {};
    const url = src.large2x || src.large || src.original || src.medium;
    if (!url) return null;
    const who = ph.photographer || 'autor desconocido';
    return {
      url, width: ph.width, height: ph.height, alt: cleanText(ph.alt, 160) || query,
      credit: `Foto de ${who} en Pexels`, creditUrl: ph.photographer_url || ph.url || 'https://www.pexels.com',
      source: 'pexels', type: 'photo', query, role: role || '',
    };
  }

  // Elige el mp4 más adecuado: ≤1920 de ancho, prefiere HD y el mayor ancho.
  function pickPexelsVideoFile(files) {
    const mp4 = (files || []).filter((f) => f && f.link && /mp4/i.test(String(f.file_type || '')) && (f.width || 0) <= 1920);
    if (!mp4.length) return null;
    mp4.sort((a, b) => ((b.quality === 'hd' ? 1 : 0) - (a.quality === 'hd' ? 1 : 0)) || ((b.width || 0) - (a.width || 0)));
    return mp4[0];
  }

  function pexelsVideoItem(v, query, role) {
    const file = pickPexelsVideoFile(v.video_files);
    if (!file) return null;
    const who = (v.user && v.user.name) || 'autor desconocido';
    return {
      url: file.link, width: file.width, height: file.height, poster: v.image || '', alt: query,
      duration: v.duration, credit: `Video de ${who} en Pexels`, creditUrl: (v.user && v.user.url) || v.url || 'https://www.pexels.com',
      source: 'pexels', type: 'video', query, role: role || '',
    };
  }

  async function pexelsSearch(type, q, orientation, perQuery, role, creds) {
    const base = type === 'video' ? 'https://api.pexels.com/videos/search' : 'https://api.pexels.com/v1/search';
    const params = new URLSearchParams({ query: q, per_page: String(perQuery) });
    if (orientation) params.set('orientation', orientation);
    const startedAt = Date.now();
    const res = await timedFetch(`${base}?${params.toString()}`, { headers: { Authorization: creds.PEXELS_API_KEY } }, 15000);
    const text = await res.text();
    if (!res.ok) {
      logCall('pexels', `${type} "${q.slice(0, 40)}"`, res.status, startedAt);
      const e = new Error(res.status === 429 ? 'Pexels: límite de solicitudes por hora alcanzado (200/h).' : `Pexels respondió ${res.status}.`);
      e.status = res.status;
      throw e;
    }
    const data = JSON.parse(text);
    const items = (type === 'video' ? (data.videos || []).map((v) => pexelsVideoItem(v, q, role)) : (data.photos || []).map((ph) => pexelsPhotoItem(ph, q, role))).filter(Boolean);
    logCall('pexels', `${type} "${q.slice(0, 40)}"`, res.status, startedAt, `(${items.length} resultados)`);
    return items;
  }

  // Descarga una URL remota y la guarda en media/ (Pixabay prohíbe el
  // hotlink permanente). Devuelve la ruta local o null si falla.
  async function downloadToMedia(url, session, maxBytes) {
    const startedAt = Date.now();
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:') return null;
      const res = await timedFetch(url, {}, 60000);
      if (!res.ok) { logCall(u.host, 'download', res.status, startedAt); return null; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > maxBytes) return null;
      const mime = sniffMime(buf);
      if (!mime) return null;
      const saved = saveBuffer(session, buf, mime);
      logCall(u.host, 'download', res.status, startedAt, `(${(buf.length / 1024).toFixed(0)} KB) → ${saved.url}`);
      return saved.url;
    } catch (e) {
      logCall('descarga', 'download', e && e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR', startedAt);
      return null;
    }
  }

  async function pixabaySearch(type, q, orientation, perQuery, role, creds) {
    const isVideo = type === 'video';
    const params = new URLSearchParams({ key: creds.PIXABAY_API_KEY, q, per_page: String(Math.max(3, perQuery)), safesearch: 'true' });
    if (!isVideo && orientation && orientation !== 'square') params.set('orientation', orientation === 'landscape' ? 'horizontal' : 'vertical');
    const startedAt = Date.now();
    const res = await timedFetch(`https://pixabay.com/api/${isVideo ? 'videos/' : ''}?${params.toString()}`, {}, 15000);
    const text = await res.text();
    if (!res.ok) {
      logCall('pixabay', `${type} "${q.slice(0, 40)}"`, res.status, startedAt);
      throw new Error(`Pixabay respondió ${res.status}.`);
    }
    const data = JSON.parse(text);
    const hits = (data.hits || []).slice(0, perQuery);
    const items = [];
    for (const h of hits) {
      if (isVideo) {
        const pick = (h.videos && (h.videos.large || h.videos.medium || h.videos.small)) || null;
        if (!pick || !pick.url || (pick.width || 0) > 1920) continue;
        const local = await downloadToMedia(pick.url, 'pixabay', MAX_VIDEO_BYTES);
        if (!local) continue;
        const poster = h.picture_id ? await downloadToMedia(`https://i.vimeocdn.com/video/${h.picture_id}_640x360.jpg`, 'pixabay', MAX_IMAGE_BYTES) : '';
        items.push({
          url: local, width: pick.width, height: pick.height, poster: poster || '', alt: q,
          credit: `Video de ${h.user || 'autor desconocido'} en Pixabay`, creditUrl: h.pageURL || 'https://pixabay.com',
          source: 'pixabay', type: 'video', query: q, role: role || '',
        });
      } else {
        const src = h.largeImageURL || h.webformatURL;
        if (!src) continue;
        const local = await downloadToMedia(src, 'pixabay', MAX_IMAGE_BYTES);
        if (!local) continue;
        items.push({
          url: local, width: h.imageWidth, height: h.imageHeight, alt: cleanText(h.tags, 160) || q,
          credit: `Foto de ${h.user || 'autor desconocido'} en Pixabay`, creditUrl: h.pageURL || 'https://pixabay.com',
          source: 'pixabay', type: 'photo', query: q, role: role || '',
        });
      }
    }
    logCall('pixabay', `${type} "${q.slice(0, 40)}"`, res.status, startedAt, `(${items.length} resultados)`);
    return items;
  }

  async function search(payload) {
    const p = payload || {};
    const type = p.type === 'video' ? 'video' : 'photo';
    const perQuery = Math.min(5, Math.max(1, Number(p.perQuery) || (type === 'video' ? 1 : 2)));
    const queries = (Array.isArray(p.queries) ? p.queries : []).slice(0, 12).map((q) => (typeof q === 'string' ? { query: q } : q))
      .filter((q) => q && typeof q.query === 'string' && q.query.trim());
    if (!queries.length) return makeError(400, 'Enviá al menos una búsqueda (queries).');
    const creds = credsFor(p);
    const cfg = configured(creds);
    const pref = pickProvider(p.provider);
    if (pref === 'none') {
      return { status: 200, body: { items: [], source: 'none', notices: ['La búsqueda de fotos/videos de stock está desactivada en Configuración.'] } };
    }
    if (pref === 'pexels') cfg.pixabay = false;
    else if (pref === 'pixabay') cfg.pexels = false;
    if (!cfg.pexels && !cfg.pixabay) {
      if (pref === 'pexels' || pref === 'pixabay') {
        return { status: 200, body: { items: [], source: 'none', notices: [`${pref === 'pexels' ? 'Pexels' : 'Pixabay'} está elegido en Configuración pero falta la clave (Configuración o ${pref === 'pexels' ? 'PEXELS_API_KEY' : 'PIXABAY_API_KEY'} en .env): se omite la búsqueda.`] } };
      }
      return {
        status: 200,
        body: { items: [], source: 'none', notices: ['No hay servicio de fotos/videos configurado (cargá una clave en Configuración o PEXELS_API_KEY / PIXABAY_API_KEY en .env): se omite la búsqueda.'] },
      };
    }
    const items = [];
    const notices = [];
    const seen = new Set();
    const sources = new Set();
    for (const raw of queries) {
      const q = cleanText(raw.query, 120);
      const orientation = ['landscape', 'portrait', 'square'].indexOf(raw.orientation) !== -1 ? raw.orientation : (type === 'video' ? 'landscape' : '');
      const role = cleanText(raw.role, 40);
      let result = null;
      const providers = [];
      if (cfg.pexels) providers.push('pexels');
      if (cfg.pixabay) providers.push('pixabay');
      for (const prov of providers) {
        const key = `${prov}|${type}|${q.toLowerCase()}|${orientation}|${perQuery}`;
        const cached = cacheGet(key);
        if (cached) { result = cached; break; }
        try {
          const found = prov === 'pexels'
            ? await pexelsSearch(type, q, orientation, perQuery, role, creds)
            : await pixabaySearch(type, q, orientation, perQuery, role, creds);
          if (found.length) { cacheSet(key, found); result = found; break; }
        } catch (e) {
          const msg = e && e.name === 'AbortError' ? `${prov === 'pexels' ? 'Pexels' : 'Pixabay'} no respondió a tiempo.` : scrub((e && e.message) || 'error');
          if (notices.indexOf(msg) === -1) notices.push(msg);
        }
      }
      (result || []).forEach((it) => {
        if (seen.has(it.url)) return;
        seen.add(it.url);
        sources.add(it.source);
        items.push(Object.assign({}, it, { role: it.role || role, query: q }));
      });
      if (!result || !result.length) notices.push(`Sin resultados para "${q}".`);
    }
    return { status: 200, body: { items, source: Array.from(sources).join('+') || 'none', notices } };
  }

  /* --------------------------------------------------------- generate image */

  function parseCloudflareImage(data) {
    const b64 = (data && data.result && data.result.image) || (data && data.image);
    return typeof b64 === 'string' && b64.length > 100 ? b64 : null;
  }

  async function generateWithCloudflare(prompt, session, creds) {
    const startedAt = Date.now();
    const account = encodeURIComponent(creds.CLOUDFLARE_ACCOUNT_ID);
    const res = await timedFetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${CF_MODEL}`,
      { method: 'POST', headers: { Authorization: `Bearer ${creds.CLOUDFLARE_API_TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ prompt, steps: 4 }) },
      60000,
    );
    const text = await res.text();
    logCall('cloudflare', 'flux-1-schnell', res.status, startedAt);
    if (!res.ok) {
      let detail = '';
      try { const j = JSON.parse(text); detail = (j.errors && j.errors[0] && j.errors[0].message) || ''; } catch (e) { /* no JSON */ }
      throw new Error(`Cloudflare respondió ${res.status}${detail ? `: ${scrub(detail).slice(0, 140)}` : ''}.`);
    }
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('Cloudflare devolvió una respuesta ilegible.'); }
    const b64 = parseCloudflareImage(data);
    if (!b64) throw new Error('Cloudflare no devolvió imagen.');
    const buf = Buffer.from(b64, 'base64');
    const mime = sniffMime(buf);
    if (!mime || !IMAGE_MIMES[mime]) throw new Error('Cloudflare devolvió un formato de imagen desconocido.');
    return saveBuffer(session, buf, mime).url;
  }

  // Pollinations: gen.pollinations.ai ya exige API key (401 verificado el
  // 2026-09-28); image.pollinations.ai/prompt sigue respondiendo sin key. Se
  // prueba primero el endpoint sin key y, si hay POLLINATIONS_API_KEY, gen.*.
  async function generateWithPollinations(prompt, width, height, session, creds) {
    const seed = Math.floor(Math.random() * 1e6);
    const attempts = [{
      host: 'image.pollinations.ai',
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=${width}&height=${height}&nologo=true&seed=${seed}`,
      headers: {},
    }];
    if (creds.POLLINATIONS_API_KEY) {
      attempts.push({
        host: 'gen.pollinations.ai',
        url: `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=flux&width=${width}&height=${height}&seed=${seed}`,
        headers: { Authorization: `Bearer ${creds.POLLINATIONS_API_KEY}` },
      });
    }
    let lastErr = 'Pollinations no devolvió una imagen válida.';
    for (const a of attempts) {
      const startedAt = Date.now();
      try {
        let res = await timedFetch(a.url, { headers: a.headers }, 120000);
        // Nivel anónimo con límite de tasa (402/429): un único reintento tras una pausa.
        if (!res.ok && (res.status === 402 || res.status === 429)) {
          logCall('pollinations', a.host, res.status, startedAt, '(límite de tasa: reintento en 8 s)');
          await new Promise((r) => setTimeout(r, o.retryDelayMs === undefined ? 8000 : o.retryDelayMs));
          res = await timedFetch(a.url, { headers: a.headers }, 120000);
        }
        if (!res.ok) { logCall('pollinations', a.host, res.status, startedAt); lastErr = `Pollinations respondió ${res.status}${res.status === 402 || res.status === 429 ? ' (límite de uso del nivel gratuito)' : ''}.`; continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        const mime = sniffMime(buf);
        if (!mime || !IMAGE_MIMES[mime] || buf.length > MAX_IMAGE_BYTES) { lastErr = 'Pollinations no devolvió una imagen válida.'; continue; }
        logCall('pollinations', a.host, res.status, startedAt, `(${(buf.length / 1024).toFixed(0)} KB)`);
        return saveBuffer(session, buf, mime).url;
      } catch (e) {
        logCall('pollinations', a.host, e && e.name === 'AbortError' ? 'TIMEOUT' : 'ERROR', startedAt);
        lastErr = e && e.name === 'AbortError' ? 'Pollinations no respondió a tiempo.' : 'No se pudo conectar con Pollinations.';
      }
    }
    throw new Error(lastErr);
  }

  async function generateImage(payload) {
    const p = payload || {};
    const prompt = cleanText(p.prompt, 900);
    if (!prompt) return makeError(400, 'Falta el prompt de la imagen.');
    const clamp = (n, d) => Math.min(2048, Math.max(256, Math.round((Number(n) || d) / 8) * 8));
    const width = clamp(p.width, 1344);
    const height = clamp(p.height, 768);
    const session = SESSION_RE.test(String(p.session || '')) ? p.session : 'generated';
    const errors = [];
    const creds = credsFor(p);
    const pref = pickProvider(p.provider);
    if (pref === 'none') return makeError(400, 'La generación de imágenes con IA está desactivada en Configuración.');
    if (pref === 'cloudflare' && !configured(creds).cloudflare) {
      return makeError(503, 'Cloudflare está elegido en Configuración pero faltan el Account ID y el API Token (Configuración o CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN en .env).');
    }
    if (pref !== 'pollinations' && configured(creds).cloudflare) {
      try {
        const url = await generateWithCloudflare(prompt, session, creds);
        return { status: 200, body: { url, width, height, prompt, source: 'cloudflare' } };
      } catch (e) {
        errors.push(e && e.name === 'AbortError' ? 'Cloudflare no respondió a tiempo.' : scrub((e && e.message) || 'Cloudflare falló.'));
      }
      if (pref === 'cloudflare') return makeError(502, `No se pudo generar la imagen. ${errors.join(' ')}`.trim());
    }
    try {
      const url = await generateWithPollinations(prompt, width, height, session, creds);
      return { status: 200, body: { url, width, height, prompt, source: 'pollinations', notices: errors } };
    } catch (e) {
      errors.push(e && e.name === 'AbortError' ? 'Pollinations no respondió a tiempo.' : scrub((e && e.message) || 'Pollinations falló.'));
    }
    return makeError(502, `No se pudo generar la imagen. ${errors.join(' ')}`.trim());
  }

  // Video GENERADO: monta un mp4 (Ken Burns + fundidos) con ffmpeg a partir de
  // fotogramas IA ya generados. No es texto->video: sin `frames` (solo `prompt`)
  // sigue respondiendo 501 como el antiguo adaptador Veo.
  function runFfmpeg(bin, args) {
    return new Promise((resolve) => {
      let stderr = '';
      let done = false;
      let child;
      const finish = (r) => { if (!done) { done = true; clearTimeout(timer); resolve(r); } };
      const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch (e) { /* ya terminó */ } finish({ ok: false, timeout: true, stderr }); }, o.videoTimeoutMs || VIDEO_TIMEOUT_MS);
      try {
        child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'], shell: false });
      } catch (e) { finish({ ok: false, stderr: String((e && e.message) || e) }); return; }
      child.stderr.on('data', (d) => { stderr = (stderr + d.toString()).slice(-2000); });
      child.on('error', (e) => finish({ ok: false, stderr: String((e && e.message) || e) }));
      child.on('close', (code) => finish({ ok: code === 0, stderr }));
    });
  }

  async function generateVideo(payload) {
    const p = payload || {};
    if (!Array.isArray(p.frames)) {
      return makeError(501, 'El texto a video no está disponible (Veo requiere presupuesto). Enviá `frames` (fotogramas generados) para montar un video con ffmpeg.');
    }
    const bin = resolveFfmpeg();
    if (!bin) return makeError(503, 'ffmpeg no está instalado en el servidor: no se puede montar el video.');
    if (p.frames.length < 2 || p.frames.length > 6) return makeError(400, 'Se necesitan entre 2 y 6 fotogramas para montar el video.');
    const inputs = [];
    for (const f of p.frames) {
      let ref = String(f || '').trim();
      const m = /\/media\/[^?#\s]+/.exec(ref);
      if (m) ref = m[0]; else if (/^generated\/[A-Za-z0-9_-]{1,64}\.(?:jpg|jpeg|png|webp)$/.test(ref)) ref = `/media/${ref}`;
      const mm = MEDIA_URL_RE.exec(ref);
      if (!mm || mm[1] !== 'generated') return makeError(400, 'Los fotogramas deben ser imágenes generadas en este servidor (/media/generated/…).');
      const found = readMediaByUrlPath(ref);
      if (!found || !IMAGE_MIMES[found.mime] || found.mime === 'image/gif' || found.mime === 'image/avif') return makeError(404, `No se encontró el fotograma "${cleanText(ref, 80)}" o su formato no sirve para el montaje.`);
      inputs.push(found.abs);
    }
    const even4 = (n, d, lo, hi) => Math.min(hi, Math.max(lo, Math.round((Number(n) || d) / 4) * 4));
    const width = even4(p.width, 1280, 320, 1920);
    const height = even4(p.height, 720, 240, 1080);
    const fps = Math.min(30, Math.max(12, Math.round(Number(p.fps) || 24)));
    const motions = inputs.map((_, i) => (VIDEO_MOTIONS.indexOf(p.motion && p.motion[i]) !== -1 ? p.motion[i] : VIDEO_MOTIONS[i % VIDEO_MOTIONS.length]));
    if (videoBusy) return makeError(429, 'Ya hay un video montándose; esperá a que termine.');
    videoBusy = true;
    const startedAt = Date.now();
    const session = 'generated';
    const dir = ensureSessionDir(session);
    const id = randomId();
    const mp4 = path.join(dir, `${id}.mp4`);
    const poster = path.join(dir, `${id}.jpg`);
    const cleanup = () => { [mp4, poster, path.join(dir, `${id}.webm`)].forEach((f) => { try { fs.unlinkSync(f); } catch (e) { /* no existe */ } }); };
    try {
      const timeline = planVideoTimeline(inputs.length, p.durationPerFrame);
      const { args } = buildFfmpegArgs({ inputs, motions, width, height, fps, outFile: mp4, timeline });
      const r = await runFfmpeg(bin, args);
      if (!r.ok) {
        cleanup();
        logCall('ffmpeg', 'generate-video', r.timeout ? 'TIMEOUT' : 'ERROR', startedAt, r.timeout ? '' : `(${cleanText(r.stderr.split('\n').filter(Boolean).pop() || '', 160)})`);
        return makeError(r.timeout ? 504 : 500, r.timeout ? 'El montaje del video tardó más de 90 segundos y se canceló.' : 'ffmpeg no pudo montar el video (revisá que los fotogramas sean imágenes válidas).');
      }
      const pr = await runFfmpeg(bin, ['-hide_banner', '-loglevel', 'error', '-y', '-i', inputs[0], '-vf', `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`, '-frames:v', '1', '-q:v', '3', poster]);
      if (!pr.ok) { cleanup(); logCall('ffmpeg', 'poster', 'ERROR', startedAt); return makeError(500, 'ffmpeg montó el video pero no pudo crear el póster.'); }
      let webmUrl;
      if (p.webm === true && Date.now() - startedAt < (o.videoTimeoutMs || VIDEO_TIMEOUT_MS) * 0.4) {
        const webm = path.join(dir, `${id}.webm`);
        const wr = await runFfmpeg(bin, ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-deadline', 'realtime', '-cpu-used', '8', webm]);
        if (wr.ok) webmUrl = `/media/${session}/${id}.webm`; else { try { fs.unlinkSync(webm); } catch (e) { /* nada */ } }
      }
      const size = fs.statSync(mp4).size;
      logCall('ffmpeg', 'generate-video', 200, startedAt, `(${inputs.length} fotogramas, ${timeline.total.toFixed(1)} s, ${(size / 1024).toFixed(0)} KB)`);
      return {
        status: 200,
        body: {
          url: `/media/${session}/${id}.mp4`, poster: `/media/${session}/${id}.jpg`, webm: webmUrl,
          duration: timeline.total, width, height, fps, frames: inputs.length, motion: motions, source: 'ffmpeg',
        },
      };
    } catch (e) {
      cleanup();
      logCall('ffmpeg', 'generate-video', 'ERROR', startedAt);
      return makeError(500, 'No se pudo montar el video.');
    } finally {
      videoBusy = false;
    }
  }

  /* ------------------------------------------------------------- biblioteca */

  // Lista los archivos ya existentes (media/<sesión>/ y banco/<id>/assets/) para
  // elegirlos como recursos pre-generados. Solo lectura, sin claves ni API.
  // Nombres validados con las mismas listas blancas que serveMedia (sin traversal).
  const LIBRARY_CAP = 200;
  const BANCO_ID_RE_LIB = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]{1,80}$/;
  function library(query) {
    const q = query || {};
    const type = q.type === 'video' ? 'video' : (q.type === 'image' || q.type === 'imagen' ? 'image' : null);
    if (!type) return makeError(400, 'type debe ser "image" o "video".');
    const okExts = type === 'video' ? ['mp4', 'webm'] : ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
    const safeList = (dir) => { try { return fs.readdirSync(dir); } catch (e) { return []; } };
    const stat = (f) => { try { const st = fs.statSync(f); return st.isFile() ? st : null; } catch (e) { return null; } };
    const items = [];
    const seen = new Set();
    const posterFor = (dir, file, urlDir) => {
      const base = file.replace(/\.[a-z0-9]+$/i, '');
      const hit = ['jpg', 'png', 'webp'].map((x) => `${base}.${x}`).find((f) => f !== file && stat(path.join(dir, f)));
      return hit ? `${urlDir}${hit}` : '';
    };
    const scan = (dir, urlDir, origin, label) => {
      safeList(dir).forEach((file) => {
        const m = FILE_RE.exec(file);
        if (!m || okExts.indexOf(m[2].toLowerCase()) === -1 || seen.has(file)) return;
        const st = stat(path.join(dir, file));
        if (!st) return;
        seen.add(file);
        const it = { url: `${urlDir}${file}`, name: file, type, origin, label, mtime: Math.round(st.mtimeMs), size: st.size };
        if (type === 'video') { const poster = posterFor(dir, file, urlDir); if (poster) it.poster = poster; }
        items.push(it);
      });
    };
    safeList(mediaDir).filter((s) => SESSION_RE.test(s)).forEach((s) => {
      scan(path.join(mediaDir, s), `/media/${s}/`, s === 'generated' ? 'generada' : 'subida', s === 'generated' ? 'Generadas' : 'Subidas');
    });
    // banco/<id>/assets/: solo lo que ya no está en media/ (el Banco copia desde ahí)
    safeList(bancoDir).filter((id) => BANCO_ID_RE_LIB.test(id)).forEach((id) => {
      scan(path.join(bancoDir, id, 'assets'), `/banco/${id}/assets/`, 'banco', 'Del Banco');
    });
    items.sort((a, b) => b.mtime - a.mtime);
    return { status: 200, body: { items: items.slice(0, LIBRARY_CAP), total: items.length } };
  }

  /* ---------------------------------------------------------------- estático */

  function serveMedia(req, res, urlPath) {
    const m = MEDIA_URL_RE.exec(urlPath);
    const notFound = () => {
      const body = JSON.stringify({ error: 'No encontrado.' });
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
      res.end(body);
    };
    if (!m) { notFound(); return; }
    const abs = path.join(mediaDir, m[1], m[2]);
    if (!abs.startsWith(mediaDirWithSep)) { notFound(); return; }
    fs.stat(abs, (err, st) => {
      if (err || !st.isFile()) { notFound(); return; }
      const ext = m[2].split('.').pop().toLowerCase();
      const headers = {
        'Content-Type': EXT_TO_MIME[ext] || 'application/octet-stream',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        // <img>/<video> de los dev servers (Vite/Next en otros puertos de
        // 127.0.0.1/localhost) no necesitan CORS; la lectura por JS (fetch,
        // canvas) solo se permite a orígenes LOCALES — antes era '*', y
        // cualquier sitio podía leer lo que el usuario sube.
        'Cross-Origin-Resource-Policy': 'same-site',
        Vary: 'Origin',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      };
      const origin = String(req.headers.origin || '');
      if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d{1,5})?$/.test(origin)) headers['Access-Control-Allow-Origin'] = origin;
      const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
      if (range && (range[1] || range[2])) {
        let start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
        let end = range[1] && range[2] ? Number(range[2]) : st.size - 1;
        if (start < 0) start = 0;
        if (end >= st.size) end = st.size - 1;
        if (start > end || start >= st.size) {
          res.writeHead(416, Object.assign({ 'Content-Range': `bytes */${st.size}` }, headers));
          res.end();
          return;
        }
        res.writeHead(206, Object.assign({ 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 }, headers));
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(abs, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, Object.assign({ 'Content-Length': st.size }, headers));
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(abs).pipe(res);
    });
  }

  return { status, upload, describe, search, generateImage, generateVideo, library, serveMedia, mediaDir, configured };
}

module.exports = {
  createMedia, loadEnvFile, parseEnv, sniffMime, findFfmpeg, planVideoTimeline, buildFfmpegArgs, motionExpressions,
  UPLOAD_MAX_BODY_BYTES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, MEDIA_URL_RE,
};

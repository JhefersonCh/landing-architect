/*
 * Landing Page Prompt Architect — bank-store.js
 *
 * Persistencia en DISCO del Banco (landing pages guardadas), dentro de
 * banco/<id>/. Sin dependencias externas (sólo Node core). Lo consume
 * server.js para implementar el REST /api/banco/*.
 *
 * Decisión (ver DOCUMENTACION.md §7): NO se guarda un `original.html`
 * separado. Cuando el documento se puede partir en index.html + styles.css
 * + script.js, el HTML canónico de un solo archivo (el que necesita el
 * editor del Estudio) se RE-ENSAMBLA en memoria a partir de esos tres
 * archivos (ver `reassembleCanonicalHtml`). Evita duplicar contenido en
 * disco y el riesgo de que las dos copias diverjan.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateProject, normalizeProjectPath } = require('./preview-runner.js');

const MAX_VERSIONS = 20;

const STYLE_LINK_TAG = '<link rel="stylesheet" href="./styles.css">';
const SCRIPT_SRC_TAG = '<script src="./script.js"></script>';

// Mimes de <script> que son JS ejecutable "de siempre" y por lo tanto
// seguros de mover a script.js. Cualquier otro type (module, importmap,
// application/json, text/babel, text/x-template, etc.) se deja inline: no
// sabemos qué runtime lo procesa ni si depende de su posición exacta en el
// documento (React+Babel en el navegador, plantillas client-side, mapas de
// import...).
const JS_EXTRACTABLE_TYPES = new Set([
  '', 'text/javascript', 'application/javascript', 'application/ecmascript',
  'text/ecmascript', 'application/x-javascript',
]);

/* =========================================================================
 * Utilidades de texto
 * ========================================================================= */

function slugify(text) {
  const base = String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return base || 'landing';
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function makeId(tema) {
  return `${todayStamp()}-${slugify(tema)}-${crypto.randomBytes(2).toString('hex')}`;
}

// Regex estricta: sólo dígitos/letras minúsculas/guiones, sin '.', '/', '\',
// espacios ni mayúsculas. Bloquea cualquier intento de path traversal
// (../, %2e%2e, etc. ya vienen decodificados antes de llegar acá) porque
// esos caracteres simplemente no matchean.
const ID_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]{1,80}$/;

function isValidId(id) {
  return typeof id === 'string' && ID_RE.test(id) && !id.includes('..');
}

/* =========================================================================
 * Split de HTML de un solo archivo en index.html + styles.css + script.js
 * ========================================================================= */

function findTags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}\\s*>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    out.push({ index: m.index, end: m.index + m[0].length, raw: m[0], attrs: m[1] || '', inner: m[2] });
  }
  return out;
}

function hasSrcAttr(attrs) {
  return /\bsrc\s*=/i.test(attrs);
}

function scriptType(attrs) {
  const m = /\btype\s*=\s*(["'])(.*?)\1|\btype\s*=\s*([^\s>]+)/i.exec(attrs);
  const raw = m ? (m[2] !== undefined ? m[2] : m[3]) : '';
  return String(raw || '').trim().toLowerCase();
}

// Aplica una lista de reemplazos {index, end, text} sobre `html`, de atrás
// para adelante para que los índices de los reemplazos previos sigan
// siendo válidos.
function applyReplacements(html, replacements) {
  const sorted = replacements.slice().sort((a, b) => b.index - a.index);
  let out = html;
  sorted.forEach((r) => {
    out = out.slice(0, r.index) + r.text + out.slice(r.end);
  });
  return out;
}

function splitStyles(html) {
  const styles = findTags(html, 'style');
  if (styles.length === 0) return { html, css: '', split: false };

  // Riesgo de interleaving: si hay un <link rel="stylesheet"> externo entre
  // el primer y el último <style>, mover todo el CSS a un solo archivo en
  // la posición del primero cambiaría el orden de la cascada. En ese caso,
  // no se parte (conservador, igual que con los <script>).
  const first = styles[0];
  const last = styles[styles.length - 1];
  const between = html.slice(first.end, last.index);
  if (/<link\b[^>]*rel\s*=\s*["']?stylesheet/i.test(between)) {
    return { html, css: '', split: false };
  }

  const css = styles.map((s) => s.inner.trim()).filter(Boolean).join('\n\n');
  const replacements = styles.map((s, i) => ({
    index: s.index,
    end: s.end,
    text: i === 0 ? STYLE_LINK_TAG : '',
  }));
  return { html: applyReplacements(html, replacements), css, split: true };
}

function splitScripts(html) {
  const scripts = findTags(html, 'script');
  if (scripts.length === 0) return { html, js: '', split: false };

  const classified = scripts.map((s) => {
    if (hasSrcAttr(s.attrs)) return Object.assign({ kind: 'cdn' }, s);
    const type = scriptType(s.attrs);
    const kind = JS_EXTRACTABLE_TYPES.has(type) ? 'inline-js' : 'inline-other';
    return Object.assign({ kind }, s);
  });

  const extractable = classified.filter((s) => s.kind === 'inline-js');
  if (extractable.length === 0) return { html, js: '', split: false };

  // Riesgo de interleaving: si entre el primero y el último script
  // extraíble hay un <script> de otro tipo (CDN o no-extraíble), juntarlos
  // todos en la posición del primero cambiaría el orden de ejecución
  // relativo a ese script intermedio. Conservador: no se parte nada.
  const firstIdx = classified.indexOf(extractable[0]);
  const lastIdx = classified.indexOf(extractable[extractable.length - 1]);
  const hasHazard = classified.slice(firstIdx, lastIdx + 1).some((s) => s.kind !== 'inline-js');
  if (hasHazard) return { html, js: '', split: false };

  const js = extractable.map((s) => s.inner).join('\n\n');
  const replacements = extractable.map((s, i) => ({
    index: s.index,
    end: s.end,
    text: i === 0 ? SCRIPT_SRC_TAG : '',
  }));
  return { html: applyReplacements(html, replacements), js, split: true };
}

// Devuelve { indexHtml, css, js, split: {css, js} }. Si nada se puede
// partir, indexHtml === html original y css/js son ''.
function splitHtmlDocument(html) {
  const source = String(html || '');
  const afterStyles = splitStyles(source);
  const afterScripts = splitScripts(afterStyles.html);
  return {
    indexHtml: afterScripts.html,
    css: afterStyles.css,
    js: afterScripts.js,
    split: { css: afterStyles.split, js: afterScripts.split },
  };
}

// Inversa de splitHtmlDocument: reconstruye el documento de un solo archivo
// a partir de index.html + styles.css + script.js, para el editor del
// Estudio (que trabaja con una sola cadena HTML).
function reassembleCanonicalHtml(indexHtml, css, js, split) {
  let html = String(indexHtml || '');
  if (split && split.css) {
    html = html.replace(STYLE_LINK_TAG, () => `<style>\n${css || ''}\n</style>`);
  }
  if (split && split.js) {
    html = html.replace(SCRIPT_SRC_TAG, () => `<script>\n${js || ''}\n</script>`);
  }
  return html;
}

/* =========================================================================
 * Disco: escritura atómica y layout
 * ========================================================================= */

function writeFileAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`);
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Tarjeta estática que ocupa el lugar de index.html en entradas multi-archivo
// (Next.js / Vite): la miniatura del Banco y "Abrir en pestaña nueva" la
// muestran SIN levantar ningún dev server. El proyecto real está en project/.
function buildProjectPlaceholderHtml(tema, technology, fileCount) {
  const label = { nextjs: 'Next.js', react: 'React (Vite)', vue: 'Vue (Vite)' }[technology] || technology;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(tema)}</title>
<style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#14161b;color:#f2efe8;font-family:system-ui,sans-serif;text-align:center;padding:1rem}
.c{max-width:22rem}.b{display:inline-block;border:1px solid #8a8f9a;border-radius:999px;padding:.2rem .8rem;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}
h1{font-size:1.2rem;margin:.9rem 0 .4rem}p{margin:0;color:#b9bcc4;font-size:.85rem;line-height:1.4}</style></head>
<body><div class="c"><span class="b">${escapeHtml(label)}</span><h1>${escapeHtml(tema)}</h1>
<p>Proyecto multi-archivo (${fileCount} archivos). Usá “Abrir” o “Editar” en el Banco para levantar la vista previa.</p></div></body></html>
`;
}

/* =========================================================================
 * Multimedia (Fase D): copia de media/... a banco/<id>/assets/
 * ========================================================================= */

const MEDIA_EXT_RE = '(?:jpg|jpeg|png|webp|gif|avif|mp4|webm)';
// http://127.0.0.1:3000/media/<sesion>/<archivo> | /media/<sesion>/<archivo>
const MEDIA_REF_RE = new RegExp(`(?:https?:\\/\\/(?:127\\.0\\.0\\.1|localhost)(?::\\d+)?)?\\/media\\/([a-z0-9_-]{1,40})\\/([A-Za-z0-9_-]{1,64}\\.${MEDIA_EXT_RE})`, 'g');
// /banco/<id>/assets/<archivo> (forma que ve el Estudio al abrir una landing guardada)
const BANCO_ASSET_REF_RE = new RegExp(`(?:https?:\\/\\/(?:127\\.0\\.0\\.1|localhost)(?::\\d+)?)?\\/banco\\/[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]{1,80}\\/assets\\/([A-Za-z0-9_-]{1,64}\\.${MEDIA_EXT_RE})`, 'g');

function makeBankStore(bancoDir, storeOpts) {
  fs.mkdirSync(bancoDir, { recursive: true });
  const mediaDir = (storeOpts && storeOpts.mediaDir) || path.join(path.dirname(bancoDir), 'media');

  function assetsDirFor(id) {
    return path.join(bancoDir, id, 'assets');
  }

  // Copia a banco/<id>/assets/ cada archivo de media/ referenciado en `text` y
  // reescribe la URL a `<prefix><archivo>` (relativa: la landing guardada es
  // autocontenida). URLs a archivos que no existen quedan intactas. Devuelve
  // { text, copied: [archivo] }.
  function localizeMedia(id, text, prefix, copiedSet) {
    const src = String(text || '');
    if (!src) return { text: src, copied: [] };
    const adir = assetsDirFor(id);
    const copied = copiedSet || new Set();
    let out = src.replace(MEDIA_REF_RE, (whole, session, file) => {
      const from = path.join(mediaDir, session, file);
      if (!from.startsWith(mediaDir + path.sep) || !fs.existsSync(from)) return whole;
      fs.mkdirSync(adir, { recursive: true });
      fs.copyFileSync(from, path.join(adir, file));
      copied.add(file);
      return `${prefix}${file}`;
    });
    out = out.replace(BANCO_ASSET_REF_RE, (whole, file) => {
      if (!fs.existsSync(path.join(adir, file))) return whole;
      copied.add(file);
      return `${prefix}${file}`;
    });
    return { text: out, copied: Array.from(copied) };
  }

  // Inversa para el Estudio: assets/<f> o ../assets/<f> -> /banco/<id>/assets/<f>
  // (solo si el archivo existe), así el srcdoc del iframe puede cargarlos.
  function absolutizeAssets(id, html) {
    const adir = assetsDirFor(id);
    if (!fs.existsSync(adir)) return html;
    const re = new RegExp(`(?<![A-Za-z0-9_/.-])(?:\\.\\.\\/)?assets\\/([A-Za-z0-9_-]{1,64}\\.${MEDIA_EXT_RE})`, 'g');
    return String(html).replace(re, (whole, file) => (fs.existsSync(path.join(adir, file)) ? `/banco/${id}/assets/${file}` : whole));
  }

  function listAssetFiles(id) {
    try { return fs.readdirSync(assetsDirFor(id)).filter((f) => !f.startsWith('.')); } catch (e) { return []; }
  }

  // Multi-archivo (Vite/Next): las URLs quedan absolutas a media/ (un dev
  // server en otro puerto no puede resolver rutas relativas a esta app); los
  // archivos se copian igual a assets/ como respaldo y para el meta.
  function backupProjectMedia(id, filesMap) {
    const copied = new Set();
    filesMap.forEach((content) => {
      const txt = String(content);
      let m;
      MEDIA_REF_RE.lastIndex = 0;
      while ((m = MEDIA_REF_RE.exec(txt))) {
        const from = path.join(mediaDir, m[1], m[2]);
        if (from.startsWith(mediaDir + path.sep) && fs.existsSync(from)) {
          fs.mkdirSync(assetsDirFor(id), { recursive: true });
          fs.copyFileSync(from, path.join(assetsDirFor(id), m[2]));
          copied.add(m[2]);
        }
      }
    });
    return Array.from(copied);
  }

  function projectDirFor(id) {
    return path.join(bancoDir, id, 'project');
  }

  // Reescribe banco/<id>/project/ con los archivos (ya validados).
  function writeProjectFiles(id, filesMap) {
    const dir = projectDirFor(id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    filesMap.forEach((content, rel) => {
      const safe = normalizeProjectPath(rel); // defensa en profundidad: nada de '..' ni absolutas
      const abs = path.join(dir, safe);
      if (!abs.startsWith(dir + path.sep)) throw new Error('Ruta fuera del proyecto.');
      writeFileAtomic(abs, content);
    });
  }

  function readProjectFiles(id) {
    const dir = projectDirFor(id);
    const out = {};
    const walk = (current, prefix) => {
      fs.readdirSync(current, { withFileTypes: true }).forEach((d) => {
        if (d.name.startsWith('.')) return; // temporales de escritura atómica
        const rel = prefix ? `${prefix}/${d.name}` : d.name;
        if (d.isDirectory()) walk(path.join(current, d.name), rel);
        else if (d.isFile()) out[rel] = fs.readFileSync(path.join(current, d.name), 'utf8');
      });
    };
    try { walk(dir, ''); } catch (e) { /* sin project/ */ }
    return out;
  }

  function dirFor(id) {
    return path.join(bancoDir, id);
  }

  function metaPathFor(id) {
    return path.join(dirFor(id), 'meta.json');
  }

  function readMeta(id) {
    const raw = fs.readFileSync(metaPathFor(id), 'utf8');
    return JSON.parse(raw);
  }

  function writeVersions(id, versions) {
    const dir = path.join(dirFor(id), 'versiones');
    // Se reescribe entero cada vez (cap 20): más simple y robusto que ir
    // acumulando archivos sueltos que después hay que podar.
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const capped = (Array.isArray(versions) ? versions : []).slice(0, MAX_VERSIONS);
    const meta = capped.map((v, i) => {
      const file = `versiones/v${i + 1}.html`;
      writeFileAtomic(path.join(dirFor(id), file), String(v.html || ''));
      return {
        id: v.id || `v${i + 1}`,
        source: v.source || 'generado',
        instruction: v.instruction || undefined,
        date: v.date || new Date().toISOString(),
        file,
      };
    });
    return meta;
  }

  function writeEntryFiles(id, { indexHtml, css, js, split }) {
    const dir = dirFor(id);
    writeFileAtomic(path.join(dir, 'index.html'), indexHtml);
    // Si antes existían y ahora ya no aplica el split, se limpian para no
    // dejar archivos huérfanos desincronizados con meta.json.
    const cssPath = path.join(dir, 'styles.css');
    const jsPath = path.join(dir, 'script.js');
    if (split.css) writeFileAtomic(cssPath, css); else fs.rmSync(cssPath, { force: true });
    if (split.js) writeFileAtomic(jsPath, js); else fs.rmSync(jsPath, { force: true });
  }

  function list() {
    let names;
    try { names = fs.readdirSync(bancoDir, { withFileTypes: true }); }
    catch (e) { return []; }
    const entries = [];
    names.forEach((d) => {
      if (!d.isDirectory()) return;
      try {
        const meta = readMeta(d.name);
        entries.push({
          id: meta.id,
          tema: meta.tema,
          proyecto: meta.proyecto,
          verticals: meta.verticals || [],
          customVertical: meta.customVertical || '',
          technologies: meta.technologies || [],
          techniques: meta.techniques || [],
          ssotSeed: meta.ssotSeed || '',
          concept: meta.concept || null,
          model: meta.model,
          provider: meta.provider,
          createdAt: meta.createdAt,
          updatedAt: meta.updatedAt,
          split: meta.split,
          multiFile: !!meta.multiFile,
          technology: meta.technology || '',
          versionsCount: (meta.versions || []).length,
          folder: `banco/${meta.id}`,
        });
      } catch (e) { /* meta.json corrupto o ausente: se ignora esa carpeta */ }
    });
    entries.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return entries;
  }

  // Relee el html de cada versión desde versiones/v<N>.html. El editor del
  // Estudio necesita el contenido real (no sólo la referencia al archivo)
  // para poder "Restaurar" una versión anterior; meta.json en cambio sólo
  // guarda la referencia (`file`) para no duplicar contenido grande ahí.
  function readVersionsWithHtml(id, versionsMeta) {
    return (versionsMeta || []).map((v) => {
      let html = '';
      try { html = fs.readFileSync(path.join(dirFor(id), v.file), 'utf8'); } catch (e) { /* archivo ausente */ }
      return { id: v.id, source: v.source, instruction: v.instruction, date: v.date, file: v.file, html };
    });
  }

  function get(id) {
    if (!isValidId(id)) return null;
    const dir = dirFor(id);
    if (!fs.existsSync(metaPathFor(id))) return null;
    const meta = readMeta(id);
    const indexHtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const css = meta.split && meta.split.css ? fs.readFileSync(path.join(dir, 'styles.css'), 'utf8') : '';
    const js = meta.split && meta.split.js ? fs.readFileSync(path.join(dir, 'script.js'), 'utf8') : '';
    let prompt = '';
    try { prompt = fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8'); } catch (e) { /* sin prompt */ }
    if (meta.multiFile) {
      // Proyecto multi-archivo: `files` es la fuente de verdad; `html` queda
      // vacío (index.html es sólo la tarjeta de miniatura).
      return { meta, prompt, html: '', files: readProjectFiles(id), versions: [] };
    }
    const html = absolutizeAssets(id, reassembleCanonicalHtml(indexHtml, css, js, meta.split));
    const versionsOut = readVersionsWithHtml(id, meta.versions).map((v) => Object.assign(v, { html: absolutizeAssets(id, v.html) }));
    return { meta, prompt, html, versions: versionsOut };
  }

  // Cadena semilla SSoT (hex 16-128). Cualquier otra cosa se guarda vacía.
  function cleanSsotSeed(v) {
    return typeof v === 'string' && /^[0-9a-f]{16,128}$/i.test(v) ? v.toLowerCase() : '';
  }

  // Concepto rector (técnica 2): solo título, "la página es" y paradigma, texto plano acotado.
  function cleanConcept(c) {
    if (!c || typeof c !== 'object') return null;
    const clip = (v, n) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');
    const titulo = clip(c.titulo, 140);
    const laPaginaEs = clip(c.laPaginaEs, 500);
    if (!titulo || !laPaginaEs) return null;
    return { titulo, laPaginaEs, paradigma: clip(c.paradigma, 120) };
  }

  function cleanCustomVertical(v) {
    return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  }

  function create({ project, verticals, customVertical, technologies, techniques, prompt, html, model, provider, versions, files, technology, ssotSeed, concept }) {
    const tema = (project && project.tema) || 'Proyecto sin nombre';
    const isMulti = !!(files && typeof files === 'object' && Object.keys(files).length);
    // Valida ANTES de crear la carpeta: un proyecto inválido no deja basura.
    const validated = isMulti ? validateProject(technology, files) : null;
    const id = makeId(tema);
    let indexHtml; let css; let js; let split;
    let mediaFiles = [];
    let versionsIn = versions;
    if (isMulti) {
      indexHtml = buildProjectPlaceholderHtml(tema, technology, validated.files.size);
      css = ''; js = ''; split = { css: false, js: false };
      writeProjectFiles(id, validated.files);
      mediaFiles = backupProjectMedia(id, validated.files);
    } else {
      const copiedSet = new Set();
      const loc = localizeMedia(id, html, 'assets/', copiedSet);
      ({ indexHtml, css, js, split } = splitHtmlDocument(loc.text));
      versionsIn = (Array.isArray(versions) ? versions : []).map((v) => Object.assign({}, v, { html: localizeMedia(id, v.html, '../assets/', copiedSet).text }));
      mediaFiles = Array.from(copiedSet);
    }
    writeEntryFiles(id, { indexHtml, css, js, split });
    writeFileAtomic(path.join(dirFor(id), 'prompt.md'), String(prompt || ''));
    const now = new Date().toISOString();
    const versionsMeta = writeVersions(id, isMulti ? [] : versionsIn);
    const meta = {
      id, tema, proyecto: project || {}, verticals: verticals || [], customVertical: cleanCustomVertical(customVertical), technologies: technologies || [],
      techniques: Array.isArray(techniques) ? techniques.filter((n) => Number.isInteger(n)) : [],
      mediaAssets: mediaFiles,
      model: model || '', provider: provider || '',
      ssotSeed: cleanSsotSeed(ssotSeed),
      concept: cleanConcept(concept),
      createdAt: now, updatedAt: now,
      split, versions: versionsMeta,
    };
    if (isMulti) {
      meta.multiFile = true;
      meta.technology = technology;
      meta.projectFiles = Array.from(validated.files.keys());
    }
    writeFileAtomic(metaPathFor(id), JSON.stringify(meta, null, 2));
    return get(id);
  }

  function update(id, { html, versions, files, techniques, ssotSeed, customVertical }) {
    if (!isValidId(id) || !fs.existsSync(metaPathFor(id))) return null;
    const meta = readMeta(id);
    if (meta.multiFile) {
      if (files && typeof files === 'object') {
        const validated = validateProject(meta.technology, files);
        writeProjectFiles(id, validated.files);
        meta.projectFiles = Array.from(validated.files.keys());
        meta.mediaAssets = backupProjectMedia(id, validated.files);
        writeFileAtomic(path.join(dirFor(id), 'index.html'), buildProjectPlaceholderHtml(meta.tema, meta.technology, validated.files.size));
      }
    } else if (typeof html === 'string') {
      const copiedSet = new Set(meta.mediaAssets || []);
      const loc = localizeMedia(id, html, 'assets/', copiedSet);
      const { indexHtml, css, js, split } = splitHtmlDocument(loc.text);
      writeEntryFiles(id, { indexHtml, css, js, split });
      meta.split = split;
      if (versions !== undefined) {
        versions = (Array.isArray(versions) ? versions : []).map((v) => Object.assign({}, v, { html: localizeMedia(id, v.html, '../assets/', copiedSet).text }));
      }
      meta.mediaAssets = Array.from(copiedSet);
    }
    if (Array.isArray(techniques)) meta.techniques = techniques.filter((n) => Number.isInteger(n));
    if (ssotSeed !== undefined) meta.ssotSeed = cleanSsotSeed(ssotSeed);
    if (customVertical !== undefined) meta.customVertical = cleanCustomVertical(customVertical);
    if (versions !== undefined && !meta.multiFile) {
      meta.versions = writeVersions(id, versions);
    }
    meta.updatedAt = new Date().toISOString();
    writeFileAtomic(metaPathFor(id), JSON.stringify(meta, null, 2));
    return get(id);
  }

  function duplicate(id) {
    const original = get(id);
    if (!original) return null;
    const newId = makeId(original.meta.tema);
    const newTema = `${original.meta.tema} (copia)`;
    let indexHtml; let css; let js; let split;
    if (fs.existsSync(assetsDirFor(id))) fs.cpSync(assetsDirFor(id), assetsDirFor(newId), { recursive: true });
    let versionsIn = original.versions || [];
    if (original.meta.multiFile) {
      const validated = validateProject(original.meta.technology, original.files);
      indexHtml = buildProjectPlaceholderHtml(newTema, original.meta.technology, validated.files.size);
      css = ''; js = ''; split = { css: false, js: false };
      writeProjectFiles(newId, validated.files);
    } else {
      ({ indexHtml, css, js, split } = splitHtmlDocument(localizeMedia(newId, original.html, 'assets/').text));
      versionsIn = versionsIn.map((v) => Object.assign({}, v, { html: localizeMedia(newId, v.html, '../assets/').text }));
    }
    writeEntryFiles(newId, { indexHtml, css, js, split });
    writeFileAtomic(path.join(dirFor(newId), 'prompt.md'), original.prompt);
    const now = new Date().toISOString();
    // original.versions ya trae el html leído (get() usa readVersionsWithHtml).
    const versionsMeta = writeVersions(newId, versionsIn);
    const meta = Object.assign({}, original.meta, {
      id: newId, tema: `${original.meta.tema} (copia)`,
      proyecto: Object.assign({}, original.meta.proyecto, { tema: `${original.meta.tema} (copia)` }),
      createdAt: now, updatedAt: now, split, versions: versionsMeta,
    });
    writeFileAtomic(metaPathFor(newId), JSON.stringify(meta, null, 2));
    return get(newId);
  }

  function remove(id) {
    if (!isValidId(id)) return false;
    const dir = dirFor(id);
    if (!fs.existsSync(dir)) return false;
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  }

  return { list, get, create, update, duplicate, remove };
}

module.exports = {
  slugify, makeId, isValidId, ID_RE,
  splitHtmlDocument, reassembleCanonicalHtml,
  writeFileAtomic, makeBankStore, MAX_VERSIONS,
};

/*
 * Landing Page Prompt Architect — preview-runner.js
 *
 * Levanta proyectos multi-archivo (Vite + React, Vite + Vue, Next.js) en
 * servidores de desarrollo locales para poder previsualizar landings que NO
 * son un único HTML. Sin dependencias (sólo Node >=18 y npm en el PATH).
 *
 * Diseño (ver DOCUMENTACION.md, "Preview de frameworks"):
 *   - Plantillas en os.tmpdir()/lpa-templates/{vite-react,vite-vue,next}:
 *     `npm install` UNA sola vez (marca .lpa-ready con hash del package.json).
 *   - Por ejecución: workspace os.tmpdir()/lpa-previews/<id>/ con los
 *     archivos validados + `node_modules` como symlink a la plantilla.
 *   - Dev server ligado a 127.0.0.1 en un puerto libre; se espera HTTP 200.
 *   - Máx. 2 activos (se desaloja el más viejo), TTL de inactividad de 20 min,
 *     y se matan por GRUPO de procesos (detached + kill(-pid)) al salir.
 *
 * Seguridad: el código lo escribe un modelo. Se valida ruta por ruta (nada
 * de absolutas ni `..`), tamaño, extensiones y que los imports "de paquete"
 * sean sólo los de la lista blanca (react, react-dom, vue, next, gsap,
 * lenis, three). En Next el código también corre del lado del servidor, así
 * que se rechazan rutas API/middleware/server actions y APIs peligrosas de
 * Node (child_process, process.*, eval, new Function). Es una defensa en
 * profundidad best-effort, no un sandbox: ver limitaciones en la doc.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { buildConsoleCaptureScript } = require('./console-capture.js');
const net = require('net');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

/* ------------------------------------------------------------------ */
/* Constantes                                                          */
/* ------------------------------------------------------------------ */

// En frameworks todo se instala por npm como en un proyecto real (sin CDN).
// Estos paquetes vienen PREINSTALADOS en las plantillas; cualquier otro
// paquete npm que el proyecto importe (lucide-react, framer-motion…) se
// verifica en el registro y se instala bajo demanda con --ignore-scripts.
const ALLOWED_DEPS = ['react', 'react-dom', 'vue', 'next', 'gsap', 'lenis', 'three', 'tailwindcss', 'bootstrap'];
const NODE_BUILTINS = new Set(require('module').builtinModules.map((m) => m.replace(/^node:/, '')));
const NPM_NAME_RE = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;

const MAX_FILES = 80;
const MAX_FILE_BYTES = 400 * 1024;
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;
const MAX_ACTIVE = 2;
const TTL_MS = 20 * 60 * 1000;
const READY_TIMEOUT_MS = 90 * 1000;
const INSTALL_TIMEOUT_MS = 8 * 60 * 1000;
const LOG_MAX_LINES = 400;

const TEMPLATE_DEFS = {
  'vite-react': {
    label: 'Vite + React',
    dependencies: { react: '^19.3.0', 'react-dom': '^19.3.0', gsap: '^3.15.0', lenis: '^1.3.26', three: '^0.186.1', bootstrap: '^5.3.8' },
    devDependencies: { vite: '^8.3.1', '@vitejs/plugin-react': '^6.1.1', tailwindcss: '^4.3.3', '@tailwindcss/vite': '^4.3.3' },
  },
  'vite-vue': {
    label: 'Vite + Vue',
    dependencies: { vue: '^3.5.43', gsap: '^3.15.0', lenis: '^1.3.26', three: '^0.186.1', bootstrap: '^5.3.8' },
    devDependencies: { vite: '^8.3.1', '@vitejs/plugin-vue': '^6.0.9', tailwindcss: '^4.3.3', '@tailwindcss/vite': '^4.3.3' },
  },
  next: {
    label: 'Next.js',
    dependencies: { next: '^16.3.6', react: '^19.3.0', 'react-dom': '^19.3.0', gsap: '^3.15.0', lenis: '^1.3.26', three: '^0.186.1', bootstrap: '^5.3.8' },
    devDependencies: { tailwindcss: '^4.3.3', '@tailwindcss/postcss': '^4.3.3' },
  },
};

const TECH_TO_TEMPLATE = { react: 'vite-react', vue: 'vite-vue', nextjs: 'next', 'vite-react': 'vite-react', 'vite-vue': 'vite-vue', next: 'next' };

/* ------------------------------------------------------------------ */
/* Parseo del formato === FILE: ruta === ... === END FILE ===          */
/* ------------------------------------------------------------------ */

// Quita una cerca de markdown que envuelve TODO el contenido de un archivo
// (los modelos a veces la agregan pese a que se les pide que no).
function stripFence(content) {
  const m = content.match(/^\s*```[\w.+-]*[ \t]*\r?\n([\s\S]*?)\r?\n?```\s*$/);
  return m ? m[1] : content;
}

// Devuelve [{ path, content }]. Tolera cercas de markdown alrededor de todo
// el texto o de cada bloque, y CRLF. No valida rutas (eso es validateProject).
function parseFileBlocks(raw) {
  if (!raw) return [];
  const text = String(raw).replace(/\r\n/g, '\n');
  const re = /^[ \t]*=== FILE:[ \t]*(.+?)[ \t]*===[ \t]*\n([\s\S]*?)\n?^[ \t]*=== END FILE ===[ \t]*$/gm;
  const files = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    let content = stripFence(m[2]);
    if (!content.endsWith('\n')) content += '\n';
    files.push({ path: m[1].replace(/^[`'"]+|[`'"]+$/g, '').trim(), content });
  }
  return files;
}

function looksLikeFileBlocks(raw) {
  return typeof raw === 'string' && /^[ \t]*=== FILE:[ \t]*.+===[ \t]*$/m.test(raw) && /=== END FILE ===/.test(raw);
}

/* ------------------------------------------------------------------ */
/* Validación                                                          */
/* ------------------------------------------------------------------ */

class ValidationError extends Error {
  constructor(message) { super(message); this.name = 'ValidationError'; this.code = 'VALIDATION'; }
}

const SEGMENT_RE = /^[A-Za-z0-9_\-.()[\]@]+$/;
const RESERVED_ROOT_RE = /^(package(-lock)?\.json|vite\.config\.[cm]?[jt]s|next\.config\.[cm]?[jt]s|postcss\.config\.[cm]?[jt]s|tailwind\.config\.[cm]?[jt]s|jsconfig\.json|tsconfig\.json|next-env\.d\.ts|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml)$/i;
const BASE_EXTS = ['.js', '.jsx', '.mjs', '.css', '.json', '.html', '.vue', '.svg', '.txt', '.md'];
const TS_EXTS = ['.ts', '.tsx'];
const CODE_EXT_RE = /\.(js|jsx|mjs|ts|tsx|vue)$/i;

// Normaliza y valida una ruta relativa del proyecto. Devuelve la ruta
// normalizada con "/" o lanza ValidationError.
function normalizeProjectPath(p) {
  if (typeof p !== 'string' || !p.trim()) throw new ValidationError('Ruta de archivo vacía.');
  const raw = p.trim();
  if (raw.indexOf('\0') !== -1) throw new ValidationError(`Ruta inválida: "${p}".`);
  if (raw.indexOf('\\') !== -1) throw new ValidationError(`Ruta inválida (usá "/" como separador): "${p}".`);
  if (raw.startsWith('/') || /^[A-Za-z]:/.test(raw) || raw.startsWith('~')) throw new ValidationError(`Ruta absoluta no permitida: "${p}".`);
  const segments = raw.split('/');
  for (const seg of segments) {
    if (seg === '' || seg === '.') throw new ValidationError(`Ruta inválida: "${p}".`);
    if (seg === '..') throw new ValidationError(`Ruta con ".." no permitida: "${p}".`);
    if (seg.startsWith('.')) throw new ValidationError(`Archivos/carpetas ocultos no permitidos: "${p}".`);
    if (seg === 'node_modules') throw new ValidationError(`"node_modules" no permitido: "${p}".`);
    if (!SEGMENT_RE.test(seg)) throw new ValidationError(`Caracteres no permitidos en la ruta: "${p}".`);
  }
  const normalized = path.posix.normalize(raw);
  if (normalized !== raw) throw new ValidationError(`Ruta inválida: "${p}".`);
  return normalized;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

// Devuelve los especificadores de módulo que aparecen en `source`.
function scanImports(source, fileExt) {
  let code = source;
  if (fileExt === '.html') {
    const parts = [];
    source.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_, body) => { parts.push(body); return ''; });
    code = parts.join('\n');
  }
  const specs = [];
  if (fileExt === '.css') {
    source.replace(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi, (_, s) => { specs.push(s); return ''; });
    return specs;
  }
  code = stripComments(code);
  const patterns = [
    /\bimport\s+(?:[\w*${}\s,]+?\s+from\s+)?["']([^"'\n]+)["']/g,
    /\bexport\s+(?:\*|\{[^}]*\})(?:\s+as\s+\w+)?\s*from\s*["']([^"'\n]+)["']/g,
    /\bimport\s*\(\s*["']([^"'\n]+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"'\n]+)["']\s*\)/g,
  ];
  patterns.forEach((re) => {
    let m;
    while ((m = re.exec(code)) !== null) specs.push(m[1]);
  });
  return specs;
}

function packageNameOf(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

// Valida un especificador de import. `fileDir` es la carpeta (posix, relativa
// al proyecto) del archivo que importa.
function checkSpecifier(spec, fileDir, filePath, templateName) {
  const clean = spec.split('?')[0].split('#')[0];
  if (clean.startsWith('./') || clean.startsWith('../') || clean === '.' || clean === '..') {
    const resolved = path.posix.normalize(path.posix.join(fileDir || '.', clean));
    if (resolved === '..' || resolved.startsWith('../')) {
      throw new ValidationError(`Import fuera del proyecto en ${filePath}: "${spec}".`);
    }
    return;
  }
  if (clean.startsWith('/')) {
    if (templateName === 'next') throw new ValidationError(`Import con ruta absoluta no permitido en ${filePath}: "${spec}".`);
    if (clean.startsWith('/@fs/') || clean.indexOf('..') !== -1) throw new ValidationError(`Import no permitido en ${filePath}: "${spec}".`);
    return;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean)) {
    // http:, https:, node:, data:, virtual: ... => código remoto o interno
    throw new ValidationError(`Import no permitido en ${filePath}: "${spec}" (usá paquetes npm o rutas relativas, no URLs ni esquemas).`);
  }
  const pkg = packageNameOf(clean);
  if (ALLOWED_DEPS.indexOf(pkg) !== -1) return null;
  if (NODE_BUILTINS.has(pkg.split('/')[0])) {
    throw new ValidationError(`"${spec}" en ${filePath} es un módulo interno de Node, no una librería de la página.`);
  }
  if (pkg.length > 214 || !NPM_NAME_RE.test(pkg)) {
    throw new ValidationError(`Nombre de paquete inválido en ${filePath}: "${spec}".`);
  }
  return pkg; // dependencia extra: se instala por npm antes de levantar la vista previa
}

function hasDangerousServerCode(source) {
  const code = stripComments(source);
  if (/\bchild_process\b/.test(code)) return 'child_process';
  if (/['"]use server['"]/.test(code)) return 'server actions ("use server")';
  if (/\beval\s*\(/.test(code)) return 'eval()';
  if (/\bnew\s+Function\b|\bFunction\s*\(/.test(code)) return 'Function()';
  if (/\bglobalThis\s*\.\s*process\b|\brequire\s*\.\s*main\b|\bmodule\s*\.\s*require\b|\bprocess\s*\[/.test(code)) return 'acceso a process/require';
  const re = /\bprocess\s*\.\s*([A-Za-z_]+)(\s*\.\s*([A-Za-z_]+))?/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    if (m[1] === 'env' && m[3] === 'NODE_ENV') continue;
    return `process.${m[1]}`;
  }
  return null;
}

function hasNextEntry(paths) {
  return paths.some((p) => /^(src\/)?app\/page\.(js|jsx|mjs)$/.test(p));
}

// Valida y normaliza el proyecto. `files` es un objeto { ruta: contenido }.
// Devuelve { files: Map(ruta -> contenido), ignored: [rutas] } o lanza
// ValidationError con un mensaje en español listo para mostrar.
function validateProject(technology, files) {
  const templateName = TECH_TO_TEMPLATE[technology];
  if (!templateName) throw new ValidationError(`Tecnología no soportada para preview multi-archivo: "${technology}".`);
  if (!files || typeof files !== 'object' || Array.isArray(files)) throw new ValidationError('"files" debe ser un objeto { ruta: contenido }.');
  const entries = Object.keys(files);
  if (entries.length === 0) throw new ValidationError('El proyecto no tiene archivos.');
  if (entries.length > MAX_FILES) throw new ValidationError(`Demasiados archivos (${entries.length}); el máximo es ${MAX_FILES}.`);

  const out = new Map();
  const ignored = [];
  let total = 0;
  const allowedExts = BASE_EXTS.concat(templateName === 'next' ? [] : TS_EXTS);

  entries.forEach((rawPath) => {
    const content = files[rawPath];
    if (typeof content !== 'string') throw new ValidationError(`El contenido de "${rawPath}" debe ser texto.`);
    const p = normalizeProjectPath(rawPath);
    if (out.has(p)) throw new ValidationError(`Ruta duplicada: "${p}".`);
    if (!p.includes('/') && RESERVED_ROOT_RE.test(p)) { ignored.push(p); return; } // los configs los pone el runner
    const ext = path.posix.extname(p).toLowerCase();
    if (!allowedExts.includes(ext)) throw new ValidationError(`Extensión no permitida en "${p}" (${ext || 'sin extensión'}).${TS_EXTS.includes(ext) ? ' Next.js: usá JavaScript (.js/.jsx).' : ''}`);
    const bytes = Buffer.byteLength(content, 'utf8');
    if (bytes > MAX_FILE_BYTES) throw new ValidationError(`"${p}" pesa demasiado (${Math.round(bytes / 1024)} KB; máx. ${MAX_FILE_BYTES / 1024} KB).`);
    total += bytes;
    if (total > MAX_TOTAL_BYTES) throw new ValidationError(`El proyecto supera el tamaño máximo (${MAX_TOTAL_BYTES / 1024 / 1024} MB).`);
    if (templateName === 'next') {
      if (/(^|\/)(route|middleware|instrumentation)\.[a-z]+$/i.test(p) || /^(src\/)?pages\//.test(p) || /(^|\/)api\//.test(p)) {
        throw new ValidationError(`Next.js: "${p}" no permitido (nada de rutas API, pages/, middleware ni instrumentation; sólo App Router de páginas).`);
      }
    }
    out.set(p, content);
  });

  const paths = Array.from(out.keys());
  if (templateName === 'next') {
    if (!hasNextEntry(paths)) throw new ValidationError('Falta la página principal de Next.js: `app/page.jsx` (App Router).');
  } else if (!out.has('index.html')) {
    throw new ValidationError('Falta `index.html` en la raíz del proyecto Vite.');
  }

  const extras = new Set();
  out.forEach((content, p) => {
    validateFileContent(templateName, p, content).forEach((x) => extras.add(x));
  });

  return { files: out, ignored, templateName, extras };
}

// Validación de imports/peligros de UN archivo (también se usa al guardar).
// Devuelve el Set de paquetes npm extra (no preinstalados) que importa.
function validateFileContent(templateName, p, content) {
  const ext = path.posix.extname(p).toLowerCase();
  const extras = new Set();
  if (['.js', '.jsx', '.mjs', '.ts', '.tsx', '.vue', '.html', '.css'].includes(ext)) {
    const fileDir = path.posix.dirname(p);
    scanImports(content, ext).forEach((spec) => {
      if (ext === '.css' && (/^(https?:)?\/\//i.test(spec) || spec.startsWith('data:'))) return; // fuentes/estilos remotos: sólo estilos, no código
      const extra = checkSpecifier(spec, fileDir === '.' ? '' : fileDir, p, templateName);
      if (extra) extras.add(extra);
    });
  }
  if (templateName === 'next' && CODE_EXT_RE.test(p)) {
    const bad = hasDangerousServerCode(content);
    if (bad) throw new ValidationError(`Next.js: "${p}" usa ${bad}, que no está permitido (el código corre también del lado del servidor).`);
  }
  return extras;
}

/* ------------------------------------------------------------------ */
/* Inspector de la preview (Alt+clic -> código en el Estudio)          */
/* ------------------------------------------------------------------ */
/* Sólo se inyecta en la COPIA de trabajo del workspace del dev server
 * (nunca en pv.files, ni en el Banco, ni en lo exportado). El iframe es
 * de OTRO origen (127.0.0.1:<puerto>): habla con la app por postMessage.
 * El origen del padre NO se hardcodea: se aprende del mensaje `lpa:hello`
 * (event.source === window.parent) que envía la app; sólo a ese origen se
 * postean los resultados. */
const INSPECTOR_PUBLIC_PATH = 'public/__lpa_inspector.js';
const INSPECTOR_URL = '/__lpa_inspector.js';
const INSPECTOR_JS = [
  '(function(){',
  'if(window.__lpaInspector)return;window.__lpaInspector=1;',
  'var parentOrigin=null,inspecting=false,lastEl=null,prevOutline="";',
  'try{if(location.ancestorOrigins&&location.ancestorOrigins[0])parentOrigin=location.ancestorOrigins[0];}catch(e){}',
  'window.addEventListener("message",function(ev){',
  'if(ev.source!==window.parent)return;var d=ev.data;if(!d||typeof d.type!=="string")return;',
  'if(d.type==="lpa:hello"){parentOrigin=ev.origin;return;}',
  'if(d.type==="lpa:inspect-toggle"){parentOrigin=ev.origin;inspecting=!!d.enabled;}',
  '});',
  'document.addEventListener("click",function(ev){',
  'if(!(ev.altKey||inspecting)||!parentOrigin)return;',
  'var el=ev.target;if(!el||el===document.documentElement||el===document.body)return;',
  'ev.preventDefault();ev.stopPropagation();',
  'if(lastEl)lastEl.style.outline=prevOutline;',
  'prevOutline=el.style.outline;el.style.outline="2px solid #1f3a6f";lastEl=el;',
  'var classes=(el.className&&typeof el.className==="string")?el.className.trim().split(/\\s+/).filter(Boolean):[];',
  'var own="";for(var i=0;i<el.childNodes.length;i++){if(el.childNodes[i].nodeType===3)own+=el.childNodes[i].nodeValue;}',
  'own=own.replace(/\\s+/g," ").trim().slice(0,80);',
  'var text=(el.textContent||"").replace(/\\s+/g," ").trim().slice(0,80);',
  'try{window.parent.postMessage({type:"lpa:inspect-result",tag:el.tagName.toLowerCase(),id:el.id||"",classes:classes,textSnippet:text,ownText:own},parentOrigin);}catch(e){}',
  '},true);',
  'try{window.parent.postMessage({type:"lpa:inspector-ready"},"*");}catch(e){}',
  '})();',
  '',
].join('\n');

/* Consola del Estudio (errores/logs de la página → app por postMessage).
 * Mismo criterio que el inspector: sólo en la copia de trabajo del
 * workspace. A diferencia del inspector va lo MÁS TEMPRANO posible: un
 * <script src> síncrono como primer hijo de <head> (Vite: index.html; Next:
 * layout), antes de cualquier otro script, así atrapa los errores de los
 * módulos que cargan después. En Next, si el layout no permite tocar <head>,
 * el componente cliente lo carga tarde (useEffect): se pierde lo que tiró la
 * hidratación inicial, pero se captura todo lo posterior. */
const CONSOLE_URL = '/__lpa_console.js';
const CONSOLE_PUBLIC_PATH = 'public/__lpa_console.js';
const CONSOLE_JS = `${buildConsoleCaptureScript({ mode: 'origin' })}\n`;

const INSPECTOR_NEXT_COMPONENT = [
  "'use client';",
  "import { useEffect } from 'react';",
  'export default function LpaInspector() {',
  '  useEffect(() => {',
  '    if (!window.__lpaConsole) {',
  "      const c = document.createElement('script');",
  `      c.src = '${CONSOLE_URL}';`,
  '      document.head.appendChild(c);',
  '    }',
  '    if (window.__lpaInspector) return;',
  "    const s = document.createElement('script');",
  `    s.src = '${INSPECTOR_URL}';`,
  '    document.body.appendChild(s);',
  '  }, []);',
  '  return null;',
  '}',
  '',
].join('\n');

function injectViteInspector(html) {
  const src = String(html || '');
  if (src.indexOf(INSPECTOR_URL) !== -1) return src;
  const tag = `<script src="${INSPECTOR_URL}"></script>`;
  if (/<\/body>/i.test(src)) return src.replace(/<\/body>/i, () => `${tag}\n</body>`);
  if (/<\/html>/i.test(src)) return src.replace(/<\/html>/i, () => `${tag}\n</html>`);
  return `${src}\n${tag}\n`;
}

// Posición (justo después de la etiqueta) para insertar como primer hijo de
// <head>; cae a <html> y a después del doctype. Ignora comentarios HTML.
function afterHeadIndex(src) {
  const insideComment = (idx) => src.lastIndexOf('<!--', idx) > src.lastIndexOf('-->', idx);
  const find = (re) => {
    const g = new RegExp(re.source, 'gi');
    let m;
    while ((m = g.exec(src))) if (!insideComment(m.index)) return { end: m.index + m[0].length, isHead: /^<head/i.test(m[0]) };
    return null;
  };
  return find(/<head(?:\s[^>]*)?>/) || find(/<html(?:\s[^>]*)?>/) || find(/<!doctype[^>]*>/) || { end: 0, isHead: false };
}

// Vite: <script src> síncrono como primer hijo de <head>, en la MISMA línea
// (no corre las líneas del código original).
function injectViteConsole(html) {
  const src = String(html || '');
  if (src.indexOf(CONSOLE_URL) !== -1) return src;
  const at = afterHeadIndex(src).end;
  return `${src.slice(0, at)}<script src="${CONSOLE_URL}"></script>${src.slice(at)}`;
}

// Next: script síncrono dentro de <head> del layout (lo crea si sólo hay
// <html>). Sin <html> ni <head> el layout queda intacto y el componente
// cliente lo carga tarde. Misma línea: no corre líneas.
function injectNextConsole(layoutSrc) {
  const src = String(layoutSrc || '');
  if (src.indexOf('__lpa_console') !== -1) return src;
  const tag = `<script src="${CONSOLE_URL}" />`;
  const head = /<head(?:\s[^>]*)?>/i.exec(src);
  if (head) return `${src.slice(0, head.index + head[0].length)}${tag}${src.slice(head.index + head[0].length)}`;
  const html = /<html(?:\s[^>]*)?>/i.exec(src);
  if (html) return `${src.slice(0, html.index + html[0].length)}<head>${tag}</head>${src.slice(html.index + html[0].length)}`;
  return src;
}

// Importa el componente cliente en el layout y lo monta antes de </body>.
// Si el layout no tiene </body> se deja intacto (sin inspector, sin romper).
function injectNextInspector(layoutSrc) {
  const src = String(layoutSrc || '');
  if (src.indexOf('__lpa_inspector') !== -1) return src;
  if (!/<\/body>/i.test(src)) return src;
  const withTag = src.replace(/<\/body>/i, () => '<LpaInspector /></body>');
  const imp = "import LpaInspector from './__lpa_inspector.jsx';\n";
  const dir = withTag.match(/^(\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*(?:['"]use (?:client|server|strict)['"];?[ \t]*\n)+)/);
  return dir ? dir[1] + imp + withTag.slice(dir[1].length) : imp + withTag;
}

function nextAppDirOf(paths) {
  const has = (p) => (paths.has ? paths.has(p) : paths.indexOf(p) !== -1);
  return has('src/app/page.jsx') || has('src/app/page.js') || has('src/app/page.mjs') ? 'src/app' : 'app';
}

// Contenido que realmente se escribe al workspace (con el inspector) para
// el archivo `p`. El resto de los archivos pasan tal cual.
function instrumentForWorkspace(templateName, p, content, appDir) {
  if (templateName === 'next') {
    return new RegExp(`^${appDir}/layout\\.(jsx|js|mjs)$`).test(p) ? injectNextInspector(injectNextConsole(content)) : content;
  }
  return p === 'index.html' ? injectViteConsole(injectViteInspector(content)) : content;
}

function writeInspectorAssets(ws, templateName, appDir) {
  const pub = path.join(ws, INSPECTOR_PUBLIC_PATH);
  fs.mkdirSync(path.dirname(pub), { recursive: true });
  fs.writeFileSync(pub, INSPECTOR_JS);
  fs.writeFileSync(path.join(ws, CONSOLE_PUBLIC_PATH), CONSOLE_JS);
  if (templateName === 'next') fs.writeFileSync(path.join(ws, appDir, '__lpa_inspector.jsx'), INSPECTOR_NEXT_COMPONENT);
}

/* ------------------------------------------------------------------ */
/* Utilidades de proceso / red                                         */
/* ------------------------------------------------------------------ */

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function httpGet(url, timeoutMs) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs || 5000, headers: { Accept: 'text/html,*/*' } }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (c) => { size += c.length; if (size < 512 * 1024) chunks.push(c); });
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', () => resolve({ status: 0, body: '' }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
    req.on('error', () => resolve({ status: 0, body: '' }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stripAnsi = (s) => s.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');

function killGroup(child, signal) {
  if (!child || !child.pid) return;
  try { process.kill(-child.pid, signal); } catch (e) {
    try { process.kill(child.pid, signal); } catch (e2) { /* ya terminó */ }
  }
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

function createPreviewRunner(options) {
  const opts = options || {};
  const tmp = opts.tmpRoot || os.tmpdir();
  const templatesRoot = opts.templatesRoot || path.join(tmp, 'lpa-templates');
  const previewsRoot = opts.previewsRoot || path.join(tmp, 'lpa-previews');
  const ttlMs = opts.ttlMs || TTL_MS;
  const readyTimeoutMs = opts.readyTimeoutMs || READY_TIMEOUT_MS;
  const maxActive = opts.maxActive || MAX_ACTIVE;

  const previews = new Map(); // id -> preview
  const templatePromises = new Map(); // name -> Promise
  let closing = false;

  // Al arrancar se limpian workspaces de corridas previas (no hay procesos
  // vivos nuestros: los de un servidor anterior murieron con él).
  try { fs.rmSync(previewsRoot, { recursive: true, force: true }); } catch (e) { /* no-op */ }
  fs.mkdirSync(previewsRoot, { recursive: true });

  // Cada línea lleva un `seq` monótono (nunca se reinicia mientras viva el
  // preview, ni al detener/iniciar) para que el cliente pida sólo lo nuevo
  // con GET .../logs?since=<seq>. stream: stdout | stderr | system.
  function addLog(pv, text, stream) {
    const ts = Date.now();
    stripAnsi(String(text)).split(/\r?\n/).forEach((line) => {
      if (!line.trim()) return;
      pv.logs.push({ seq: ++pv.logSeq, ts, text: line.slice(0, 500), stream: stream === 'stdout' || stream === 'stderr' ? stream : 'system' });
    });
    if (pv.logs.length > LOG_MAX_LINES) pv.logs.splice(0, pv.logs.length - LOG_MAX_LINES);
  }

  function publicView(pv) {
    return {
      previewId: pv.id,
      technology: pv.technology,
      template: pv.templateName,
      status: pv.status, // installing | starting | ready | error | stopped
      message: pv.message,
      url: pv.status === 'ready' ? pv.url : null,
      port: pv.port || null,
      error: pv.error || null,
      logsTail: pv.logs.slice(-40).map((l) => l.text),
      installMs: pv.installMs || 0,
      startMs: pv.startMs || 0,
      ignored: pv.ignored,
      files: Array.from(pv.filePaths),
      expiresInMs: Math.max(0, pv.expiresAt - Date.now()),
    };
  }

  function touch(pv) {
    pv.lastTouch = Date.now();
    pv.expiresAt = pv.lastTouch + ttlMs;
    if (pv.ttlTimer) clearTimeout(pv.ttlTimer);
    pv.ttlTimer = setTimeout(() => { stop(pv.id); }, ttlMs);
    if (pv.ttlTimer.unref) pv.ttlTimer.unref();
  }

  /* ---- plantillas ---- */

  function templateHash(def) {
    return crypto.createHash('sha1').update(JSON.stringify(def)).digest('hex').slice(0, 12);
  }

  function runNpmInstall(dir, pv, extraArgs) {
    return new Promise((resolve, reject) => {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const child = spawn(npmCmd, ['install', '--no-audit', '--no-fund', '--loglevel=error', '--no-progress'].concat(extraArgs || []), {
        cwd: dir, detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, { CI: '1' }),
      });
      if (pv) pv.installChild = child;
      let out = '';
      const onData = (stream) => (d) => { out += d; if (pv) addLog(pv, d, stream); };
      child.stdout.on('data', onData('stdout'));
      child.stderr.on('data', onData('stderr'));
      const timer = setTimeout(() => { killGroup(child, 'SIGKILL'); }, INSTALL_TIMEOUT_MS);
      child.on('error', (e) => { clearTimeout(timer); reject(new Error(`No se pudo ejecutar npm: ${e.message}`)); });
      child.on('close', (code, signal) => {
        clearTimeout(timer);
        if (pv) pv.installChild = null;
        if (code === 0) resolve();
        else reject(new Error(`npm install falló (${signal || 'código ' + code}). ${stripAnsi(out).split('\n').slice(-6).join(' ').slice(0, 400)}`));
      });
    });
  }

  // ¿Existe el paquete en el registro de npm? (evita instalar nombres
  // inventados por el modelo y da un error claro).
  function npmPackageExists(name) {
    return new Promise((resolve) => {
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const child = spawn(npmCmd, ['view', name, 'version', '--json'], { stdio: ['ignore', 'pipe', 'ignore'] });
      let out = '';
      child.stdout.on('data', (d) => { out += d; });
      const t = setTimeout(() => { try { child.kill('SIGKILL'); } catch (e) { /* ya terminó */ } resolve(false); }, 25000);
      child.on('error', () => { clearTimeout(t); resolve(false); });
      child.on('close', (code) => { clearTimeout(t); resolve(code === 0 && out.trim().length > 0); });
    });
  }

  // Instala en la plantilla (una sola vez, compartido) los paquetes extra que
  // importa el proyecto. --ignore-scripts: se instala el código pero NO se
  // ejecutan sus scripts de instalación (vía típica de malware en npm).
  const extrasQueues = new Map();
  function ensureExtras(tpl, templateName, extras, pv) {
    const missing = Array.from(extras || []).filter((n) => !fs.existsSync(path.join(tpl.dir, 'node_modules', n, 'package.json')));
    if (!missing.length) return Promise.resolve([]);
    const prev = extrasQueues.get(templateName) || Promise.resolve();
    const run = prev.then(async () => {
      const still = missing.filter((n) => !fs.existsSync(path.join(tpl.dir, 'node_modules', n, 'package.json')));
      if (!still.length) return [];
      for (const n of still) {
        // eslint-disable-next-line no-await-in-loop -- secuencial, pocos paquetes
        if (!(await npmPackageExists(n))) throw new ValidationError(`El paquete "${n}" no existe en npm (¿nombre inventado por el modelo?). Corregí el import o usá otro paquete.`);
      }
      if (pv) addLog(pv, `Instalando dependencias del proyecto: ${still.join(', ')}…`);
      await runNpmInstall(tpl.dir, pv, ['--ignore-scripts'].concat(still));
      return still;
    });
    extrasQueues.set(templateName, run.catch(() => {}));
    return run;
  }

  // Garantiza que la plantilla esté instalada. Devuelve { dir, installMs }.
  function ensureTemplate(name, pv) {
    if (typeof opts.ensureTemplate === 'function') return Promise.resolve(opts.ensureTemplate(name, pv)); // sólo para pruebas
    if (templatePromises.has(name)) return templatePromises.get(name);
    const def = TEMPLATE_DEFS[name];
    const dir = path.join(templatesRoot, name);
    const marker = path.join(dir, '.lpa-ready');
    const hash = templateHash(def);
    const p = (async () => {
      try {
        if (fs.readFileSync(marker, 'utf8').trim().split(' ')[0] === hash && fs.existsSync(path.join(dir, 'node_modules'))) {
          return { dir, installMs: 0 };
        }
      } catch (e) { /* hay que instalar */ }
      const started = Date.now();
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        name: `lpa-template-${name}`, private: true, version: '0.0.0', type: 'module',
        dependencies: def.dependencies, devDependencies: def.devDependencies,
      }, null, 2));
      if (pv) addLog(pv, `Instalando dependencias de ${def.label} (sólo la primera vez)…`);
      await runNpmInstall(dir, pv);
      const installMs = Date.now() - started;
      fs.writeFileSync(marker, `${hash} ${installMs}\n`);
      return { dir, installMs };
    })();
    templatePromises.set(name, p);
    p.catch(() => { templatePromises.delete(name); });
    return p;
  }

  /* ---- workspace ---- */

  function viteConfigFor(templateName, ws) {
    const isVue = templateName === 'vite-vue';
    return [
      "import { defineConfig } from 'vite';",
      isVue ? "import vue from '@vitejs/plugin-vue';" : "import react from '@vitejs/plugin-react';",
      "import tailwindcss from '@tailwindcss/vite';",
      'export default defineConfig({',
      `  root: ${JSON.stringify(ws)},`,
      `  plugins: [${isVue ? 'vue()' : 'react()'}, tailwindcss()],`,
      `  cacheDir: ${JSON.stringify(path.join(ws, '.vite-cache'))},`,
      '  clearScreen: false,',
      '  resolve: { preserveSymlinks: true },',
      `  server: { host: '127.0.0.1', strictPort: true, fs: { strict: true, allow: [${JSON.stringify(ws)}] } },`,
      '});',
      '',
    ].join('\n');
  }

  function nextConfigFor() {
    return [
      'export default {',
      `  turbopack: { root: ${JSON.stringify(tmp)} },`,
      "  allowedDevOrigins: ['127.0.0.1', 'localhost'],",
      '  agentRules: false,',
      '  devIndicators: false,',
      '  reactStrictMode: false,',
      '  images: { unoptimized: true },',
      '};',
      '',
    ].join('\n');
  }

  const DEFAULT_NEXT_LAYOUT = [
    'export const metadata = { title: "Landing" };',
    'export default function RootLayout({ children }) {',
    '  return (<html lang="es"><body>{children}</body></html>);',
    '}',
    '',
  ].join('\n');

  function writeWorkspace(pv, tpl) {
    const ws = pv.dir;
    fs.rmSync(ws, { recursive: true, force: true });
    fs.mkdirSync(ws, { recursive: true });
    const appDirForInspector = nextAppDirOf(pv.files);
    pv.files.forEach((content, p) => {
      const abs = path.join(ws, p);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, instrumentForWorkspace(pv.templateName, p, content, appDirForInspector));
    });
    fs.writeFileSync(path.join(ws, 'package.json'), JSON.stringify({ name: 'lpa-preview', private: true, version: '0.0.0', type: pv.templateName === 'next' ? undefined : 'module' }, null, 2));
    if (pv.templateName === 'next') {
      fs.writeFileSync(path.join(ws, 'next.config.mjs'), nextConfigFor());
      // Tailwind v4 real (npm) vía PostCSS: `@import "tailwindcss";` en el CSS global funciona tal cual.
      fs.writeFileSync(path.join(ws, 'postcss.config.mjs'), "export default { plugins: { '@tailwindcss/postcss': {} } };\n");
      const appDir = appDirForInspector;
      const hasLayout = ['jsx', 'js', 'mjs'].some((e) => pv.files.has(`${appDir}/layout.${e}`));
      if (!hasLayout) {
        fs.mkdirSync(path.join(ws, appDir), { recursive: true });
        fs.writeFileSync(path.join(ws, appDir, 'layout.jsx'), injectNextInspector(injectNextConsole(DEFAULT_NEXT_LAYOUT)));
        pv.filePaths.add(`${appDir}/layout.jsx`);
        addLog(pv, `Se agregó ${appDir}/layout.jsx por defecto (faltaba).`);
      }
    } else {
      fs.writeFileSync(path.join(ws, 'vite.config.mjs'), viteConfigFor(pv.templateName, ws));
    }
    writeInspectorAssets(ws, pv.templateName, appDirForInspector);
    fs.symlinkSync(path.join(tpl.dir, 'node_modules'), path.join(ws, 'node_modules'), 'dir');
  }

  /* ---- arranque ---- */

  function bumpStatus(pv, status, message) {
    pv.status = status;
    pv.message = message;
  }

  async function waitUntilReady(pv, gen) {
    const deadline = Date.now() + readyTimeoutMs;
    let consecutive500 = 0;
    while (Date.now() < deadline) {
      if (pv.status === 'stopped' || pv.gen !== gen) throw new Error('La preview fue detenida.');
      if (pv.exited) throw new Error(`El servidor de desarrollo terminó antes de estar listo (${pv.exitInfo}).`);
      // eslint-disable-next-line no-await-in-loop
      const r = await httpGet(`http://127.0.0.1:${pv.port}/`, 8000);
      if (r.status === 200) return r;
      if (r.status >= 500) {
        consecutive500++;
        if (consecutive500 >= 3) throw new Error(`Error de compilación (HTTP ${r.status}).`);
      } else {
        consecutive500 = 0;
      }
      // eslint-disable-next-line no-await-in-loop
      await sleep(600);
    }
    throw new Error(`El servidor no respondió HTTP 200 en ${Math.round(readyTimeoutMs / 1000)} s.`);
  }

  // Vite responde los errores de transformación con una página HTML que trae
// `const error = {...}` con el mensaje real.
function extractViteError(body) {
  const m = String(body).match(/const error = (\{[\s\S]*?\})\s*\n/);
  if (m) {
    try {
      const obj = JSON.parse(m[1]);
      if (obj && obj.message) return stripAnsi(String(obj.message)).replace(/\s+/g, ' ').trim().slice(0, 500);
    } catch (e) { /* cae al texto plano */ }
  }
  return stripAnsi(String(body)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
}

// Vite sirve "/" aunque el módulo de entrada tenga un error de sintaxis:
  // se recorren los módulos del proyecto (acotado) para detectar errores de
  // compilación antes de declarar la preview lista.
  async function crawlViteModules(pv, rootRes) {
    const seen = new Set();
    const queue = [];
    const base = `http://127.0.0.1:${pv.port}`;
    (rootRes.body.match(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi) || []).forEach((tag) => {
      const m = tag.match(/src=["']([^"']+)["']/i);
      if (m && m[1].startsWith('/') && !m[1].startsWith('//')) queue.push(m[1]);
    });
    while (queue.length && seen.size < 80) {
      const u = queue.shift();
      if (seen.has(u)) continue;
      seen.add(u);
      // eslint-disable-next-line no-await-in-loop
      const r = await httpGet(base + u, 20000);
      if (r.status >= 400 || r.status === 0) {
        const detail = extractViteError(r.body);
        throw new Error(`Error de compilación en ${u.split('?')[0]}: ${detail || 'HTTP ' + r.status}`);
      }
      let m;
      const importRe = /(?:from|import)\s*["'](\/[^"']+)["']/g;
      while ((m = importRe.exec(r.body)) !== null) {
        const dep = m[1];
        if (/^\/(node_modules|@)/.test(dep)) continue;
        if (!seen.has(dep)) queue.push(dep);
      }
    }
  }

  function spawnDevServer(pv, tpl) {
    const env = Object.assign({}, process.env, { NEXT_TELEMETRY_DISABLED: '1', BROWSER: 'none', CI: '1', FORCE_COLOR: '0', NO_COLOR: '1' });
    let args;
    if (pv.templateName === 'next') {
      args = [path.join('node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '-H', '127.0.0.1', '-p', String(pv.port)];
    } else {
      args = [path.join('node_modules', 'vite', 'bin', 'vite.js'), '--config', 'vite.config.mjs', '--host', '127.0.0.1', '--port', String(pv.port), '--strictPort'];
    }
    let file = process.execPath;
    if (typeof opts.devServerCommand === 'function') { // sólo para pruebas: dev server simulado
      const c = opts.devServerCommand(pv);
      file = c.file || file;
      args = c.args || [];
    }
    const child = spawn(file, args, { cwd: pv.dir, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    pv.child = child;
    pv.exited = false;
    child.stdout.on('data', (d) => addLog(pv, d, 'stdout'));
    child.stderr.on('data', (d) => addLog(pv, d, 'stderr'));
    child.on('error', (e) => { addLog(pv, `spawn error: ${e.message}`, 'stderr'); });
    child.on('exit', (code, signal) => {
      if (pv.child !== child) return; // proceso viejo (detener/iniciar): no pisa el estado del nuevo
      pv.exited = true;
      pv.exitInfo = signal ? `señal ${signal}` : `código ${code}`;
      addLog(pv, `[servidor] proceso terminado (${pv.exitInfo}).`, 'system');
      if (pv.status === 'ready') { bumpStatus(pv, 'stopped', 'El servidor de la preview terminó.'); }
    });
    return child;
  }

  async function launch(pv) {
    const gen = pv.gen;
    const gone = () => pv.status === 'stopped' || pv.gen !== gen; // detenida o reemplazada por un inicio nuevo
    try {
      if (pv.dying) { await pv.dying; if (gone()) return; } // el proceso anterior terminó (o se lo mató)
      bumpStatus(pv, 'installing', 'Preparando dependencias… (la primera vez puede tardar varios minutos)');
      const tpl = await ensureTemplate(pv.templateName, pv);
      if (gone()) return;
      if (pv.extras && pv.extras.size) {
        bumpStatus(pv, 'installing', `Instalando dependencias del proyecto: ${Array.from(pv.extras).join(', ')}…`);
        const installed = await ensureExtras(tpl, pv.templateName, pv.extras, pv);
        if (installed.length) addLog(pv, `Instaladas: ${installed.join(', ')}`);
        if (gone()) return;
      }
      pv.installMs = tpl.installMs;
      bumpStatus(pv, 'starting', pv.templateName === 'next' ? 'Levantando Next…' : 'Levantando Vite…');
      const t0 = Date.now();
      writeWorkspace(pv, tpl);
      pv.port = await getFreePort();
      pv.url = `http://127.0.0.1:${pv.port}/`;
      spawnDevServer(pv, tpl);
      const rootRes = await waitUntilReady(pv, gen);
      if (pv.templateName !== 'next') await crawlViteModules(pv, rootRes);
      pv.startMs = Date.now() - t0;
      if (gone()) return;
      bumpStatus(pv, 'ready', 'Vista previa lista.');
      touch(pv);
    } catch (e) {
      if (gone()) return;
      pv.error = e.message || String(e);
      const isDeps = (e && e.code === 'VALIDATION') || /npm install|paquete "/.test(pv.error);
      bumpStatus(pv, 'error', `${isDeps ? 'Error de dependencias' : 'Error de compilación'}: ${pv.error}`);
      addLog(pv, pv.error, 'stderr');
      killProcess(pv);
      // Un preview con error no consume cupo: se libera solo a los 2 min.
      if (pv.ttlTimer) clearTimeout(pv.ttlTimer);
      pv.ttlTimer = setTimeout(() => { stop(pv.id); }, 2 * 60 * 1000);
      if (pv.ttlTimer.unref) pv.ttlTimer.unref();
    } finally {
      if (pv.gen === gen) pv.launching = null;
    }
  }

  function killProcess(pv) {
    if (pv.installChild) killGroup(pv.installChild, 'SIGKILL');
    const child = pv.child;
    if (!child) return;
    killGroup(child, 'SIGTERM');
    const t = setTimeout(() => killGroup(child, 'SIGKILL'), 3000);
    if (t.unref) t.unref();
  }

  function liveCount() {
    let n = 0;
    previews.forEach((pv) => { if (pv.status === 'installing' || pv.status === 'starting' || pv.status === 'ready') n++; });
    return n;
  }

  function evictOldestIfNeeded() {
    while (liveCount() >= maxActive) {
      let oldest = null;
      previews.forEach((pv) => {
        if (pv.status !== 'installing' && pv.status !== 'starting' && pv.status !== 'ready') return;
        if (!oldest || pv.lastTouch < oldest.lastTouch) oldest = pv;
      });
      if (!oldest) return;
      stop(oldest.id);
    }
  }

  /* ---- API pública ---- */

  // Devuelve la vista pública inmediatamente (status 'installing'); usar
  // waitFor(id) para bloquear hasta ready/error.
  function create({ technology, files }) {
    if (closing) throw new ValidationError('El servidor se está cerrando.');
    const v = validateProject(technology, files);
    evictOldestIfNeeded();
    const id = crypto.randomBytes(6).toString('hex');
    const pv = {
      id,
      technology,
      templateName: v.templateName,
      files: v.files,
      extras: v.extras,
      filePaths: new Set(v.files.keys()),
      ignored: v.ignored,
      dir: path.join(previewsRoot, id),
      status: 'installing',
      message: 'Preparando dependencias…',
      logs: [],
      logSeq: 0,
      gen: 0,
      lastTouch: Date.now(),
      expiresAt: Date.now() + ttlMs,
      exited: false,
    };
    previews.set(id, pv);
    touch(pv);
    pv.launching = launch(pv);
    return publicView(pv);
  }

  async function waitFor(id) {
    const pv = previews.get(id);
    if (!pv) return null;
    if (pv.launching) await pv.launching;
    return publicView(pv);
  }

  function status(id) {
    const pv = previews.get(id);
    if (!pv) return null;
    if (pv.status === 'ready' || pv.status === 'installing' || pv.status === 'starting') touch(pv);
    return publicView(pv);
  }

  function stop(id) {
    const pv = previews.get(id);
    if (!pv) return false;
    if (pv.ttlTimer) clearTimeout(pv.ttlTimer);
    if (pv.status !== 'stopped') { bumpStatus(pv, 'stopped', 'Vista previa detenida.'); }
    killProcess(pv);
    const child = pv.child;
    const cleanup = () => {
      fs.rm(pv.dir, { recursive: true, force: true }, () => {});
      previews.delete(id);
    };
    if (child && !pv.exited) {
      child.once('exit', () => setTimeout(cleanup, 200));
      const t = setTimeout(cleanup, 5000);
      if (t.unref) t.unref();
    } else {
      cleanup();
    }
    return true;
  }

  // Logs incrementales del dev server: sólo las líneas con seq > since.
  // Devuelve null si el preview no existe. Leer los logs cuenta como uso
  // (renueva el TTL) mientras el preview está vivo.
  function logs(id, since) {
    const pv = previews.get(id);
    if (!pv) return null;
    if (pv.status === 'ready' || pv.status === 'installing' || pv.status === 'starting') touch(pv);
    const s = Number.isSafeInteger(since) && since > 0 ? since : 0;
    return {
      seq: pv.logSeq,
      lines: pv.logs.filter((l) => l.seq > s).map((l) => ({ seq: l.seq, ts: l.ts, text: l.text, stream: l.stream })),
      status: pv.status,
      message: pv.message,
      port: pv.port || null,
      url: pv.status === 'ready' ? pv.url : null,
    };
  }

  // Detiene SOLO el proceso (dev server / instalación en curso) y conserva el
  // preview (id, archivos, logs) para poder iniciarlo de nuevo. Si nadie lo
  // reinicia, se libera al vencer el TTL.
  function halt(id) {
    const pv = previews.get(id);
    if (!pv) return null;
    if (pv.ttlTimer) clearTimeout(pv.ttlTimer);
    pv.ttlTimer = setTimeout(() => { stop(pv.id); }, ttlMs);
    if (pv.ttlTimer.unref) pv.ttlTimer.unref();
    pv.expiresAt = Date.now() + ttlMs;
    if (pv.status !== 'stopped') {
      const was = pv.status;
      bumpStatus(pv, 'stopped', 'Servidor detenido.');
      addLog(pv, `[servidor] detenido manualmente (estaba ${was}).`, 'system');
    }
    pv.url = null;
    const child = pv.child;
    killProcess(pv);
    pv.installChild = null;
    pv.dying = (child && !pv.exited) ? new Promise((resolve) => {
      const t = setTimeout(resolve, 3500);
      if (t.unref) t.unref();
      child.once('exit', () => { clearTimeout(t); resolve(); });
    }) : null;
    pv.gen += 1; // invalida cualquier launch() en curso
    pv.launching = null;
    return publicView(pv);
  }

  // Vuelve a levantar el MISMO preview (mismo id) con sus archivos actuales.
  // null si el preview ya no existe (el servidor HTTP cae a create()).
  // `input` (opcional) = {technology?, files}: el cliente es la fuente de la
  // verdad de los archivos; se validan igual que en create().
  function start(id, input) {
    const pv = previews.get(id);
    if (!pv) return null;
    if (closing) throw new ValidationError('El servidor se está cerrando.');
    if (pv.status === 'installing' || pv.status === 'starting' || pv.status === 'ready') { touch(pv); return publicView(pv); }
    if (input && input.files && typeof input.files === 'object') {
      const v = validateProject(input.technology || pv.technology, input.files);
      pv.technology = input.technology || pv.technology;
      pv.templateName = v.templateName;
      pv.files = v.files;
      pv.extras = v.extras;
      pv.filePaths = new Set(v.files.keys());
      pv.ignored = v.ignored;
    }
    // 'error' deja un proceso posiblemente vivo: se mata antes de reiniciar.
    if (pv.status === 'error') halt(id);
    evictOldestIfNeeded();
    pv.gen += 1;
    pv.error = null;
    pv.port = 0;
    pv.url = null;
    pv.startMs = 0;
    bumpStatus(pv, 'installing', 'Preparando dependencias…');
    addLog(pv, '[servidor] iniciando…', 'system');
    touch(pv);
    pv.launching = launch(pv);
    return publicView(pv);
  }

  // Detener + iniciar en un paso (mismo id).
  function restart(id, input) {
    const pv = previews.get(id);
    if (!pv) return null;
    halt(id);
    return start(id, input);
  }

  // Escribe un archivo del proyecto vivo (el dev server aplica HMR).
  async function writeFile(id, filePath, content) {
    const pv = previews.get(id);
    if (!pv) return { ok: false, notFound: true };
    if (pv.status !== 'ready' && pv.status !== 'starting' && pv.status !== 'error' && pv.status !== 'stopped') return { ok: false, notFound: true };
    const p = normalizeProjectPath(filePath);
    if (typeof content !== 'string') throw new ValidationError('El contenido debe ser texto.');
    if (!p.includes('/') && RESERVED_ROOT_RE.test(p)) throw new ValidationError(`"${p}" es un archivo de configuración reservado.`);
    const ext = path.posix.extname(p).toLowerCase();
    const allowedExts = BASE_EXTS.concat(pv.templateName === 'next' ? [] : TS_EXTS);
    if (!allowedExts.includes(ext)) throw new ValidationError(`Extensión no permitida en "${p}".`);
    if (Buffer.byteLength(content, 'utf8') > MAX_FILE_BYTES) throw new ValidationError(`"${p}" pesa demasiado.`);
    if (pv.templateName === 'next' && (/(^|\/)(route|middleware|instrumentation)\.[a-z]+$/i.test(p) || /^(src\/)?pages\//.test(p) || /(^|\/)api\//.test(p))) {
      throw new ValidationError(`Next.js: "${p}" no permitido.`);
    }
    const extras = validateFileContent(pv.templateName, p, content);
    if (extras.size) {
      const tplDir = path.join(templatesRoot, pv.templateName);
      await ensureExtras({ dir: tplDir }, pv.templateName, extras, pv);
      extras.forEach((x) => { if (!pv.extras) pv.extras = new Set(); pv.extras.add(x); });
    }
    const abs = path.join(pv.dir, p);
    if (!abs.startsWith(pv.dir + path.sep)) throw new ValidationError('Ruta fuera del proyecto.');
    if (pv.status !== 'stopped') { // detenido: sólo se actualiza el mapa; start() reescribe el workspace entero
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, instrumentForWorkspace(pv.templateName, p, content, nextAppDirOf(pv.files)));
    }
    pv.files.set(p, content);
    pv.filePaths.add(p);
    touch(pv);
    return { ok: true };
  }

  // Mata TODO de forma síncrona (para 'exit' / señales del servidor).
  function killAllSync() {
    closing = true;
    previews.forEach((pv) => {
      if (pv.ttlTimer) clearTimeout(pv.ttlTimer);
      if (pv.installChild) killGroup(pv.installChild, 'SIGKILL');
      if (pv.child) killGroup(pv.child, 'SIGKILL');
    });
    try { fs.rmSync(previewsRoot, { recursive: true, force: true }); } catch (e) { /* no-op */ }
  }

  function list() {
    return Array.from(previews.values()).map(publicView);
  }

  return { create, waitFor, status, stop, halt, start, restart, logs, writeFile, killAllSync, list, templatesRoot, previewsRoot };
}

module.exports = {
  createPreviewRunner, parseFileBlocks, looksLikeFileBlocks, validateProject, validateFileContent, normalizeProjectPath,
  scanImports, ValidationError, ALLOWED_DEPS, TEMPLATE_DEFS, TECH_TO_TEMPLATE,
  INSPECTOR_JS, INSPECTOR_URL, injectViteInspector, injectNextInspector, instrumentForWorkspace,
  CONSOLE_JS, CONSOLE_URL, injectViteConsole, injectNextConsole,
};

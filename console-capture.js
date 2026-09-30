/* Script de captura de la Consola del Estudio (SOLO PREVIEW).
 *
 * Se inyecta como PRIMER elemento de <head> en el HTML que se manda a la
 * preview (app.js → injectConsoleCapture) y en la copia de trabajo de los
 * dev servers (preview-runner.js). Nunca se guarda en el código, el Banco ni
 * lo exportado. Captura console.log/info/warn/error/debug, errores de
 * ventana (incl. fallos de carga de recursos), promesas rechazadas y
 * "latidos" (start / DOMContentLoaded / load / settled) y los postea al padre
 * como { type: 'lpa:console', ... }.
 *
 * Modos:
 *  - 'srcdoc': HTML único dentro del iframe anidado. Postea a '*' (el
 *    receptor, iframe.html, valida event.source; el padre valida el `run`).
 *  - 'origin': dev server en otro origen. Sólo postea al origen del padre,
 *    que se aprende de `lpa:hello` (o location.ancestorOrigins); hasta
 *    entonces los mensajes se guardan en un buffer.
 *
 * La función `lpaConsoleCapture` se serializa con toString() y se colapsa
 * en UNA línea (sin comentarios ni saltos): así, inyectada justo después de
 * <head>, no corre los números de línea del código original.
 *
 * Este archivo es a la vez script clásico del navegador (expone
 * window.LPA_CONSOLE_CAPTURE) y módulo CommonJS. */
(function (root) {
  'use strict';

  /* eslint-disable */
  function lpaConsoleCapture(cfg) {
    if (window.__lpaConsole) return;
    window.__lpaConsole = 1;
    var MAX = 300;
    var LIM = 2048;
    var inst = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    var count = 0;
    var truncated = false;
    var queue = [];
    var target = cfg.mode === 'origin' ? null : '*';
    try {
      var ao = window.location.ancestorOrigins;
      if (cfg.mode === 'origin' && ao && ao[0] && ao[0] !== 'null') target = ao[0];
    } catch (e0) {}

    function clip(s) {
      s = String(s);
      return s.length > LIM ? s.slice(0, LIM) + '… [+' + (s.length - LIM) + ' car.]' : s;
    }
    function isErr(v) {
      return !!v && typeof v === 'object' && (Object.prototype.toString.call(v) === '[object Error]' || (typeof v.message === 'string' && typeof v.stack === 'string'));
    }
    function ser(v) {
      var t = typeof v;
      if (t === 'string') return v;
      if (v === null) return 'null';
      if (t === 'undefined') return 'undefined';
      if (t === 'number' || t === 'boolean') return String(v);
      if (t === 'bigint') return String(v) + 'n';
      if (t === 'symbol') return v.toString();
      if (t === 'function') return '[Function ' + (v.name || 'anónima') + ']';
      if (isErr(v)) return (v.name || 'Error') + ': ' + v.message;
      try { if (v.nodeType === 1) return '<' + v.tagName.toLowerCase() + (v.id ? '#' + v.id : '') + '>'; } catch (e1) {}
      try {
        var path = [];
        var s = JSON.stringify(v, function (k, x) {
          if (x && typeof x === 'object') {
            while (path.length && path[path.length - 1] !== this) path.pop();
            if (isErr(x)) return (x.name || 'Error') + ': ' + x.message;
            if (path.indexOf(x) !== -1) return '[Circular]';
            path.push(x);
            if (typeof Map !== 'undefined' && x instanceof Map) return Array.from(x.entries());
            if (typeof Set !== 'undefined' && x instanceof Set) return Array.from(x);
            return x;
          }
          if (typeof x === 'function') return '[Function]';
          if (typeof x === 'bigint') return String(x) + 'n';
          if (typeof x === 'symbol') return x.toString();
          return x;
        });
        return s === undefined ? String(v) : s;
      } catch (e2) {
        try { return String(v); } catch (e3) { return '[no serializable]'; }
      }
    }
    function parseFrame(line) {
      var m = /(?:\(|@|\s)((?:[a-z][a-z0-9+.\-]*:)?[^\s()@]*?):(\d+):(\d+)\)?\s*$/i.exec(line);
      return m ? { source: m[1], line: +m[2], col: +m[3], raw: line.replace(/^\s+/, '') } : null;
    }
    function frames(stack) {
      var out = [];
      String(stack || '').split('\n').forEach(function (l) {
        var f = parseFrame(l);
        if (f) out.push(f);
      });
      return out;
    }
    function here() {
      try {
        var fr = frames(new Error().stack);
        return { at: fr[2] || null, rest: fr.slice(2).map(function (f) { return f.raw; }).join('\n') };
      } catch (e4) {
        return { at: null, rest: '' };
      }
    }
    function isEmpty() {
      try {
        var b = document.body;
        if (!b) return true;
        if (b.querySelector('img,video,canvas,svg,iframe,picture,object,embed,input,select,textarea')) return false;
        var w = document.createTreeWalker(b, 4, null, false);
        var n;
        while ((n = w.nextNode())) {
          var p = n.parentNode && n.parentNode.nodeName;
          if (p === 'SCRIPT' || p === 'STYLE' || p === 'NOSCRIPT' || p === 'TEMPLATE') continue;
          if (n.nodeValue && n.nodeValue.replace(/\s+/g, '')) return false;
        }
        return true;
      } catch (e5) {
        return false;
      }
    }
    function send(m) {
      m.type = 'lpa:console';
      m.inst = inst;
      m.run = cfg.run || '';
      m.ts = Date.now();
      if (target === null) {
        if (queue.length < MAX + 20) queue.push(m);
        return;
      }
      try { window.parent.postMessage(m, target); } catch (e6) {}
    }
    function emit(level, message, x) {
      if (count >= MAX) {
        if (!truncated) {
          truncated = true;
          send({ level: 'info', kind: 'system', message: 'mensajes truncados (límite de ' + MAX + ')', source: '', line: 0, col: 0, stack: '' });
        }
        return;
      }
      count++;
      var m = { level: level, message: clip(message), source: '', line: 0, col: 0, stack: '' };
      if (x) {
        if (x.source) m.source = String(x.source);
        if (x.line) m.line = x.line;
        if (x.col) m.col = x.col;
        if (x.stack) m.stack = clip(x.stack);
        if (x.kind) m.kind = x.kind;
        if (x.tag) m.tag = x.tag;
      }
      send(m);
    }
    function beat(name) {
      send({ level: 'heartbeat', message: name, empty: isEmpty() });
    }

    ['log', 'info', 'warn', 'error', 'debug'].forEach(function (lv) {
      var orig = window.console && window.console[lv];
      if (typeof orig !== 'function') return;
      window.console[lv] = function () {
        try {
          var parts = [];
          var stack = '';
          for (var i = 0; i < arguments.length; i++) {
            parts.push(ser(arguments[i]));
            if (!stack && isErr(arguments[i]) && arguments[i].stack) stack = String(arguments[i].stack);
          }
          var h = here();
          var at = h.at;
          if (!at && stack) { var sf = frames(stack)[0]; if (sf) at = sf; }
          emit(lv, parts.join(' '), {
            source: at ? at.source : '', line: at ? at.line : 0, col: at ? at.col : 0,
            stack: stack || (lv === 'error' ? h.rest : ''), kind: 'console'
          });
        } catch (e7) {}
        return orig.apply(window.console, arguments);
      };
    });

    window.addEventListener('error', function (ev) {
      try {
        var t = ev.target;
        if (t && t !== window && t.tagName) {
          var url = t.currentSrc || t.src || t.href || '';
          var tag = String(t.tagName).toLowerCase();
          emit('error', 'No se pudo cargar <' + tag + '>' + (url ? ': ' + url : ''), { source: url, kind: 'resource', tag: tag });
          return;
        }
        var er = ev.error;
        var stack = er && er.stack ? String(er.stack) : '';
        var line = ev.lineno || 0;
        var col = ev.colno || 0;
        var src = ev.filename || '';
        if (!line && stack) { var f = frames(stack)[0]; if (f) { src = src || f.source; line = f.line; col = f.col; } }
        emit('error', ev.message || (er && er.message) || 'Error', { source: src, line: line, col: col, stack: stack, kind: 'error' });
      } catch (e8) {}
    }, true);

    window.addEventListener('unhandledrejection', function (ev) {
      try {
        var r = ev.reason;
        var stack = isErr(r) && r.stack ? String(r.stack) : '';
        var f = stack ? frames(stack)[0] : null;
        emit('error', 'Promesa rechazada sin capturar: ' + ser(r), {
          source: f ? f.source : '', line: f ? f.line : 0, col: f ? f.col : 0, stack: stack, kind: 'rejection'
        });
      } catch (e9) {}
    });

    window.addEventListener('message', function (ev) {
      var d = ev.data;
      if (cfg.mode !== 'origin' || ev.source !== window.parent || !d || (d.type !== 'lpa:hello' && d.type !== 'lpa:inspect-toggle')) return;
      if (!ev.origin || ev.origin === 'null') return;
      target = ev.origin;
      var q = queue;
      queue = [];
      q.forEach(send);
    });

    beat('start');
    document.addEventListener('DOMContentLoaded', function () { beat('DOMContentLoaded'); });
    window.addEventListener('load', function () {
      beat('load');
      setTimeout(function () { beat('settled'); }, 800);
    });
  }
  /* eslint-enable */

  // Devuelve el script (en UNA línea, sin etiquetas <script>) listo para
  // inyectar. cfg = { mode: 'srcdoc' | 'origin', run?: string }.
  function buildConsoleCaptureScript(cfg) {
    var c = { mode: cfg && cfg.mode === 'origin' ? 'origin' : 'srcdoc', run: String((cfg && cfg.run) || '').replace(/[^A-Za-z0-9_-]/g, '') };
    var body = lpaConsoleCapture.toString()
      .split('\n')
      .map(function (l) { return l.replace(/^\s+/, ''); })
      .join(' ');
    return '(' + body + ')(' + JSON.stringify(c) + ');';
  }

  var api = { buildConsoleCaptureScript: buildConsoleCaptureScript };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.LPA_CONSOLE_CAPTURE = api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : null));

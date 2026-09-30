/*
 * loaders.js — capa ilustrativa de carga (independiente de app.js).
 * Observa estados de carga existentes en el DOM (clase `status--loading`,
 * o texto de estado en el caso del editor con IA) e inyecta, como HERMANO
 * del elemento observado (nunca como hijo, porque app.js reescribe
 * `textContent` en cada render), un loader con:
 *  - Ilustración SVG de un lápiz "bocetando" un wireframe.
 *  - Barra de progreso que avanza asintóticamente hacia ~95%.
 *  - Microcopy rotativo en español.
 * También muestra una barra fina global arriba de la página mientras
 * cualquiera de los estados observados esté en curso.
 *
 * Si un selector no existe, falla en silencio (no rompe app.js).
 */
(function () {
  'use strict';

  var MICROCOPY = [
    'Bocetando la estructura…',
    'Afinando el copy…',
    'Aplicando restricciones negativas…',
    'Eligiendo la dirección creativa con SSoT…',
    'Ajustando la grilla y el ritmo visual…',
    'Revisando coherencia con el contexto…'
  ];

  var TARGETS = [
    { id: 'prompt-gen-status', expectedMs: 60000, isLoading: byClass, skeleton: 'prompt' },
    // Modo espectáculo (ver DOCUMENTACION.md): el HTML ejecutado ahora pide
    // GSAP/three.js y más contenido (imágenes, SVG, coreografía de
    // movimiento), tarda más en generarse. Ver OPENCODE_HTML_ATTEMPT_TIMEOUT_MS
    // en server.js (240s por intento).
    { id: 'ejecutor-status', expectedMs: 150000, isLoading: byClass, skeleton: 'studio' },
    { id: 'ai-edit-status', expectedMs: 35000, isLoading: byAiEditText }
  ];

  function byClass(el) {
    return el.classList.contains('status--loading');
  }

  function byAiEditText(el) {
    var t = (el.textContent || '');
    return /Aplicando el cambio con IA/i.test(t);
  }

  function svgMarkup() {
    return (
      '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<rect x="4" y="6" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path class="lpa-loader__wire" d="M10 16h18M10 24h14M10 32h10" fill="none"/>' +
      '<g class="lpa-loader__pencil">' +
      '<path class="lpa-loader__pencil" d="M22 40 40 22l4 4-18 18-8 2z"/>' +
      '<path class="lpa-loader__tip" d="M22 40l2-6 4 4z"/>' +
      '</g>' +
      '</svg>'
    );
  }


  // ---- Skeletons (decorativos, aria-hidden) ----
  var PENCIL_SVG =
    '<svg class="lpa-sk__pencil" viewBox="0 0 60 60" fill="none" aria-hidden="true" focusable="false">' +
    '<path d="M8 52 44 16l8 8-36 36-12 4z" fill="var(--surface)" stroke="currentColor" stroke-width="2.5"/>' +
    '<path d="M8 52l3-11 8 8z" fill="var(--rosa)" stroke="currentColor" stroke-width="2"/></svg>';
  var BAR_HTML =
    '<div class="lpa-sk__bar-dots"><span></span><span></span><span></span></div>';

  function docArt() {
    var g = '';
    for (var i = 0; i < 5; i++) {
      var y = 12 + i * 32;
      g += '<path class="lpa-sk__h lpa-sk__g' + i + '" pathLength="1" d="M14 ' + y + 'h' + (70 + (i % 3) * 14) + '"/>' +
        '<path class="lpa-sk__l lpa-sk__g' + i + '" pathLength="1" d="M14 ' + (y + 11) + 'h220M14 ' + (y + 21) + 'h' + (150 + (i % 2) * 40) + '"/>';
    }
    return '<div class="lpa-sk__stage" aria-hidden="true"><div class="lpa-sk__mock lpa-sk__mock--doc">' + BAR_HTML +
      '<div class="lpa-sk__canvas"><svg class="lpa-sk__wire" viewBox="0 0 260 170" fill="none" focusable="false">' + g + '</svg>' +
      PENCIL_SVG + '<span class="lpa-sk__shimmer"></span></div></div></div>';
  }

  function studioArt() {
    var cross = '<svg viewBox="0 0 40 30" preserveAspectRatio="none" fill="none" focusable="false"><path d="M0 0l40 30M40 0L0 30" stroke="currentColor" stroke-width="1.5"/></svg>';
    return '<div class="lpa-sk__stage" aria-hidden="true"><div class="lpa-sk__mock lpa-sk__mock--studio">' + BAR_HTML +
      '<div class="lpa-st-page">' +
      '<div class="lpa-st-hero"><i></i><i></i><i></i></div>' +
      '<div class="lpa-st-row">' +
      '<div class="lpa-st-img lpa-st-img--a">' + cross + '</div>' +
      '<div class="lpa-st-img lpa-st-img--b">' + cross + '</div>' +
      '<div class="lpa-st-cta"><span></span></div></div>' +
      '<div class="lpa-st-stick"><b class="lpa-st-slug lpa-st-slug--1"></b><b class="lpa-st-slug lpa-st-slug--2"></b><b class="lpa-st-slug lpa-st-slug--3"></b></div>' +
      '<span class="lpa-st-roller"></span>' + PENCIL_SVG +
      '</div></div></div>';
  }

  var SKELETONS = {
    prompt: {
      art: docArt,
      hint: 'El prompt de 16 bloques se va a escribir acá.',
      host: function () {
        var ta = document.getElementById('prompt-textarea');
        return ta && ta.parentNode ? ta.parentNode : null;
      },
      isIdle: function () {
        var ta = document.getElementById('prompt-textarea');
        return !!ta && !String(ta.value || '').trim();
      },
      place: function (el) {
        var ta = document.getElementById('prompt-textarea');
        if (!ta) return;
        el.style.top = ta.offsetTop + 'px';
        el.style.height = ta.offsetHeight ? ta.offsetHeight + 'px' : '';
      }
    },
    studio: {
      art: studioArt,
      hint: 'Ejecutá un prompt y tu landing se arma acá.',
      host: function () { return document.getElementById('preview-wrap'); },
      isIdle: function () {
        var f = document.getElementById('preview-frame');
        var pf = document.getElementById('preview-project-frame');
        var htmlOn = f && !f.hidden && f.getAttribute('src');
        var projSrc = pf && !pf.hidden && pf.getAttribute('src');
        return !(htmlOn || (projSrc && projSrc !== 'about:blank'));
      }
    }
  };

  function createSkeleton(key) {
    var spec = SKELETONS[key];
    if (!spec) return null;
    var host = spec.host();
    if (!host) return null;
    var el = document.createElement('div');
    el.className = 'lpa-sk lpa-sk--' + key;
    el.setAttribute('data-lpa-skeleton', key);
    el.hidden = true;
    el.innerHTML = spec.art() +
      '<div class="lpa-sk__cap">' +
      '<p class="lpa-sk__copy"></p>' +
      '<div class="lpa-sk__progress" aria-hidden="true"><div class="lpa-sk__progress-fill"></div></div>' +
      '</div>';
    host.appendChild(el);
    var cap = el.querySelector('.lpa-sk__cap');
    var copy = el.querySelector('.lpa-sk__copy');
    var fill = el.querySelector('.lpa-sk__progress-fill');
    var sk = { el: el, loading: false, key: key };

    sk.refresh = function () {
      // Streaming: si ya se muestra una vista previa parcial real (host con
      // data-streaming), el skeleton no tapa el contenido: pasa a una barra
      // fina de progreso abajo (modo 'streaming').
      var streaming = sk.loading && host.getAttribute('data-streaming') === 'true';
      var mode = streaming ? 'streaming' : (sk.loading ? 'loading' : (spec.isIdle() ? 'idle' : 'off'));
      if (mode === 'off') { el.hidden = true; el.removeAttribute('data-mode'); return; }
      el.hidden = false;
      el.setAttribute('data-mode', mode);
      cap.setAttribute('aria-hidden', mode === 'loading' ? 'true' : 'false');
      if (mode === 'idle') { copy.textContent = spec.hint; fill.style.width = '0%'; }
      if (spec.place) spec.place(el);
    };
    sk.setCopy = function (t) { if (sk.loading) copy.textContent = t; };
    sk.setPct = function (v) { fill.style.width = v + '%'; };
    sk.setLoading = function (v) { sk.loading = !!v; sk.refresh(); };

    // Cambios de contenido que no pasan por clases de carga.
    try {
      var mo = new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          if (!el.contains(recs[i].target)) { sk.refresh(); return; }
        }
      });
      mo.observe(host, { attributes: true, attributeFilter: ['src', 'hidden', 'data-streaming'], subtree: true });
    } catch (e) { /* silencioso */ }
    var ta = key === 'prompt' ? document.getElementById('prompt-textarea') : null;
    if (ta) ta.addEventListener('input', sk.refresh);
    window.setInterval(sk.refresh, 1000);
    sk.refresh();
    return sk;
  }

  function buildLoader(id) {
    var wrap = document.createElement('div');
    wrap.className = 'lpa-loader';
    wrap.setAttribute('data-lpa-loader-for', id);
    wrap.hidden = true;
    wrap.innerHTML =
      '<span class="lpa-loader__svg">' + svgMarkup() + '</span>' +
      '<div class="lpa-loader__body">' +
      '<p class="lpa-loader__copy"></p>' +
      '<div class="lpa-loader__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<div class="lpa-loader__bar-fill"></div>' +
      '</div>' +
      '</div>';
    return wrap;
  }

  function asymptoticPct(elapsedMs, expectedMs) {
    var tau = expectedMs / 3;
    var pct = 95 * (1 - Math.exp(-elapsedMs / tau));
    return Math.min(95, Math.max(0, pct));
  }

  function setupTarget(target) {
    var el = document.getElementById(target.id);
    if (!el || !el.parentNode) return null;

    var loader = buildLoader(target.id);
    el.parentNode.insertBefore(loader, el.nextSibling);
    var skel = null;
    try { skel = target.skeleton ? createSkeleton(target.skeleton) : null; } catch (e) { skel = null; }
    // Con skeleton, el loader clásico queda sólo para lectores de pantalla.
    if (skel) loader.classList.add('lpa-loader--merged');

    var barFill = loader.querySelector('.lpa-loader__bar-fill');
    var bar = loader.querySelector('.lpa-loader__bar');
    var copy = loader.querySelector('.lpa-loader__copy');

    var state = {
      active: false,
      startedAt: 0,
      tickTimer: null,
      copyTimer: null,
      copyIndex: 0
    };

    function setPct(pct) {
      var v = Math.round(pct);
      barFill.style.width = v + '%';
      if (skel) skel.setPct(v);
      bar.setAttribute('aria-valuenow', String(v));
    }

    function rotateCopy() {
      copy.textContent = MICROCOPY[state.copyIndex % MICROCOPY.length];
      if (skel) skel.setCopy(copy.textContent);
      state.copyIndex += 1;
    }

    function start() {
      if (state.active) return;
      state.active = true;
      state.startedAt = Date.now();
      state.copyIndex = 0;
      loader.hidden = false;
      if (skel) skel.setLoading(true);
      setPct(0);
      rotateCopy();
      notifyGlobal(target.id, true);

      state.tickTimer = window.setInterval(function () {
        var elapsed = Date.now() - state.startedAt;
        setPct(asymptoticPct(elapsed, target.expectedMs));
      }, 300);

      state.copyTimer = window.setInterval(rotateCopy, 3500);
    }

    function stop() {
      if (!state.active) return;
      state.active = false;
      if (state.tickTimer) window.clearInterval(state.tickTimer);
      if (state.copyTimer) window.clearInterval(state.copyTimer);
      setPct(100);
      if (skel) skel.setLoading(false);
      notifyGlobal(target.id, false);
      window.setTimeout(function () {
        loader.hidden = true;
        setPct(0);
      }, 500);
    }

    function check() {
      try {
        if (target.isLoading(el)) start();
        else stop();
      } catch (e) { /* silencioso */ }
    }

    var observer = new MutationObserver(check);
    observer.observe(el, { attributes: true, attributeFilter: ['class'], childList: true, characterData: true, subtree: true });

    check();
    return { check: check };
  }

  // ---- Barra global fina (operaciones OpenCode) ----
  var globalActive = Object.create(null);
  var topbarEl = null;
  var topbarFill = null;
  var topbarTimer = null;
  var topbarStartedAt = 0;

  function ensureTopbar() {
    if (topbarEl) return;
    topbarEl = document.createElement('div');
    topbarEl.className = 'lpa-topbar';
    topbarEl.hidden = true;
    topbarEl.setAttribute('role', 'progressbar');
    topbarEl.setAttribute('aria-valuemin', '0');
    topbarEl.setAttribute('aria-valuemax', '100');
    topbarEl.setAttribute('aria-valuenow', '0');
    topbarEl.setAttribute('aria-label', 'Progreso de operación en curso');
    topbarFill = document.createElement('div');
    topbarFill.className = 'lpa-topbar__fill';
    topbarEl.appendChild(topbarFill);
    document.body.appendChild(topbarEl);
  }

  function anyActive() {
    for (var k in globalActive) { if (globalActive[k]) return true; }
    return false;
  }

  function notifyGlobal(id, isActive) {
    try {
      ensureTopbar();
      globalActive[id] = isActive;
      if (anyActive()) {
        if (!topbarStartedAt) topbarStartedAt = Date.now();
        topbarEl.hidden = false;
        topbarFill.style.opacity = '1';
        if (!topbarTimer) {
          topbarTimer = window.setInterval(function () {
            var elapsed = Date.now() - topbarStartedAt;
            var pct = asymptoticPct(elapsed, 60000);
            topbarFill.style.width = pct + '%';
            topbarEl.setAttribute('aria-valuenow', String(Math.round(pct)));
          }, 300);
        }
      } else {
        topbarFill.style.width = '100%';
        topbarEl.setAttribute('aria-valuenow', '100');
        window.setTimeout(function () {
          if (anyActive()) return;
          topbarFill.style.opacity = '0';
          if (topbarTimer) { window.clearInterval(topbarTimer); topbarTimer = null; }
          topbarStartedAt = 0;
          window.setTimeout(function () {
            if (!anyActive()) {
              topbarEl.hidden = true;
              topbarFill.style.width = '0%';
            }
          }, 250);
        }, 300);
      }
    } catch (e) { /* silencioso */ }
  }

  function init() {
    try {
      TARGETS.forEach(setupTarget);
    } catch (e) { /* silencioso: no romper app.js */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

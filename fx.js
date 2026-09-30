/*
 * fx.js — capa decorativa independiente de app.js (rediseño artístico SSoT v2).
 * - Tilt 3D sutil del héroe (#hero3d-mock) siguiendo el mouse.
 * - Fallback de "scroll-driven animation" para .squiggle en navegadores sin
 *   soporte de `animation-timeline: view()` (usa IntersectionObserver).
 * Si un selector no existe, falla en silencio (no rompe app.js).
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function initTilt() {
    if (reduceMotion || isCoarsePointer) return;
    var mock = document.getElementById('hero3d-mock');
    if (!mock) return;
    var wrap = mock.closest('.hero3d') || mock.parentElement;
    if (!wrap) return;

    function onMove(e) {
      var rect = wrap.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      var tiltY = (px - 0.5) * 28;
      var tiltX = (0.5 - py) * 20 + 6;
      mock.style.setProperty('--tiltX', tiltX.toFixed(2) + 'deg');
      mock.style.setProperty('--tiltY', tiltY.toFixed(2) + 'deg');
    }

    function onLeave() {
      mock.style.setProperty('--tiltX', '8deg');
      mock.style.setProperty('--tiltY', '-14deg');
    }

    wrap.addEventListener('mousemove', onMove);
    wrap.addEventListener('mouseleave', onLeave);
  }

  function supportsScrollTimeline() {
    return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline', 'view()');
  }

  function initSquiggleFallback() {
    if (supportsScrollTimeline()) return;
    var items = document.querySelectorAll('.squiggle');
    if (!items.length) return;

    if (reduceMotion || typeof IntersectionObserver === 'undefined') {
      items.forEach(function (el) { el.classList.add('is-inview'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    items.forEach(function (el) { observer.observe(el); });
  }

  function init() {
    try { initTilt(); } catch (e) { /* silencioso */ }
    try { initSquiggleFallback(); } catch (e) { /* silencioso */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* common-inline.js
 * No Concurrent File Load (sequential): CSS -> Fonts -> JS -> Favicon
 *
 * Per-page globals (define BEFORE this runs):
 *   var requiredFonts = [{ url, family, weight, style, display?, format? }, ...];
 *   var requiredCSS   = [{ url }, ...];
 *   var requiredJS    = [{ url }, ...];
 *   var contentItems  = ['.selector', ...];
 *
 * Optional:
 *   window.initializeApp()
 */

(function () {
  'use strict';

  // ----------------------------
  // Defaults (if page forgets)
  // ----------------------------
  if (!Array.isArray(window.requiredFonts)) window.requiredFonts = [];
  if (!Array.isArray(window.requiredCSS)) window.requiredCSS = [];
  if (!Array.isArray(window.requiredJS)) window.requiredJS = [];
  if (!Array.isArray(window.contentItems)) window.contentItems = [];

  // ----------------------------
  // UI helpers
  // ----------------------------
  function showSpinner() {
    var spinner = document.getElementById('spinner');
    if (spinner) spinner.style.display = 'inline-block';
  }

  function hideSpinner() {
    var spinner = document.getElementById('spinner');
    if (spinner) spinner.style.display = 'none';
  }

  function disableContent() {
    window.contentItems.forEach(function (selector) {
      var el = document.querySelector(selector);
      if (el) el.classList.add('content-disabled');
    });
  }

  function enableContent() {
    window.contentItems.forEach(function (selector) {
      var el = document.querySelector(selector);
      if (el) {
        el.classList.remove('content-disabled');
        el.classList.remove('content-hidden');
        }
    });
  }

  function showCriticalError(message, fileUrl) {
    hideSpinner(); // keep content disabled

    var text = '❌ ' + message + (fileUrl ? (' (' + fileUrl + ')') : '') + ' Please reload.';

    var host = document.querySelector('.header-actions') || document.body;

    var existing = document.getElementById('critical-error-inline');
    if (existing) {
      existing.textContent = text;
      return;
    }

    var span = document.createElement('span');
    span.id = 'critical-error-inline';
    span.textContent = text;
    span.style.cssText =
      'color:#e74c3c;font-weight:bold;font-size:14px;margin-right:25px;';

    if (host.firstChild) host.insertBefore(span, host.firstChild);
    else host.appendChild(span);
  }

  // Optional exports
  window.showSpinner = showSpinner;
  window.hideSpinner = hideSpinner;
  window.disableContent = disableContent;
  window.enableContent = enableContent;
  window.showCriticalError = showCriticalError;

  // ----------------------------
  // Favicon stage (best-effort, last)
  // ----------------------------

  function ensurePlaceholderFaviconLink() {
    var link = document.getElementById('app-favicon');
    if (!link) {
      link = document.createElement('link');
      link.id = 'app-favicon';
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (!link.href) link.href = 'data:,';
    return link;
  }

  function setFaviconHref(url) {
    var link = ensurePlaceholderFaviconLink();
    link.href = url;
  }

  // Best-effort: if favicon.ico exists next to the HTML file, set it.
  // Do nothing on any failure.
  function tryLoadFaviconLast() {
    ensurePlaceholderFaviconLink();

    var url = 'favicon.ico';

    // Use HEAD probe to avoid downloading it; fallback to GET if HEAD fails.
    return fetch(url, { method: 'HEAD', cache: 'no-store' })
      .then(function (r) {
        if (r && r.ok) setFaviconHref(url);
      })
      .catch(function () {
        return fetch(url, { method: 'GET', cache: 'no-store' })
          .then(function (r) {
            if (r && r.ok) setFaviconHref(url);
          })
          .catch(function () { /* ignore */ });
      });
  }

  // ----------------------------
  // Sequential loaders
  // ----------------------------

  function loadCSSSequential(list) {
    if (!list.length) return Promise.resolve();

    var i = 0;

    function next() {
      if (i >= list.length) return Promise.resolve();

      var item = list[i++];
      var url = item && item.url;

      if (!url) {
        return Promise.reject({ stage: 'css', url: null, error: new Error('Invalid CSS spec') });
      }

      return new Promise(function (resolve, reject) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;

        link.onload = function () { resolve(); };
        link.onerror = function () { reject(new Error('CSS load error')); };

        document.head.appendChild(link);
      }).then(next).catch(function (e) {
        return Promise.reject({ stage: 'css', url: url, error: e });
      });
    }

    return next();
  }

  function loadFontsSequential(list) {
    if (!list.length) return Promise.resolve();

    if (!('FontFace' in window) || !document.fonts) {
      // Non-fatal: allow fallback fonts
      return Promise.resolve();
    }

    var i = 0;

    function next() {
      if (i >= list.length) return Promise.resolve();

      var f = list[i++];
      if (!f || !f.url || !f.family) {
        return Promise.reject({ stage: 'font', url: (f && f.url) || null, error: new Error('Invalid font spec') });
      }

      var descriptors = {
        weight: f.weight || 'normal',
        style: f.style || 'normal'
      };
      if (f.display) descriptors.display = f.display;

      var face = new FontFace(
        f.family,
        "url('" + f.url + "')" + (f.format ? (" format('" + f.format + "')") : ''),
        descriptors
      );

      return face.load().then(function (loaded) {
        document.fonts.add(loaded);
        return next();
      }).catch(function (e) {
        return Promise.reject({ stage: 'font', url: f.url, error: e });
      });
    }

    return next();
  }

  function loadJSSequential(list) {
    if (!list.length) return Promise.resolve();

    var i = 0;

    function next() {
      if (i >= list.length) return Promise.resolve();

      var item = list[i++];
      var url = item && item.url;

      if (!url) {
        return Promise.reject({ stage: 'js', url: null, error: new Error('Invalid JS spec') });
      }

      return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = url;

        var hadErrorForThisScript = false;

        function onWindowError(event) {
          if (event && event.filename && event.filename.indexOf(url) !== -1) {
            hadErrorForThisScript = true;
          }
        }

        window.addEventListener('error', onWindowError);

        script.onload = function () {
          setTimeout(function () {
            window.removeEventListener('error', onWindowError);
            if (hadErrorForThisScript) reject(new Error('JS syntax/runtime error'));
            else resolve();
          }, 50);
        };

        script.onerror = function () {
          window.removeEventListener('error', onWindowError);
          reject(new Error('JS network error'));
        };

        document.head.appendChild(script);
      }).then(next).catch(function (e) {
        return Promise.reject({ stage: 'js', url: url, error: e });
      });
    }

    return next();
  }

  // ----------------------------
  // Orchestrator + boot
  // ----------------------------

  function loadAllSequentially() {
    // Favicon is last and best-effort: never fails the pipeline.
    return loadCSSSequential(window.requiredCSS)
      .then(function () { return loadFontsSequential(window.requiredFonts); })
      .then(function () { return loadJSSequential(window.requiredJS); })
      .then(function () { return tryLoadFaviconLast().catch(function () { /* ignore */ }); });
  }

  function startPageLoad() {
    showSpinner();
    disableContent();

    loadAllSequentially()
      .then(function () {
        hideSpinner();
        enableContent();

        if (typeof window.initializeApp === 'function') {
          window.initializeApp();
        }
      })
      .catch(function (info) {
        var stage = (info && info.stage) ? info.stage : 'unknown';
        var url = (info && info.url) ? info.url : null;

        showCriticalError('Failed to load local ' + stage + ' resource.', url);
        console.error('Critical load failure:', info);
      });
  }

  if (window.jQuery && typeof window.jQuery === 'function') {
    jQuery(document).ready(function () {
      setTimeout(startPageLoad, 25);
    });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(startPageLoad, 25);
    });
  }
})();

/* MG Barcelona Live - Ventana automática de Fotos de Eventos (5s) debajo del título */
(function () {
  function getActiveTemplate() {
    var m = document.querySelector('meta[name="mg-template"]');
    if (m && m.getAttribute('content')) {
      return m.getAttribute('content').trim().toLowerCase();
    }
    var p = (location.pathname || '').match(/plantillas\/([a-z0-9_-]+)\.html/i);
    return p ? p[1].toLowerCase() : 'principal';
  }

  function injectStyles() {
    if (document.getElementById('mg-evfotos-style')) return;
    var st = document.createElement('style');
    st.id = 'mg-evfotos-style';
    st.textContent = [
      '.mg-evw-box{position:relative;width:100%;max-width:680px;height:320px;margin:18px auto 14px;border-radius:16px;overflow:hidden;background:rgba(12,8,24,0.82);border:1px solid rgba(255,255,255,0.16);box-shadow:0 14px 40px rgba(0,0,0,0.48);backdrop-filter:blur(10px);z-index:5;}',
      '.mg-evw-img{width:100%;height:100%;object-fit:cover;display:block;transition:opacity .45s ease;cursor:pointer;}',
      '.mg-evw-top{position:absolute;top:10px;left:12px;right:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;pointer-events:none;}',
      '.mg-evw-badge{pointer-events:auto;background:rgba(10,7,20,0.72);border:1px solid rgba(255,255,255,0.18);color:#f5c842;font-size:11px;font-weight:700;letter-spacing:.6px;padding:4px 10px;border-radius:999px;text-transform:uppercase;}',
      '.mg-evw-big{pointer-events:auto;background:rgba(142,45,226,0.82);border:1px solid #b44fff;color:#fff;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35);}',
      '.mg-evw-big:hover{background:#b44fff;}',
      '.mg-evw-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(10,7,20,0.58);color:#fff;border:1px solid rgba(255,255,255,0.22);border-radius:50%;width:34px;height:34px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
      '.mg-evw-nav:hover{background:rgba(180,79,255,0.75);}',
      '.mg-evw-prev{left:10px;} .mg-evw-next{right:10px;}',
      '.mg-evw-bot{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 10px;background:linear-gradient(transparent,rgba(7,5,15,0.92));display:flex;align-items:flex-end;justify-content:space-between;gap:10px;color:#fff;}',
      '.mg-evw-club{font-size:11px;color:#00f0ff;font-weight:700;text-transform:uppercase;letter-spacing:.8px;}',
      '.mg-evw-tit{font-size:14px;font-weight:700;color:#f3ecff;}',
      '.mg-evw-cnt{font-size:11px;color:rgba(255,255,255,0.72);font-weight:700;flex-shrink:0;}',
      '.mg-evf-lb{position:fixed;inset:0;z-index:9999;background:rgba(5,3,12,0.94);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;flex-direction:column;padding:20px;}',
      '.mg-evf-lb.open{display:flex;}',
      '.mg-evf-lb img{max-width:94vw;max-height:80vh;border-radius:12px;border:1px solid rgba(255,255,255,0.18);box-shadow:0 20px 60px rgba(0,0,0,0.75);}',
      '.mg-evf-lb-txt{margin-top:12px;color:#f3ecff;font-size:.95rem;text-align:center;}',
      '.mg-evf-lb-btn{position:fixed;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.22);border-radius:50%;width:44px;height:44px;font-size:22px;cursor:pointer;}',
      '.mg-evf-lb-prev{left:18px;} .mg-evf-lb-next{right:18px;}',
      '.mg-evf-lb-close{position:fixed;top:18px;right:22px;background:rgba(255,45,120,0.28);color:#fff;border:1px solid #ff2d78;border-radius:999px;padding:6px 14px;font-weight:700;cursor:pointer;}',
      '@media(max-width:640px){.mg-evw-box{height:230px;margin:14px auto 12px;}}'
    ].join('');
    document.head.appendChild(st);
  }

  function ensureLightbox(photos) {
    var lb = document.getElementById('mg-evf-lb');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'mg-evf-lb';
      lb.className = 'mg-evf-lb';
      lb.innerHTML = [
        '<button class="mg-evf-lb-close" id="mg-evf-close">✕ Cerrar</button>',
        '<button class="mg-evf-lb-btn mg-evf-lb-prev" id="mg-evf-prev">‹</button>',
        '<img id="mg-evf-lb-img" src="" alt="">',
        '<div class="mg-evf-lb-txt" id="mg-evf-lb-txt"></div>',
        '<button class="mg-evf-lb-btn mg-evf-lb-next" id="mg-evf-next">›</button>'
      ].join('');
      document.body.appendChild(lb);
      lb.addEventListener('click', function (e) {
        if (e.target === lb) lb.classList.remove('open');
      });
      document.getElementById('mg-evf-close').onclick = function () { lb.classList.remove('open'); };
      document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') lb.classList.remove('open');
        if (e.key === 'ArrowLeft') document.getElementById('mg-evf-prev').click();
        if (e.key === 'ArrowRight') document.getElementById('mg-evf-next').click();
      });
    }
    var idx = 0;
    function show(i) {
      if (!photos.length) return;
      idx = (i + photos.length) % photos.length;
      var p = photos[idx];
      document.getElementById('mg-evf-lb-img').src = p.archivo;
      document.getElementById('mg-evf-lb-txt').textContent = (p.club ? p.club + ' · ' : '') + (p.titulo || '');
      lb.classList.add('open');
    }
    document.getElementById('mg-evf-prev').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    document.getElementById('mg-evf-next').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    return show;
  }

  var rendering = false;

  async function render() {
    var tpl = getActiveTemplate();
    var existingAll = document.querySelectorAll('#mg-evf-section');
    if (existingAll.length === 1 && existingAll[0].getAttribute('data-tpl') === tpl) return;
    if (rendering) return;
    rendering = true;
    if (window.__mgEvwTimer) {
      clearInterval(window.__mgEvwTimer);
      window.__mgEvwTimer = null;
    }

    try {
      var r = await fetch('eventos_fotos.json?_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      var data = await r.json();
      var byTpl = (data && data.por_plantilla) || {};
      var photos = Array.isArray(byTpl[tpl]) && byTpl[tpl].length
        ? byTpl[tpl]
        : (Array.isArray(data && data.fotos) ? data.fotos : []);
      if (!photos.length) return;

      document.querySelectorAll('#mg-evf-section').forEach(function (el) { el.remove(); });
      injectStyles();
      var box = document.createElement('div');
      box.id = 'mg-evf-section';
      box.setAttribute('data-tpl', tpl);
      box.className = 'mg-evw-box';
      box.innerHTML = [
        '<img class="mg-evw-img" id="mg-evw-img" src="" alt="Evento">',
        '<div class="mg-evw-top">',
        '  <span class="mg-evw-badge">📸 Eventos Clubs</span>',
        '  <button class="mg-evw-big" id="mg-evw-big" type="button">⛶ Ver en grande</button>',
        '</div>',
        '<button class="mg-evw-nav mg-evw-prev" id="mg-evw-prev" type="button">‹</button>',
        '<button class="mg-evw-nav mg-evw-next" id="mg-evw-next" type="button">›</button>',
        '<div class="mg-evw-bot">',
        '  <div><div class="mg-evw-club" id="mg-evw-club"></div><div class="mg-evw-tit" id="mg-evw-tit"></div></div>',
        '  <div class="mg-evw-cnt" id="mg-evw-cnt"></div>',
        '</div>'
      ].join('');

      var anchor = document.querySelector('.hero-sub') || document.querySelector('h1.hero-title') || document.querySelector('h1');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(box, anchor.nextSibling);
      } else {
        document.body.insertBefore(box, document.body.firstChild);
      }

      var openLb = ensureLightbox(photos);
      var imgEl = document.getElementById('mg-evw-img');
      var clubEl = document.getElementById('mg-evw-club');
      var titEl = document.getElementById('mg-evw-tit');
      var cntEl = document.getElementById('mg-evw-cnt');
      var cur = 0;

      function showSlide(i) {
        cur = (i + photos.length) % photos.length;
        var p = photos[cur];
        imgEl.style.opacity = '0.25';
        setTimeout(function () {
          imgEl.src = p.archivo;
          clubEl.textContent = p.club || '';
          titEl.textContent = p.titulo || '';
          cntEl.textContent = (cur + 1) + ' / ' + photos.length;
          imgEl.style.opacity = '1';
        }, 120);
      }

      showSlide(0);
      if (photos.length > 1) {
        window.__mgEvwTimer = setInterval(function () { showSlide(cur + 1); }, 5000);
      }

      document.getElementById('mg-evw-prev').onclick = function (e) { e.stopPropagation(); showSlide(cur - 1); };
      document.getElementById('mg-evw-next').onclick = function (e) { e.stopPropagation(); showSlide(cur + 1); };
      document.getElementById('mg-evw-big').onclick = function (e) { e.stopPropagation(); openLb(cur); };
      imgEl.onclick = function () { openLb(cur); };
    } catch (e) {}
    finally { rendering = false; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

  if (!window.__mgEvfObserver && typeof MutationObserver !== 'undefined') {
    window.__mgEvfObserver = new MutationObserver(function () {
      var tpl = getActiveTemplate();
      var sec = document.getElementById('mg-evf-section');
      if (!sec || sec.getAttribute('data-tpl') !== tpl) {
        render();
      }
    });
    window.__mgEvfObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

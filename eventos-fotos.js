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
      '.mg-evw-box{position:relative;width:100%;max-width:1440px;height:580px;margin:22px auto 14px;border-radius:22px;overflow:hidden;background:rgba(12,8,24,0.85);border:2px solid rgba(0,240,255,0.45);box-shadow:0 18px 50px rgba(0,0,0,0.6);backdrop-filter:blur(12px);z-index:5;box-sizing:border-box;}',
      '.mg-evw-img{width:100%;height:100%;object-fit:contain;object-position:center;background:#000;display:block;transition:opacity .45s ease;cursor:pointer;}',
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
      '@media(max-width:768px){.mg-evw-box{height:clamp(230px,58vw,320px);margin:12px auto 10px;border-radius:16px;}}'
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
    // Si la página ya tiene la ventana oficial "FOTOGRAFÍA - MOISÉS GALLARDO", no inyectar galería suelta arriba
    if (document.getElementById('fotografia-mg') && !document.getElementById('mg-evf-wrapped')) {
      document.querySelectorAll('#mg-evf-section').forEach(function (el) { el.remove(); });
      return;
    }
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

      document.querySelectorAll('#mg-evf-section, #mg-evf-wrapped').forEach(function (el) { el.remove(); });
      injectStyles();
      var wrap = document.createElement('section');
      wrap.id = 'mg-evf-wrapped';
      wrap.style.cssText = 'position:relative;z-index:2;padding:3rem 1.2rem;max-width:1320px;margin:0 auto;text-align:center;';
      wrap.innerHTML =
        '<p class="section-label" style="text-align:center;margin-bottom:0.5rem;">📸 Galería Visual</p>' +
        '<h2 class="section-title" style="text-align:center;margin-bottom:0.6rem;">Fotografías · Moisés Gallardo</h2>' +
        '<p style="text-align:center;color:rgba(255,255,255,0.65);margin:0 auto 1.5rem;font-size:0.95rem;">Contenido para mayores de 18 años.</p>';

      var box = document.createElement('div');
      box.id = 'mg-evf-section';
      box.setAttribute('data-tpl', tpl);
      box.className = 'mg-evw-box';
      box.innerHTML = [
        '<img class="mg-evw-img" id="mg-evw-img" src="" alt="Evento">',
        '<div class="mg-evw-top">',
        '  <span class="mg-evw-badge">📸 Fotógrafo: Moisés Gallardo</span>',
        '  <button class="mg-evw-big" id="mg-evw-big" type="button">⛶ Ver en grande</button>',
        '</div>',
        '<button class="mg-evw-nav mg-evw-prev" id="mg-evw-prev" type="button">‹</button>',
        '<button class="mg-evw-nav mg-evw-next" id="mg-evw-next" type="button">›</button>',
        '<div class="mg-evw-bot">',
        '  <div><div class="mg-evw-club" id="mg-evw-club"></div><div class="mg-evw-tit" id="mg-evw-tit"></div></div>',
        '  <div class="mg-evw-cnt" id="mg-evw-cnt"></div>',
        '</div>'
      ].join('');
      wrap.appendChild(box);
      var legalNote = document.createElement('p');
      legalNote.style.cssText = 'text-align:center;color:rgba(255,255,255,0.6);max-width:720px;margin:1rem auto 0;font-size:0.88rem;line-height:1.5;';
      legalNote.textContent = 'Fotografías (c) Moisés Gallardo. Prohibida su reproducción sin permiso. Para solicitar la retirada de una fotografía, escríbenos a mgbarcelonalive@gmail.com.';
      wrap.appendChild(legalNote);

      var target = document.querySelector('#videos') || document.querySelector('#events') || document.querySelector('#sponsors') || document.querySelector('footer');
      if (target && target.parentNode) {
        target.parentNode.insertBefore(wrap, target);
      } else {
        document.body.appendChild(wrap);
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
      if (document.getElementById('fotografia-mg') && !document.getElementById('mg-evf-wrapped')) {
        return;
      }
      var tpl = getActiveTemplate();
      var sec = document.getElementById('mg-evf-section');
      if (!sec || sec.getAttribute('data-tpl') !== tpl) {
        render();
      }
    });
    window.__mgEvfObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
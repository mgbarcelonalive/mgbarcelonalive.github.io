/* MG Barcelona Live - Galería automática de Fotos de Eventos por Plantilla */
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
      '.mg-evf-wrap{max-width:1160px;margin:36px auto 12px;padding:0 16px;}',
      '.mg-evf-head{text-align:center;margin-bottom:20px;}',
      '.mg-evf-kicker{font-size:.78rem;letter-spacing:2px;text-transform:uppercase;color:#ff2d78;font-weight:700;margin-bottom:6px;}',
      '.mg-evf-title{font-size:clamp(1.35rem,2.6vw,1.9rem);font-weight:800;color:#fff;margin:0;}',
      '.mg-evf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}',
      '.mg-evf-card{position:relative;border-radius:14px;overflow:hidden;background:rgba(16,11,30,0.75);border:1px solid rgba(255,255,255,0.12);cursor:pointer;aspect-ratio:4/3;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease;}',
      '.mg-evf-card:hover{transform:translateY(-4px);border-color:#b44fff;box-shadow:0 12px 30px rgba(180,79,255,0.28);}',
      '.mg-evf-card img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s ease;}',
      '.mg-evf-card:hover img{transform:scale(1.06);}',
      '.mg-evf-cap{position:absolute;left:0;right:0;bottom:0;padding:24px 12px 10px;background:linear-gradient(transparent,rgba(7,5,15,0.92));color:#fff;font-size:.82rem;}',
      '.mg-evf-club{font-size:.7rem;color:#00f0ff;font-weight:700;text-transform:uppercase;letter-spacing:.8px;}',
      '.mg-evf-lb{position:fixed;inset:0;z-index:9999;background:rgba(5,3,12,0.92);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;flex-direction:column;padding:20px;}',
      '.mg-evf-lb.open{display:flex;}',
      '.mg-evf-lb img{max-width:92vw;max-height:78vh;border-radius:12px;border:1px solid rgba(255,255,255,0.18);box-shadow:0 20px 60px rgba(0,0,0,0.7);}',
      '.mg-evf-lb-txt{margin-top:12px;color:#f3ecff;font-size:.95rem;text-align:center;}',
      '.mg-evf-lb-btn{position:fixed;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.12);color:#fff;border:1px solid rgba(255,255,255,0.22);border-radius:50%;width:44px;height:44px;font-size:22px;cursor:pointer;}',
      '.mg-evf-lb-prev{left:18px;} .mg-evf-lb-next{right:18px;}',
      '.mg-evf-lb-close{position:fixed;top:18px;right:22px;background:rgba(255,45,120,0.25);color:#fff;border:1px solid #ff2d78;border-radius:999px;padding:6px 14px;font-weight:700;cursor:pointer;}'
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

  async function render() {
    var tpl = getActiveTemplate();
    var existing = document.getElementById('mg-evf-section');
    if (existing && existing.getAttribute('data-tpl') === tpl) return;
    if (existing) existing.remove();
    try {
      var r = await fetch('eventos_fotos.json?_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      var data = await r.json();
      var byTpl = (data && data.por_plantilla) || {};
      var photos = Array.isArray(byTpl[tpl]) && byTpl[tpl].length
        ? byTpl[tpl]
        : (Array.isArray(data && data.fotos) ? data.fotos : []);
      if (!photos.length) return;

      injectStyles();
      var sec = document.createElement('div');
      sec.id = 'mg-evf-section';
      sec.setAttribute('data-tpl', tpl);
      sec.className = 'mg-evf-wrap';
      sec.innerHTML = [
        '<div class="mg-evf-head">',
        '  <div class="mg-evf-kicker">📸 Galería de Clubs y Sesiones</div>',
        '  <h3 class="mg-evf-title">Fotos de Eventos</h3>',
        '</div>',
        '<div class="mg-evf-grid" id="mg-evf-grid"></div>'
      ].join('');

      var eventsSec = document.getElementById('events');
      var sponsorsSec = document.getElementById('sponsors');
      if (eventsSec) {
        eventsSec.appendChild(sec);
      } else if (sponsorsSec && sponsorsSec.parentNode) {
        sponsorsSec.parentNode.insertBefore(sec, sponsorsSec);
      } else {
        document.body.appendChild(sec);
      }

      var openLb = ensureLightbox(photos);
      var grid = document.getElementById('mg-evf-grid');
      photos.forEach(function (p, i) {
        var card = document.createElement('div');
        card.className = 'mg-evf-card';
        card.innerHTML = '<img src="' + p.archivo + '" alt="' + (p.titulo || 'Evento') + '" loading="lazy">' +
          '<div class="mg-evf-cap">' +
          (p.club ? '<div class="mg-evf-club">' + p.club + '</div>' : '') +
          '<div>' + (p.titulo || '') + '</div></div>';
        card.onclick = function () { openLb(i); };
        grid.appendChild(card);
      });
    } catch (e) {}
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

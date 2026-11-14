/* MG Barcelona Live - Barra superior sutil de oyentes, visitas y banderas por IP */
(function () {
  var NS = 'mgbarcelonalive';
  var ABACUS = 'https://abacus.jasoncameron.dev';
  var TRACKED_COUNTRIES = [
    ['es', 'España'], ['ar', 'Argentina'], ['mx', 'México'], ['co', 'Colombia'],
    ['cl', 'Chile'], ['us', 'EE. UU.'], ['fr', 'Francia'], ['gb', 'Reino Unido'],
    ['de', 'Alemania'], ['it', 'Italia'], ['pt', 'Portugal'], ['br', 'Brasil'],
    ['pe', 'Perú'], ['ec', 'Ecuador'], ['ve', 'Venezuela'], ['uy', 'Uruguay'],
    ['nl', 'Países Bajos'], ['be', 'Bélgica'], ['ch', 'Suiza'], ['ca', 'Canadá'],
    ['do', 'Rep. Dominicana'], ['pa', 'Panamá'], ['cr', 'Costa Rica'], ['ad', 'Andorra']
  ];

  function injectStyles() {
    if (document.getElementById('mg-stats-style')) return;
    var st = document.createElement('style');
    st.id = 'mg-stats-style';
    st.textContent = [
      '.mg-top-pill{position:fixed;left:50%;transform:translateX(-50%);z-index:95;display:flex;align-items:center;gap:12px;max-width:94vw;padding:5px 14px;border-radius:999px;background:rgba(10,7,22,0.56);border:1px solid rgba(255,255,255,0.11);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 6px 24px rgba(0,0,0,0.28);color:rgba(243,236,255,0.92);font-family:"Segoe UI",system-ui,sans-serif;font-size:12px;line-height:1;white-space:nowrap;overflow-x:auto;scrollbar-width:none;transition:opacity .25s ease;}',
      '.mg-top-pill::-webkit-scrollbar{display:none;}',
      '.mg-tp-item{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;}',
      '.mg-tp-dot{width:7px;height:7px;border-radius:50%;background:#3fd68f;box-shadow:0 0 8px #3fd68f;animation:mgPulse 2s infinite;}',
      '@keyframes mgPulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(.82);}}',
      '.mg-tp-lbl{color:rgba(205,190,235,0.72);font-weight:500;}',
      '.mg-tp-val{color:#ffffff;font-weight:700;}',
      '.mg-tp-val.live{color:#3fd68f;}',
      '.mg-tp-val.cyan{color:#5eead4;}',
      '.mg-tp-sep{width:1px;height:12px;background:rgba(255,255,255,0.14);flex-shrink:0;}',
      '.mg-tp-flags{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;}',
      '.mg-tp-flag{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);font-size:11px;color:#e9dfff;}',
      '.mg-tp-flag img,.mg-tp-you img{width:16px;height:12px;border-radius:2px;object-fit:cover;display:block;}',
      '.mg-tp-flag b{color:#f5c842;font-weight:700;}',
      '@media(max-width:640px){.mg-top-pill{padding:5px 10px;gap:8px;font-size:11px;}}'
    ].join('');
    document.head.appendChild(st);
  }

  function flagImg(cc, alt) {
    var code = (cc || '').toLowerCase();
    return '<img src="https://flagcdn.com/24x18/' + code + '.png" alt="' + (alt || code.toUpperCase()) + '" loading="lazy" onerror="this.style.display=\'none\'">';
  }

  function positionBelowNav(card) {
    var nav = document.querySelector('nav');
    var topPx = 12;
    if (nav) {
      var rect = nav.getBoundingClientRect();
      if (rect.height > 0 && rect.top <= 20) {
        topPx = Math.round(rect.bottom + 8);
      }
    }
    card.style.top = topPx + 'px';
  }

  function ensureCard() {
    var existing = document.getElementById('mg-stats-card');
    if (existing) {
      positionBelowNav(existing);
      return existing;
    }
    injectStyles();
    var card = document.createElement('div');
    card.id = 'mg-stats-card';
    card.className = 'mg-top-pill';
    card.innerHTML = [
      '<span class="mg-tp-item"><span class="mg-tp-dot"></span><span class="mg-tp-lbl">Oyentes</span><span class="mg-tp-val live" id="mg-listeners-val">0</span></span>',
      '<span class="mg-tp-sep"></span>',
      '<span class="mg-tp-item"><span class="mg-tp-lbl">Visitas</span><span class="mg-tp-val cyan" id="mg-visits-val">--</span></span>',
      '<span class="mg-tp-sep"></span>',
      '<span class="mg-tp-item mg-tp-you" id="mg-you-loc"><span class="mg-tp-lbl">IP...</span></span>',
      '<span class="mg-tp-sep"></span>',
      '<span class="mg-tp-flags" id="mg-flags-list"></span>'
    ].join('');

    document.body.insertBefore(card, document.body.firstChild);
    positionBelowNav(card);
    if (!window.__mgStatsResizeBound) {
      window.__mgStatsResizeBound = true;
      window.addEventListener('resize', function () {
        var c = document.getElementById('mg-stats-card');
        if (c) positionBelowNav(c);
      });
    }
    return card;
  }

  function getIcecastBase() {
    try {
      var info = document.getElementById('stream-info');
      var txt = info ? info.textContent || '' : '';
      var m = txt.match(/https?:\/\/[^\s'"]+\/stream/);
      if (m) {
        window.__mgStreamUrl = m[0];
        return m[0].replace(/\/stream.*$/, '');
      }
      if (typeof STREAM_URL === 'string' && STREAM_URL.indexOf('http') === 0) {
        window.__mgStreamUrl = STREAM_URL;
        return STREAM_URL.replace(/\/stream.*$/, '');
      }
      if (window.__mgStreamUrl) {
        return window.__mgStreamUrl.replace(/\/stream.*$/, '');
      }
      var sc = document.scripts;
      for (var i = 0; i < sc.length; i++) {
        var sm = (sc[i].textContent || '').match(/https?:\/\/[^\s'"]+\/stream/);
        if (sm) {
          window.__mgStreamUrl = sm[0];
          return sm[0].replace(/\/stream.*$/, '');
        }
      }
    } catch (e) {}
    return '';
  }

  async function refreshListeners() {
    var el = document.getElementById('mg-listeners-val');
    if (!el) return;
    var base = getIcecastBase();
    if (!base) return;
    try {
      var r = await fetch(base + '/status-json.xsl?_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      var data = await r.json();
      var src = data && data.icestats ? data.icestats.source : null;
      var total = 0;
      if (Array.isArray(src)) {
        src.forEach(function (s) { total += Number(s && s.listeners || 0); });
      } else if (src && typeof src === 'object') {
        total = Number(src.listeners || 0);
      }
      el.textContent = String(isNaN(total) ? 0 : total);
    } catch (e) {}
  }

  async function detectGeo() {
    try {
      var r = await fetch('https://ipwho.is/', { cache: 'no-store' });
      if (r.ok) {
        var d = await r.json();
        if (d && d.success !== false && d.country_code) {
          return { cc: String(d.country_code).toLowerCase(), country: d.country || d.country_code, city: d.city || '' };
        }
      }
    } catch (e) {}
    try {
      var r2 = await fetch('https://get.geojs.io/v1/ip/country.json', { cache: 'no-store' });
      if (r2.ok) {
        var d2 = await r2.json();
        if (d2 && d2.country) {
          return { cc: String(d2.country).toLowerCase(), country: d2.name || d2.country, city: '' };
        }
      }
    } catch (e) {}
    return null;
  }

  async function countVisitAndCountry(geo) {
    var vEl = document.getElementById('mg-visits-val');
    var hitKey = 'mg_visit_counted_v1';
    var already = false;
    try { already = sessionStorage.getItem(hitKey) === '1'; } catch (e) {}

    try {
      var op = already ? 'get' : 'hit';
      var r = await fetch(ABACUS + '/' + op + '/' + NS + '/visitas', { cache: 'no-store' });
      if (r.ok) {
        var d = await r.json();
        if (typeof d.value === 'number' && d.value >= 0) {
          if (vEl) vEl.textContent = d.value.toLocaleString('es-ES');
          try { sessionStorage.setItem(hitKey, '1'); } catch (e) {}
        }
      }
    } catch (e) {
      if (vEl && vEl.textContent === '--') {
        var localV = Number(localStorage.getItem('mg_local_visits') || '0') + (already ? 0 : 1);
        localStorage.setItem('mg_local_visits', String(localV));
        vEl.textContent = String(localV);
      }
    }

    if (geo && geo.cc) {
      var cHitKey = 'mg_country_counted_' + geo.cc;
      var cAlready = false;
      try { cAlready = sessionStorage.getItem(cHitKey) === '1'; } catch (e) {}
      if (!cAlready) {
        try {
          await fetch(ABACUS + '/hit/' + NS + '/pais_' + geo.cc, { cache: 'no-store' });
          try { sessionStorage.setItem(cHitKey, '1'); } catch (e) {}
        } catch (e) {}
      }
    }
  }

  async function loadCountryFlags(myGeo) {
    var listEl = document.getElementById('mg-flags-list');
    if (!listEl) return;

    var pool = TRACKED_COUNTRIES.slice();
    if (myGeo && myGeo.cc && !pool.some(function (x) { return x[0] === myGeo.cc; })) {
      pool.unshift([myGeo.cc, myGeo.country]);
    }

    var results = await Promise.allSettled(pool.map(async function (item) {
      var r = await fetch(ABACUS + '/get/' + NS + '/pais_' + item[0], { cache: 'no-store' });
      if (!r.ok) return null;
      var d = await r.json();
      var val = typeof d.value === 'number' ? d.value : 0;
      return val > 0 ? { cc: item[0], name: item[1], count: val } : null;
    }));

    var items = results
      .map(function (r) { return r.status === 'fulfilled' ? r.value : null; })
      .filter(Boolean)
      .sort(function (a, b) { return b.count - a.count; });

    if (items.length === 0 && myGeo && myGeo.cc) {
      items.push({ cc: myGeo.cc, name: myGeo.country, count: 1 });
    }

    listEl.innerHTML = items.slice(0, 10).map(function (it) {
      return '<span class="mg-tp-flag" title="' + it.name + ': ' + it.count + ' visitas">' + flagImg(it.cc, it.name) + '<b>' + it.count.toLocaleString('es-ES') + '</b></span>';
    }).join('');
  }

  async function init() {
    ensureCard();
    refreshListeners();
    if (!window.__mgStatsTimer) {
      window.__mgStatsTimer = setInterval(refreshListeners, 10000);
    }

    var geo = await detectGeo();
    var youEl = document.getElementById('mg-you-loc');
    if (youEl && geo) {
      var place = geo.city || geo.country;
      youEl.innerHTML = flagImg(geo.cc, geo.country) + '<span class="mg-tp-val">' + place + '</span>';
    } else if (youEl) {
      youEl.innerHTML = '<span class="mg-tp-lbl">Internacional</span>';
    }

    await countVisitAndCountry(geo);
    await loadCountryFlags(geo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Controlador universal de volumen (funciona en todas las plantillas incluso tras cambio en vivo y permite 0%)
  if (!window.__mgVolBound) {
    window.__mgVolBound = true;
    var applyVol = function (e) {
      var t = e && e.target;
      if (!t || (t.id !== 'volume' && t.id !== 'vol')) return;
      t.dataset.mgUserSet = '1';
      var v = parseFloat(t.value);
      if (isNaN(v)) return;
      v = Math.max(0, Math.min(1, v));
      var a = document.getElementById('radio-audio') || window.__mgPersistentAudio;
      if (a) {
        a.muted = (v === 0);
        a.volume = v;
      }
      var pct = document.getElementById('vol-pct');
      if (pct) pct.textContent = Math.round(v * 100) + '%';
    };
    document.addEventListener('input', applyVol, true);
    document.addEventListener('change', applyVol, true);
  }

  // Controlador universal de Play/Pause para movil y PC (evita fallos tras cambio de plantilla)
  if (!window.__mgPlayBound) {
    window.__mgPlayBound = true;
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('#play-btn') : null;
      if (!btn) return;
      e.preventDefault();
      e.stopImmediatePropagation();

      var a = document.getElementById('radio-audio') || window.__mgPersistentAudio;
      if (!a) {
        a = document.createElement('audio');
        a.id = 'radio-audio';
        a.setAttribute('playsinline', '');
        document.body.appendChild(a);
        window.__mgPersistentAudio = a;
      }

      var base = getIcecastBase();
      var streamUrl = base ? (base + '/stream') : '';
      var icon = document.getElementById('play-icon') || btn;
      var st = document.getElementById('status-text') || document.getElementById('np-sub');

      if (!a.paused && a.src) {
        a.pause();
        try { a.removeAttribute('src'); a.load(); } catch (err) {}
        icon.textContent = '▶';
        if (st) st.textContent = 'Pulsa ▶ para escuchar en directo';
        return;
      }

      if (!streamUrl) {
        if (st) st.textContent = '⚠ Enlace de emisión no disponible';
        return;
      }

      var vs = document.getElementById('volume') || document.getElementById('vol');
      if (vs) {
        if (!vs.dataset.mgUserSet) {
          vs.value = '1';
          var pct0 = document.getElementById('vol-pct');
          if (pct0) pct0.textContent = '100%';
        }
        var vv = parseFloat(vs.value);
        if (!isNaN(vv)) {
          a.muted = (vv === 0);
          a.volume = Math.max(0, Math.min(1, vv));
        }
      } else {
        a.muted = false;
        a.volume = 1.0;
      }

      if (st) st.textContent = 'Conectando con la radio...';
      a.src = streamUrl;
      var p = a.play();
      if (p && typeof p.then === 'function') {
        p.then(function () {
          icon.textContent = '⏸';
          if (st) st.textContent = '🔴 Emitiendo en directo desde Barcelona';
        }).catch(function () {
          if (st) st.textContent = '⚠ Toca ▶ de nuevo para activar el audio';
        });
      } else {
        icon.textContent = '⏸';
        if (st) st.textContent = '🔴 Emitiendo en directo desde Barcelona';
      }
    }, true);
  }

  // Gestor universal de Publicidad: carga SIEMPRE todos los videos/imagenes desde publicidad.json
  var adSyncing = false;
  async function initAdsPlayer() {
    var v = document.getElementById('adVideo');
    if (!v || adSyncing) return;
    if (v.getAttribute('data-mg-ads-ok') === '1') return;
    adSyncing = true;
    try {
      var r = await fetch('publicidad.json?_=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      var data = await r.json();
      var ads = Array.isArray(data && data.anuncios) ? data.anuncios : [];
      if (!ads.length) return;

      v.setAttribute('data-mg-ads-ok', '1');
      var imgEl = document.getElementById('adImage');
      var statusEl = document.getElementById('adStatus') || document.getElementById('ad-status');
      var playEl = document.getElementById('adPlayBtn') || document.getElementById('ad-play');
      var prevEl = document.getElementById('adPrevBtn') || document.getElementById('ad-prev');
      var nextEl = document.getElementById('adNextBtn') || document.getElementById('ad-next');
      var idx = 0;
      var imgTimer = null;

      function playAd(i) {
        if (!document.body.contains(v)) return;
        idx = (i + ads.length) % ads.length;
        var item = ads[idx];
        var src = item.archivo || item;
        var tipo = (item.tipo || (/\.(mp4|webm)$/i.test(src) ? 'video' : 'imagen')).toLowerCase();
        if (imgTimer) { clearTimeout(imgTimer); imgTimer = null; }

        if (tipo === 'imagen' && imgEl) {
          v.pause();
          v.style.display = 'none';
          imgEl.src = src;
          imgEl.style.display = 'block';
          if (statusEl) statusEl.textContent = 'Publicidad ' + (idx + 1) + ' / ' + ads.length;
          imgTimer = setTimeout(function () { playAd(idx + 1); }, (Number(data.intervalo) || 8) * 1000);
          return;
        }

        if (imgEl) imgEl.style.display = 'none';
        v.style.display = 'block';
        v.muted = true;
        v.src = src;
        v.onended = function () { playAd(idx + 1); };
        v.play().then(function () {
          if (playEl) playEl.textContent = 'Pausar';
          if (statusEl) statusEl.textContent = 'Publicidad ' + (idx + 1) + ' / ' + ads.length;
        }).catch(function () {
          if (statusEl) statusEl.textContent = 'Publicidad ' + (idx + 1) + ' / ' + ads.length + ' lista.';
        });
      }

      if (prevEl) prevEl.onclick = function (e) { e.stopImmediatePropagation(); playAd(idx - 1); };
      if (nextEl) nextEl.onclick = function (e) { e.stopImmediatePropagation(); playAd(idx + 1); };
      playAd(0);
    } catch (e) {}
    finally { adSyncing = false; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdsPlayer);
  } else {
    initAdsPlayer();
  }
  if (!window.__mgAdsObs && typeof MutationObserver !== 'undefined') {
    window.__mgAdsObs = new MutationObserver(function () {
      var v = document.getElementById('adVideo');
      if (v && v.getAttribute('data-mg-ads-ok') !== '1') {
        initAdsPlayer();
      }
    });
    window.__mgAdsObs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

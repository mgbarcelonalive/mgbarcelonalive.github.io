/* MG Barcelona Live - Contador de visitas, oyentes en directo y banderas por IP */
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
      '.mg-stats-wrap{max-width:1100px;margin:28px auto 18px;padding:18px 20px;border-radius:18px;background:rgba(12,8,26,0.78);border:1px solid rgba(255,255,255,0.14);backdrop-filter:blur(12px);color:#f3ecff;font-family:"Segoe UI",system-ui,sans-serif;box-shadow:0 12px 36px rgba(0,0,0,0.45);}',
      '.mg-stats-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;}',
      '.mg-stats-title{font-size:1.05rem;font-weight:800;letter-spacing:.4px;color:#f5c842;display:flex;align-items:center;gap:8px;}',
      '.mg-stats-you{font-size:.86rem;color:#c9b8ea;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.06);padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.1);}',
      '.mg-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:14px;}',
      '.mg-stat-box{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);border-radius:12px;padding:12px 14px;}',
      '.mg-stat-lbl{font-size:.75rem;text-transform:uppercase;letter-spacing:1px;color:#a58cc9;margin-bottom:4px;}',
      '.mg-stat-val{font-size:1.55rem;font-weight:800;color:#00f0ff;line-height:1.1;}',
      '.mg-stat-val.live{color:#3fd68f;}',
      '.mg-flags-title{font-size:.78rem;text-transform:uppercase;letter-spacing:1px;color:#a58cc9;margin-bottom:8px;}',
      '.mg-flags-list{display:flex;flex-wrap:wrap;gap:8px;}',
      '.mg-flag-pill{display:inline-flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);font-size:.82rem;font-weight:600;color:#efe8ff;}',
      '.mg-flag-pill img{width:20px;height:15px;border-radius:2px;object-fit:cover;box-shadow:0 1px 3px rgba(0,0,0,.4);}',
      '.mg-flag-cnt{color:#f5c842;font-weight:800;}'
    ].join('');
    document.head.appendChild(st);
  }

  function flagImg(cc, alt) {
    var code = (cc || '').toLowerCase();
    return '<img src="https://flagcdn.com/24x18/' + code + '.png" alt="' + (alt || code.toUpperCase()) + '" loading="lazy" onerror="this.style.display=\'none\'">';
  }

  function ensureCard() {
    var existing = document.getElementById('mg-stats-card');
    if (existing) return existing;
    injectStyles();
    var card = document.createElement('section');
    card.id = 'mg-stats-card';
    card.className = 'mg-stats-wrap';
    card.innerHTML = [
      '<div class="mg-stats-head">',
      '  <div class="mg-stats-title">📊 Audiencia en Directo · MG Barcelona Live</div>',
      '  <div class="mg-stats-you" id="mg-you-loc">🌍 Detectando tu país por IP...</div>',
      '</div>',
      '<div class="mg-stats-grid">',
      '  <div class="mg-stat-box"><div class="mg-stat-lbl">🎧 Oyentes ahora</div><div class="mg-stat-val live" id="mg-listeners-val">0</div></div>',
      '  <div class="mg-stat-box"><div class="mg-stat-lbl">👁 Visitas totales</div><div class="mg-stat-val" id="mg-visits-val">--</div></div>',
      '  <div class="mg-stat-box"><div class="mg-stat-lbl">🌎 Países conectados</div><div class="mg-stat-val" id="mg-countries-val">1</div></div>',
      '</div>',
      '<div class="mg-flags-title">🚩 Oyentes y visitas por país (IP)</div>',
      '<div class="mg-flags-list" id="mg-flags-list"><span class="mg-flag-pill">Cargando banderas...</span></div>'
    ].join('');

    var footer = document.querySelector('footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(card, footer);
    } else {
      document.body.appendChild(card);
    }
    return card;
  }

  function getIcecastBase() {
    try {
      var info = document.getElementById('stream-info');
      var txt = info ? info.textContent || '' : '';
      var m = txt.match(/https?:\/\/[^\s'"]+\/stream/);
      if (m) return m[0].replace(/\/stream.*$/, '');
      if (typeof STREAM_URL === 'string' && STREAM_URL.indexOf('http') === 0) {
        return STREAM_URL.replace(/\/stream.*$/, '');
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
    var cntEl = document.getElementById('mg-countries-val');
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

    if (cntEl) cntEl.textContent = String(items.length || 1);
    listEl.innerHTML = items.map(function (it) {
      return '<span class="mg-flag-pill">' + flagImg(it.cc, it.name) + '<span>' + it.name + '</span><span class="mg-flag-cnt">' + it.count.toLocaleString('es-ES') + '</span></span>';
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
      var place = geo.city ? (geo.city + ', ' + geo.country) : geo.country;
      youEl.innerHTML = flagImg(geo.cc, geo.country) + ' <span>Tu IP: <strong>' + place + '</strong></span>';
    } else if (youEl) {
      youEl.textContent = '🌍 Conexión internacional';
    }

    await countVisitAndCountry(geo);
    await loadCountryFlags(geo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

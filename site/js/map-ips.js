/* Section 4 — carte choroplèthe de l'IPS moyen des collèges par département.
   Leaflet.js + GeoJSON départemental simplifié (site/data/departements.geojson).
   Lazy-load : la carte n'est initialisée que lorsqu'elle entre dans le viewport
   (mobile-first, chargement rapide). L'année est affichée en permanence (CONSIGNES §2). */
(function () {
  if (typeof L === 'undefined') return;
  var host = document.getElementById('map-ips');
  if (!host) return;

  var STOPS = [
    { min: 115, color: '#1a5fb4', label: '\u2265 115 (tr\u00e8s favoris\u00e9)' },
    { min: 105, color: '#4a90d9', label: '105 \u2013 115' },
    { min: 100, color: '#8fb8d8', label: '100 \u2013 105' },
    { min: 95, color: '#e8c39e', label: '95 \u2013 100' },
    { min: 85, color: '#e0864f', label: '85 \u2013 95' },
    { min: 0, color: '#c0392b', label: '< 85 (tr\u00e8s d\u00e9favoris\u00e9)' }
  ];
  function colorFor(v) {
    if (v == null) return '#2a3038';
    for (var i = 0; i < STOPS.length; i++) if (v >= STOPS[i].min) return STOPS[i].color;
    return '#2a3038';
  }

  var started = false;
  function init() {
    if (started) return; started = true;
    Promise.all([
      fetch('data/ips_departements.json').then(function (r) { return r.json(); }),
      fetch('data/departements.geojson').then(function (r) { return r.json(); })
    ]).then(function (res) {
      var data = res[0], geo = res[1];
      var byCode = {};
      data.departements.forEach(function (d) { byCode[d.code] = d; });

      var map = L.map('map-ips', { scrollWheelZoom: false, attributionControl: false, zoomControl: true });
      L.control.attribution({ prefix: false }).addAttribution('DEPP \u00b7 Fond IGN/Etalab').addTo(map);

      var layer = L.geoJSON(geo, {
        style: function (f) {
          var d = byCode[f.properties.code];
          return { fillColor: colorFor(d ? d.ips_moyen : null), fillOpacity: 0.82, color: '#0e1117', weight: 1 };
        },
        onEachFeature: function (f, lyr) {
          var d = byCode[f.properties.code];
          var txt = '<div class="ips-tip"><b>' + f.properties.nom + '</b><br>'
            + (d ? 'IPS moyen : <b>' + d.ips_moyen + '</b><br>' + d.n_colleges + ' coll\u00e8ges' : 'donn\u00e9e non disponible') + '</div>';
          lyr.bindTooltip(txt, { sticky: true });
          lyr.on('mouseover', function () { lyr.setStyle({ weight: 2.5, color: '#f2f4f7' }); });
          lyr.on('mouseout', function () { layer.resetStyle(lyr); });
        }
      }).addTo(map);
      map.fitBounds(layer.getBounds(), { padding: [8, 8] });

      var y = document.getElementById('map-year');
      if (y) y.textContent = 'IPS coll\u00e8ges \u00b7 rentr\u00e9e ' + data.meta.annee_reference;
      var lg = document.getElementById('map-legend');
      if (lg) lg.innerHTML = STOPS.map(function (s) {
        return '<span class="sw"><span class="chip" style="background:' + s.color + '"></span>' + s.label + '</span>';
      }).join('');
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { init(); io.disconnect(); } });
    }, { rootMargin: '200px' });
    io.observe(host);
  } else { init(); }
})();

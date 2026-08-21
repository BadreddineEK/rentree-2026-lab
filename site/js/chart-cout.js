/* Section 2 (coût + ARS) et section 6 (secteur / éducation prioritaire).
   Choix : Chart.js — léger, responsive nativement, tooltips accessibles, un seul CDN.
   Toutes les barres de la page sont regroupées ici pour tenir dans les 4 fichiers JS
   imposés (CONSIGNES §6). Données : site/data/*.json. */
(function () {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#5a5852';
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.font.size = 13;

  var GRID = 'rgba(0,0,0,0.08)';
  var WARN = '#b5651d', COOL = '#4a7a55', ACC = '#35506b', HOT = '#a3472f', SAND = '#c98a55';
  var euro = function (v) { return v.toLocaleString('fr-FR') + ' \u20ac'; };
  var noGridX = function () { return { grid: { display: false }, ticks: { color: '#9aa4b2' } }; };

  fetch('data/cout_rentree.json').then(function (r) { return r.json(); }).then(function (d) {
    var el = document.getElementById('chart-cout');
    if (!el) return;
    var labels = ['Co\u00fbt moyen', 'Co\u00fbt m\u00e9dian', 'ARS 6-10', 'ARS 11-14', 'ARS 15-18'];
    var vals = [d.cout.moyenne_eur, d.cout.mediane_eur, d.ars[0].montant_eur, d.ars[1].montant_eur, d.ars[2].montant_eur];
    new Chart(el, {
      type: 'bar',
      data: { labels: labels, datasets: [{ data: vals, backgroundColor: [WARN, WARN, COOL, COOL, COOL], borderRadius: 6, maxBarThickness: 64 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return euro(c.parsed.y); } } } },
        scales: { x: noGridX(), y: { grid: { color: GRID }, beginAtZero: true, ticks: { callback: function (v) { return v + ' \u20ac'; } } } }
      }
    });
    var lg = document.getElementById('cout-legend');
    if (lg) lg.innerHTML = '<span style="color:' + WARN + '">\u25a0</span> D\u00e9pense de rentr\u00e9e (UFC-Que Choisir 2026) &nbsp; '
      + '<span style="color:' + COOL + '">\u25a0</span> ARS vers\u00e9e (CAF 2026)';
    var tk = document.getElementById('cout-takeaway');
    if (tk) tk.innerHTML = 'Pour la tranche 11-14 ans, l\u2019ARS (' + euro(d.ars[1].montant_eur)
      + ') d\u00e9passe la d\u00e9pense <em>m\u00e9diane</em> (' + euro(d.cout.mediane_eur)
      + ') mais reste sous la <em>moyenne</em> (' + euro(d.cout.moyenne_eur)
      + '). Selon qu\u2019on regarde la moyenne ou la m\u00e9diane, \u00ab l\u2019ARS suffit \u00bb n\u2019a pas la m\u00eame r\u00e9ponse.';
  });

  fetch('data/secteur_comparison.json').then(function (r) { return r.json(); }).then(function (d) {
    var s = document.getElementById('chart-secteur');
    if (s) {
      var sv = d.secteur.valeurs;
      new Chart(s, {
        type: 'bar',
        data: { labels: sv.map(function (x) { return x.label; }), datasets: [{ data: sv.map(function (x) { return x.ips_moyen; }), backgroundColor: [ACC, COOL], borderRadius: 6, maxBarThickness: 70 }] },
        options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return 'IPS ' + c.parsed.y + ' \u00b7 ' + sv[c.dataIndex].n + ' coll\u00e8ges'; } } } }, scales: { x: noGridX(), y: { grid: { color: GRID }, min: 60, title: { display: true, text: 'IPS moyen' } } } }
      });
    }
    var e = document.getElementById('chart-ep');
    if (e) {
      var ev = d.education_prioritaire.valeurs;
      new Chart(e, {
        type: 'bar',
        data: { labels: ev.map(function (x) { return x.label.replace('Hors \u00e9ducation prioritaire', 'Hors EP'); }), datasets: [{ data: ev.map(function (x) { return x.ips_moyen; }), backgroundColor: [COOL, SAND, HOT], borderRadius: 6, maxBarThickness: 70 }] },
        options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return 'IPS ' + c.parsed.y + ' \u00b7 ' + ev[c.dataIndex].n + ' coll\u00e8ges'; } } } }, scales: { x: noGridX(), y: { grid: { color: GRID }, min: 60, title: { display: true, text: 'IPS moyen' } } } }
      });
    }
    var tk = document.getElementById('secteur-takeaway');
    if (tk) {
      var pub = d.secteur.valeurs[0], pri = d.secteur.valeurs[1];
      var repp = d.education_prioritaire.valeurs.filter(function (x) { return x.label === 'REP+'; })[0];
      tk.innerHTML = 'Le priv\u00e9 sous contrat (IPS ' + pri.ips_moyen + ') accueille un public nettement plus favoris\u00e9 que le public (IPS ' + pub.ips_moyen + ')'
        + (repp ? ', et les coll\u00e8ges REP+ (IPS ' + repp.ips_moyen + ') concentrent les \u00e9l\u00e8ves les plus d\u00e9favoris\u00e9s' : '')
        + '. L\u2019\u00e9cole \u00ab moyenne \u00bb n\u2019existe pas : la moyenne nationale additionne des mondes tr\u00e8s diff\u00e9rents.';
    }
  });
})();

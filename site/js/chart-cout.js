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
    if (tk) tk.innerHTML = 'Le basculement est là&nbsp;: l\u2019ARS (' + euro(d.ars[1].montant_eur)
      + ' pour un coll\u00e9gien) <em>d\u00e9passe largement</em> la rentr\u00e9e <em>m\u00e9diane</em> ('
      + euro(d.cout.mediane_eur) + '), mais passe sous la <em>moyenne</em> (' + euro(d.cout.moyenne_eur)
      + '). Tout le d\u00e9bat \u00ab l\u2019ARS suffit ou pas \u00bb tient \u00e0 ce choix de chiffre.';
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

  // Valeur ajoutée au brevet par quartile d'IPS (section « pas une fatalité »).
  fetch('data/ivac_nuance.json').then(function (r) { return r.json(); }).then(function (d) {
    var el = document.getElementById('chart-ivac');
    if (!el || !d.par_quartile_ips) return;
    var fr = function (x) { return String(x).replace('.', ','); };
    var signed = function (x) { return (x > 0 ? '+' : '') + fr(x); };
    var q = d.par_quartile_ips;
    var vals = q.map(function (x) { return x.va_moyenne; });
    var cols = vals.map(function (v) { return v >= 0 ? COOL : HOT; });
    new Chart(el, {
      type: 'bar',
      data: {
        labels: q.map(function (x) { return x.label; }),
        datasets: [{ data: vals, backgroundColor: cols, borderRadius: 6, maxBarThickness: 78 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) {
            var x = q[c.dataIndex];
            return 'VA moyenne ' + signed(x.va_moyenne)
              + ' \u00b7 ' + x.part_va_positive_pct + '\u00a0% de coll\u00e8ges au-dessus de l\u2019attendu'
              + ' \u00b7 ' + x.n_colleges + ' coll\u00e8ges';
          } } }
        },
        scales: {
          x: noGridX(),
          y: { grid: { color: GRID }, title: { display: true, text: 'Valeur ajout\u00e9e moyenne (points de r\u00e9ussite au DNB)' } }
        }
      }
    });
    var q1 = q[0];
    var lg = document.getElementById('ivac-legend');
    if (lg) lg.innerHTML = '<span style="color:' + COOL + '">\u25a0</span> fait mieux qu\u2019attendu &nbsp; '
      + '<span style="color:' + HOT + '">\u25a0</span> fait moins bien qu\u2019attendu';
    var tk = document.getElementById('ivac-takeaway');
    if (tk) tk.innerHTML = 'Surprise&nbsp;: le quart des coll\u00e8ges <em>les plus d\u00e9favoris\u00e9s</em> (Q1) affiche la '
      + 'valeur ajout\u00e9e moyenne la plus \u00e9lev\u00e9e (' + signed(q1.va_moyenne) + '), avec '
      + q1.part_va_positive_pct + '\u00a0% d\u2019\u00e9tablissements au-dessus de ce que leur profil laissait attendre. '
      + 'Un IPS bas p\u00e8se sur les r\u00e9sultats, mais ne condamne personne&nbsp;: \u00e0 profil \u00e9gal, ces coll\u00e8ges '
      + 'font souvent mieux que les plus favoris\u00e9s.';
  });
})();

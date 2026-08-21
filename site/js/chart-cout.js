/* Graphes en barres/lignes de l'enquête : IPS par niveau, évolution du tri,
   secteur / éducation prioritaire, valeur ajoutée. Chart.js, un seul CDN.
   Regroupés ici pour tenir dans le nombre de fichiers JS voulu. Données : site/data/*.json. */
(function () {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#5a5852';
  Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  Chart.defaults.font.size = 13;

  var GRID = 'rgba(0,0,0,0.08)';
  var WARN = '#b5651d', COOL = '#4a7a55', ACC = '#35506b', HOT = '#a3472f', SAND = '#c98a55';
  var PUB = '#35506b', PRI = '#b5651d'; // public = ardoise, privé = ocre
  var fr = function (x) { return String(x).replace('.', ','); };
  var noGridX = function () { return { grid: { display: false }, ticks: { color: '#9aa4b2' } }; };

  // ── IPS public vs privé, du primaire au lycée ──
  fetch('data/ips_par_niveau.json').then(function (r) { return r.json(); }).then(function (d) {
    var el = document.getElementById('chart-niveau');
    if (!el) return;
    var n = d.niveaux;
    new Chart(el, {
      type: 'bar',
      data: {
        labels: n.map(function (x) { return x.niveau; }),
        datasets: [
          { label: 'Public', data: n.map(function (x) { return x.ips_public; }), backgroundColor: PUB, borderRadius: 5, maxBarThickness: 46 },
          { label: 'Priv\u00e9 sous contrat', data: n.map(function (x) { return x.ips_prive; }), backgroundColor: PRI, borderRadius: 5, maxBarThickness: 46 }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) {
            var x = n[c.dataIndex];
            return c.dataset.label + ' \u00b7 IPS ' + fr(c.parsed.y) + ' (\u00e9cart priv\u00e9-public ' + fr(x.ecart_prive_public) + ')';
          } } }
        },
        scales: { x: noGridX(), y: { grid: { color: GRID }, min: 90, title: { display: true, text: 'IPS moyen' } } }
      }
    });
    var lg = document.getElementById('niveau-legend');
    if (lg) lg.innerHTML = '<span style="color:' + PUB + '">\u25a0</span> Public &nbsp; '
      + '<span style="color:' + PRI + '">\u25a0</span> Priv\u00e9 sous contrat';
    var ec = d.niveaux[0].ecart_prive_public, cc = d.niveaux[1].ecart_prive_public, lc = d.niveaux[2].ecart_prive_public;
    var tk = document.getElementById('niveau-takeaway');
    if (tk) tk.innerHTML = 'Le tri est d\u00e9j\u00e0 l\u00e0 au primaire (\u00e9cart de <em>' + fr(ec) + '</em> points d\u2019IPS entre priv\u00e9 et public), '
      + 'puis il se creuse au coll\u00e8ge (<em>' + fr(cc) + '</em>) et reste b\u00e9ant au lyc\u00e9e (<em>' + fr(lc) + '</em>). '
      + 'Plus l\u2019\u00e9l\u00e8ve avance, plus les deux secteurs scolarisent des mondes s\u00e9par\u00e9s.';
  });

  // ── Évolution de l'écart privé-public dans le temps, par niveau ──
  fetch('data/ips_evolution.json').then(function (r) { return r.json(); }).then(function (d) {
    var el = document.getElementById('chart-evolution');
    if (!el) return;
    var years = [];
    d.series.forEach(function (s) { s.points.forEach(function (p) { if (years.indexOf(p.annee) < 0) years.push(p.annee); }); });
    years.sort();
    var cols = { '\u00c9coles': COOL, 'Coll\u00e8ges': ACC, 'Lyc\u00e9es': HOT };
    var datasets = d.series.map(function (s) {
      var byYear = {}; s.points.forEach(function (p) { byYear[p.annee] = p.ecart_prive_public; });
      return {
        label: s.niveau,
        data: years.map(function (y) { return byYear[y] != null ? byYear[y] : null; }),
        borderColor: cols[s.niveau] || ACC, backgroundColor: cols[s.niveau] || ACC,
        borderWidth: 2.5, pointRadius: 4, pointHoverRadius: 6, tension: 0.15, spanGaps: false
      };
    });
    new Chart(el, {
      type: 'line',
      data: { labels: years, datasets: datasets },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) { return c.dataset.label + ' \u00b7 \u00e9cart priv\u00e9-public ' + fr(c.parsed.y) + ' pts'; } } }
        },
        scales: {
          x: noGridX(),
          y: { grid: { color: GRID }, title: { display: true, text: '\u00c9cart d\u2019IPS priv\u00e9 \u2212 public (points)' } }
        }
      }
    });
    var lg = document.getElementById('evolution-legend');
    if (lg) lg.innerHTML = Object.keys(cols).map(function (k) {
      return '<span style="color:' + cols[k] + '">\u25a0</span> ' + k;
    }).join(' &nbsp; ');
    var col = d.series.filter(function (s) { return s.niveau === 'Coll\u00e8ges'; })[0];
    var tk = document.getElementById('evolution-takeaway');
    if (tk && col && col.points.length >= 2) {
      var a = col.points[0], b = col.points[col.points.length - 1];
      tk.innerHTML = 'Aucune des trois courbes ne redescend. Au coll\u00e8ge, l\u2019\u00e9cart priv\u00e9-public est pass\u00e9 de <em>'
        + fr(a.ecart_prive_public) + '</em> \u00e0 <em>' + fr(b.ecart_prive_public) + '</em> points entre '
        + a.annee + ' et ' + b.annee + '. Le tri social ne stagne pas&nbsp;: il progresse.';
    }
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

/* Section 5 — nuage de points IPS × revenu médian par département + droite de régression.
   Le coefficient de corrélation calculé est affiché en gros ; la référence DEPP (0,87,
   niveau communal) est citée explicitement à côté, sans confondre les deux. */
(function () {
  if (typeof Chart === 'undefined') return;
  fetch('data/correlation.json').then(function (r) { return r.json(); }).then(function (d) {
    var el = document.getElementById('chart-scatter');
    var cc = d.correlation_calculee, ref = d.reference_publiee, reg = d.regression;

    var rEl = document.getElementById('corr-r');
    if (rEl) rEl.textContent = String(cc.r_pearson).replace('.', ',');
    var src = document.getElementById('corr-source');
    if (src) src.innerHTML = 'Calcul sur mes donn\u00e9es&nbsp;: <b>r = ' + String(cc.r_pearson).replace('.', ',')
      + '</b> (' + cc.n_departements + ' d\u00e9partements, IPS ' + cc.annee_reference.ips + ' \u00d7 niveau de vie '
      + cc.annee_reference.revenu + '). R\u00e9f\u00e9rence publi\u00e9e&nbsp;: <b>r = ' + String(ref.r).replace('.', ',')
      + '</b>, ' + ref.description + ' (' + ref.source + '). '
      + 'L\u2019\u00e9cart entre les deux tient au p\u00e9rim\u00e8tre\u00a0: je corr\u00e8le l\u2019IPS moyen des '
      + 'coll\u00e8ges au niveau d\u00e9partemental, quand la DEPP corr\u00e8le l\u2019IPS des \u00e9l\u00e8ves de 3e au '
      + 'niveau communal.';
    var mn = document.getElementById('method-n');
    if (mn) mn.textContent = cc.n_departements;
    if (!el) return;

    var pts = d.points.map(function (p) { return { x: p.ips, y: p.revenu_median, nom: p.nom }; });
    var xs = pts.map(function (p) { return p.x; });
    var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
    var line = [{ x: xmin, y: reg.pente * xmin + reg.ordonnee_origine },
                { x: xmax, y: reg.pente * xmax + reg.ordonnee_origine }];

    new Chart(el, {
      data: {
        datasets: [
          { type: 'line', data: line, borderColor: '#a3472f', borderWidth: 2, pointRadius: 0, fill: false, tension: 0 },
          { type: 'scatter', data: pts, backgroundColor: 'rgba(53,80,107,0.62)', pointRadius: 4, pointHoverRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (c) {
            if (c.dataset.type === 'line') return 'tendance';
            var p = c.raw; return p.nom + ' \u00b7 IPS ' + p.x + ' \u00b7 ' + p.y.toLocaleString('fr-FR') + ' \u20ac';
          } } }
        },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'IPS moyen des coll\u00e8ges' }, grid: { color: 'rgba(0,0,0,0.08)' } },
          y: { type: 'linear', title: { display: true, text: 'Niveau de vie m\u00e9dian (\u20ac/an)' }, grid: { color: 'rgba(0,0,0,0.08)' }, ticks: { callback: function (v) { return (v / 1000) + 'k'; } } }
        }
      }
    });
  });
})();

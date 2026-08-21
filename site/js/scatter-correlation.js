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
      + '</b>, ' + ref.description + ' (' + ref.source + ').';
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

  // Section « L'ARS tombe-t-elle au bon endroit ? » — pas de graphe, deux corrélations
  // et une comparaison de territoires réels, rendues depuis territoire_social.json.
  fetch('data/territoire_social.json').then(function (r) { return r.json(); }).then(function (d) {
    var fr = function (x) { return String(x).replace('.', ','); };

    var duo = document.getElementById('terr-corr');
    if (duo) {
      var cp = d.correlations.ips_x_taux_pauvrete, cs = d.correlations.ips_x_part_prestations;
      duo.innerHTML =
        '<div class="corr-card"><span class="corr-r-sm">' + fr(cp.r_pearson) + '</span>'
        + '<span class="corr-cap">IPS \u00d7 <b>taux de pauvret\u00e9</b><br>par d\u00e9partement (n=' + cp.n_departements + ')</span></div>'
        + '<div class="corr-card"><span class="corr-r-sm">' + fr(cs.r_pearson) + '</span>'
        + '<span class="corr-cap">IPS \u00d7 <b>part des prestations sociales</b><br>dans le revenu (n=' + cs.n_departements + ')</span></div>';
    }

    var cmp = document.getElementById('terr-compare');
    if (cmp) {
      var row = function (e) {
        return '<tr><td class="dep">' + e.nom + '</td><td>' + fr(e.ips_moyen)
          + '</td><td>' + fr(e.taux_pauvrete) + '&nbsp;%</td><td>' + fr(e.part_prestations) + '&nbsp;%</td></tr>';
      };
      cmp.innerHTML =
        '<table class="cmp-table"><thead><tr><th>D\u00e9partement</th><th>IPS coll\u00e8ges</th>'
        + '<th>Pauvret\u00e9</th><th>Prestations</th></tr></thead><tbody>'
        + '<tr class="grp"><td colspan="4">Les plus fragiles socialement</td></tr>'
        + d.exemples.plus_fragiles.map(row).join('')
        + '<tr class="grp"><td colspan="4">Les plus favoris\u00e9s</td></tr>'
        + d.exemples.plus_favorises.map(row).join('')
        + '</tbody></table>';
    }

    var tk = document.getElementById('terr-takeaway');
    if (tk) {
      var f0 = d.exemples.plus_fragiles[0], g0 = d.exemples.plus_favorises[0];
      tk.innerHTML = 'Le lien est net et n\u00e9gatif&nbsp;: plus un d\u00e9partement est pauvre, plus l\u2019IPS de '
        + 'ses coll\u00e8ges est bas. ' + f0.nom + ' (IPS ' + fr(f0.ips_moyen) + ', ' + fr(f0.taux_pauvrete)
        + '&nbsp;% de pauvret\u00e9) et ' + g0.nom + ' (IPS ' + fr(g0.ips_moyen) + ', ' + fr(g0.taux_pauvrete)
        + '&nbsp;%) ne vivent pas la m\u00eame rentr\u00e9e. L\u2019ARS, cibl\u00e9e sur les revenus modestes, '
        + 'atteint donc surtout les territoires \u00e0 IPS faible&nbsp;: elle tombe au bon endroit.';
    }
  });
})();

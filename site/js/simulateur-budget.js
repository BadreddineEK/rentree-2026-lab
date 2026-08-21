/* Section 3 — simulateur personnel de budget rentrée.
   100 % côté client, aucun appel serveur. Élément différenciant (CONSIGNES §3).
   ARS : barèmes CAF 2026 par tranche d'âge. Coût : moyenne/médiane UFC-Que Choisir 2026. */
(function () {
  var app = document.getElementById('simulateur-app');
  if (!app) return;

  var ARS = { '6-10 ans': 426.87, '11-14 ans': 450.41, '15-18 ans': 466.02 };
  var COUT_MOY = 488, COUT_MED = 261; // par enfant, UFC-Que Choisir 2026
  var TRANCHES = Object.keys(ARS);
  var euro = function (v) { return v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '\u00a0\u20ac'; };

  var nbSel = document.getElementById('sim-nb');
  var wrap = document.getElementById('sim-enfants');
  var out = document.getElementById('sim-result');

  function renderEnfants(n) {
    var html = '';
    for (var i = 1; i <= n; i++) {
      html += '<div class="sim-enfant"><span class="idx">Enfant ' + i + '</span>'
        + '<label>\u00c2ge <select class="sim-age" data-i="' + i + '">'
        + TRANCHES.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('')
        + '</select></label></div>';
    }
    wrap.innerHTML = html;
    wrap.querySelectorAll('.sim-age').forEach(function (s) { s.addEventListener('change', compute); });
  }

  function compute() {
    var ages = Array.prototype.map.call(wrap.querySelectorAll('.sim-age'), function (s) { return s.value; });
    var ars = ages.reduce(function (a, t) { return a + ARS[t]; }, 0);
    var nb = ages.length;
    var coutMoy = nb * COUT_MOY, coutMed = nb * COUT_MED;
    var resteMoy = ars - coutMoy, resteMed = ars - coutMed;
    var verdict;
    if (resteMed >= 0 && resteMoy >= 0) verdict = 'Dans ce cas, l\u2019ARS <b>couvre</b> la rentr\u00e9e, m\u00eame au co\u00fbt moyen.';
    else if (resteMed >= 0) verdict = 'L\u2019ARS <b>couvre la rentr\u00e9e m\u00e9diane</b> (' + euro(coutMed) + '), mais pas une rentr\u00e9e au co\u00fbt moyen (' + euro(coutMoy) + ', reste ' + euro(Math.abs(resteMoy)) + ' \u00e0 charge).';
    else verdict = 'Ici l\u2019ARS <b>ne suffit pas</b> : il reste de ' + euro(Math.abs(resteMed)) + ' \u00e0 ' + euro(Math.abs(resteMoy)) + ' \u00e0 votre charge selon le niveau de d\u00e9pense.';
    out.innerHTML =
      '<div class="sim-box ars"><span class="big">' + euro(ars) + '</span><span class="lbl">ARS totale attendue</span></div>'
      + '<div class="sim-box cost"><span class="big">' + euro(coutMed) + ' \u2013 ' + euro(coutMoy) + '</span><span class="lbl">Co\u00fbt estim\u00e9 (m\u00e9diane \u2192 moyenne)</span></div>'
      + '<p class="sim-verdict">' + verdict + '</p>';
  }

  nbSel.addEventListener('change', function () { renderEnfants(parseInt(nbSel.value, 10)); compute(); });
  renderEnfants(1);
  compute();
})();

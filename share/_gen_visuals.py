"""Génère des SVG statiques à partir des données réelles, pour les intégrer dans le
carrousel (nuage de points de corrélation, mini courbes d'évolution). Sortie : des
fichiers .txt contenant le markup SVG, à coller dans share/carousel.html.

Lancement : python share/_gen_visuals.py
"""

import json
from pathlib import Path

DATA = Path(__file__).parents[1] / "site" / "data"
HERE = Path(__file__).parent


def _scatter() -> str:
    d = json.loads((DATA / "correlation.json").read_text(encoding="utf-8"))
    pts = d["points"]
    reg = d["regression"]
    r = d["correlation_calculee"]["r_pearson"]

    W, H = 904, 470
    L, R, T, B = 96, 20, 30, 58
    xs = [p["ips"] for p in pts]
    ys = [p["revenu_median"] for p in pts]
    xmin, xmax = min(xs), max(xs)
    ymin, ymax = min(ys), max(ys)
    # marges de domaine
    xpad = (xmax - xmin) * 0.04
    ypad = (ymax - ymin) * 0.06
    xmin -= xpad; xmax += xpad; ymin -= ypad; ymax += ypad

    def sx(x): return L + (x - xmin) / (xmax - xmin) * (W - L - R)
    def sy(y): return H - B - (y - ymin) / (ymax - ymin) * (H - T - B)

    circles = "".join(
        f'<circle cx="{sx(p["ips"]):.1f}" cy="{sy(p["revenu_median"]):.1f}" r="6" '
        f'fill="rgba(53,80,107,0.5)"/>'
        for p in pts
    )
    # droite de régression
    x1, x2 = xmin + xpad, xmax - xpad
    y1 = reg["pente"] * x1 + reg["ordonnee_origine"]
    y2 = reg["pente"] * x2 + reg["ordonnee_origine"]
    line = (f'<line x1="{sx(x1):.1f}" y1="{sy(y1):.1f}" x2="{sx(x2):.1f}" y2="{sy(y2):.1f}" '
            f'stroke="#a3472f" stroke-width="4"/>')
    axes = (f'<line x1="{L}" y1="{H-B}" x2="{W-R}" y2="{H-B}" stroke="#d3ccbc" stroke-width="2"/>'
            f'<line x1="{L}" y1="{T}" x2="{L}" y2="{H-B}" stroke="#d3ccbc" stroke-width="2"/>')
    labels = (
        f'<text x="{(L + W - R) / 2:.0f}" y="{H-14}" text-anchor="middle" '
        f'font-size="24" fill="#8c887e" font-family="sans-serif">IPS moyen des collèges &#8594;</text>'
        f'<text x="26" y="{(T + H - B) / 2:.0f}" text-anchor="middle" font-size="24" fill="#8c887e" '
        f'font-family="sans-serif" transform="rotate(-90 26 {(T + H - B) / 2:.0f})">Niveau de vie &#8594;</text>'
    )
    rtext = (f'<text x="{L+22}" y="{T+64}" font-size="88" fill="#9c3b2e" font-weight="700" '
             f'font-family="Georgia,serif">r = {str(r).replace(".", ",")[:4]}</text>')
    return (f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" '
            f'aria-label="Nuage de points IPS des collèges contre niveau de vie">'
            f'{axes}{circles}{line}{rtext}{labels}</svg>')


def _evolution() -> str:
    d = json.loads((DATA / "ips_evolution.json").read_text(encoding="utf-8"))
    series = d["series"]
    cols = {"Écoles": "#4a7a55", "Collèges": "#35506b", "Lycées": "#a3472f"}
    W, H = 820, 300
    L, R, T, B = 20, 20, 40, 30
    all_years = sorted({p["annee"] for s in series for p in s["points"]})
    emin = min(p["ecart_prive_public"] for s in series for p in s["points"])
    emax = max(p["ecart_prive_public"] for s in series for p in s["points"])
    emin -= 2; emax += 2

    def sx(a): return L + all_years.index(a) / (len(all_years) - 1) * (W - L - R)
    def sy(e): return H - B - (e - emin) / (emax - emin) * (H - T - B)

    parts = []
    for s in series:
        c = cols.get(s["niveau"], "#35506b")
        pts = s["points"]
        poly = " ".join(f'{sx(p["annee"]):.1f},{sy(p["ecart_prive_public"]):.1f}' for p in pts)
        parts.append(f'<polyline points="{poly}" fill="none" stroke="{c}" stroke-width="5" '
                     f'stroke-linecap="round" stroke-linejoin="round"/>')
        for p in pts:
            parts.append(f'<circle cx="{sx(p["annee"]):.1f}" cy="{sy(p["ecart_prive_public"]):.1f}" '
                         f'r="7" fill="{c}"/>')
        last = pts[-1]
        parts.append(f'<text x="{sx(last["annee"]) + 14:.1f}" y="{sy(last["ecart_prive_public"]) + 8:.1f}" '
                     f'font-size="24" fill="{c}" font-family="sans-serif" font-weight="600">{s["niveau"]}</text>')
    return (f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" '
            f'aria-label="Évolution de l\'écart privé-public par niveau">{"".join(parts)}</svg>')


if __name__ == "__main__":
    (HERE / "_scatter.svg.txt").write_text(_scatter(), encoding="utf-8")
    (HERE / "_evolution.svg.txt").write_text(_evolution(), encoding="utf-8")
    print("OK — _scatter.svg.txt et _evolution.svg.txt générés.")

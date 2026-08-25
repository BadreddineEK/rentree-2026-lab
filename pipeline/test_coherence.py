"""Garde-fou de cohérence des datasets.

La valeur « photo » du dernier millésime (ips_par_niveau.json, utilisée en section 1
de l'article) doit coïncider avec le dernier point de la série temporelle
(ips_evolution.json, section 2), pour chaque niveau. Sinon, l'article afficherait
deux chiffres différents pour la même chose si les données étaient mises à jour sans
synchroniser les millésimes.

Lancement :
    python -m pytest pipeline/test_coherence.py -q
    (ou simplement : python pipeline/test_coherence.py)
"""

import json
from pathlib import Path

DATA = Path(__file__).parents[1] / "site" / "data"


def _load(name: str) -> dict:
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def test_ecart_photo_egal_dernier_point_serie() -> None:
    par_niveau = {n["niveau"]: n for n in _load("ips_par_niveau.json")["niveaux"]}
    series = {s["niveau"]: s for s in _load("ips_evolution.json")["series"]}

    assert set(par_niveau) == set(series), "niveaux différents entre les deux datasets"

    for niveau, photo in par_niveau.items():
        points = series[niveau]["points"]
        assert points, f"série temporelle vide pour {niveau}"
        dernier = points[-1]
        assert dernier["annee"] == photo["annee_reference"], (
            f"{niveau} : millésime section 1 ({photo['annee_reference']}) "
            f"!= dernier point de la série ({dernier['annee']})"
        )
        assert dernier["ecart_prive_public"] == photo["ecart_prive_public"], (
            f"{niveau} : écart privé/public section 1 ({photo['ecart_prive_public']}) "
            f"!= dernier point de la série ({dernier['ecart_prive_public']})"
        )


if __name__ == "__main__":
    test_ecart_photo_egal_dernier_point_serie()
    print("OK — cohérence section 1 (photo) / section 2 (série) vérifiée pour tous les niveaux.")

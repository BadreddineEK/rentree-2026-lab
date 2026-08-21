"""
Nettoyage, jointures et calculs. Consomme pipeline/raw/ (produit par fetch_data.py)
et exporte des JSON statiques dans site/data/ (voir CONSIGNES.md §6 et §7).

RÈGLE STRICTE (CONSIGNES) : chaque fichier JSON porte un champ "source" et
"annee_reference" pour chaque donnée. Aucune valeur n'est inventée : les coûts et
l'ARS sont des valeurs éditoriales validées (CONSIGNES §4, sources UFC-Que Choisir
et CAF), tout le reste est calculé à partir des données officielles téléchargées.

Lancement :
    python fetch_data.py && python build_dataset.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats

RAW = Path(__file__).parent / "raw"
OUT = Path(__file__).parents[1] / "site" / "data"
OUT.mkdir(parents=True, exist_ok=True)

IPS_ANNEE = "2025-2026"
REVENU_ANNEE = 2021
IVAC_ANNEE = "session 2025 (DNB)"

SRC_IPS = "DEPP — Indice de position sociale des collèges (data.education.gouv.fr, fr-en-ips-colleges-ap2023)"
SRC_REVENU = "INSEE — Filosofi 2021, médiane du niveau de vie par département (base tous niveaux géographiques, géo. 01/01/2025)"
SRC_PAUVRETE = "INSEE — Filosofi 2021, taux de pauvreté (seuil 60% du niveau de vie médian) et part des prestations sociales dans le revenu disponible, par département"
SRC_EP = "Ministère de l'Éducation nationale — Annuaire de l'éducation (statut REP / REP+)"
SRC_IVAC = "DEPP — Indicateurs de valeur ajoutée des collèges (data.education.gouv.fr, fr-en-indicateurs-valeur-ajoutee-colleges)"


def _norm_dep(code: str) -> str:
    """Normalise un code département : 2 chiffres métropole, 2A/2B Corse, 3 chiffres DROM."""
    c = str(code).strip().upper()
    if c.isdigit():
        return c.zfill(2) if len(c) <= 2 else c
    return c


def _round(x, n=1):
    return None if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), n)


def _load_ips() -> pd.DataFrame:
    df = pd.DataFrame(json.loads((RAW / "ips_colleges_2025-2026.json").read_text(encoding="utf-8")))
    df["ips"] = pd.to_numeric(df["ips"], errors="coerce")
    df["dep"] = df["code_du_departement"].map(_norm_dep)
    return df.dropna(subset=["ips"])


def _load_revenu() -> pd.DataFrame:
    f = pd.read_csv(RAW / "filosofi_2021.csv", sep=";", dtype=str,
                    usecols=["GEO", "GEO_OBJECT", "FILOSOFI_MEASURE", "OBS_VALUE"])
    f = f[f["GEO_OBJECT"] == "DEP"].copy()
    f["dep"] = f["GEO"].map(_norm_dep)
    f["val"] = pd.to_numeric(f["OBS_VALUE"], errors="coerce")
    piv = f.pivot_table(index="dep", columns="FILOSOFI_MEASURE", values="val", aggfunc="first")
    out = pd.DataFrame(index=piv.index)
    out["revenu_median"] = piv.get("MED_SL")
    out["taux_pauvrete"] = piv.get("PR_MD60")
    out["part_prestations"] = piv.get("S_SOC_BEN_DI")
    return out.reset_index().dropna(subset=["revenu_median"])


# ── 1. Coût de la rentrée + ARS (valeurs éditoriales validées, CONSIGNES §4) ──
def build_cout_rentree_dataset() -> None:
    moyenne, mediane = 488, 261
    ars = [
        {"tranche": "6-10 ans", "montant_eur": 426.87, "source": "CAF / service-public.gouv.fr", "annee_reference": 2026},
        {"tranche": "11-14 ans", "montant_eur": 450.41, "source": "CAF / service-public.gouv.fr", "annee_reference": 2026},
        {"tranche": "15-18 ans", "montant_eur": 466.02, "source": "CAF / service-public.gouv.fr", "annee_reference": 2026},
    ]
    # Couverture : combien l'ARS couvre du coût médian et du coût moyen (calculé, pas inventé).
    couverture = [
        {
            "tranche": a["tranche"],
            "ars_eur": a["montant_eur"],
            "vs_mediane_eur": _round(a["montant_eur"] - mediane, 0),
            "vs_mediane_pct": _round(a["montant_eur"] / mediane * 100, 0),
            "vs_moyenne_eur": _round(a["montant_eur"] - moyenne, 0),
            "vs_moyenne_pct": _round(a["montant_eur"] / moyenne * 100, 0),
        }
        for a in ars
    ]
    data = {
        "meta": {
            "titre": "Coût de la rentrée 2026 et allocation de rentrée scolaire",
            "note": "Valeurs éditoriales validées (CONSIGNES §4). Non issues d'une API : "
                    "UFC-Que Choisir ne publie pas d'open data, les montants ARS sont réglementaires. "
                    "La couverture est calculée à partir de ces valeurs.",
        },
        "cout": {
            "moyenne_eur": moyenne,
            "mediane_eur": mediane,
            "ecart_moyenne_mediane_eur": moyenne - mediane,
            "lecture": "La moyenne (488€) est tirée vers le haut par les plus grosses dépenses ; "
                       "la médiane (261€) décrit mieux le foyer typique.",
            "source": "UFC-Que Choisir / Que Choisir Ensemble",
            "annee_reference": 2026,
        },
        "ars": ars,
        "couverture": couverture,
        "verdict": {
            "mediane_couverte": True,
            "moyenne_couverte": False,
            "resume": "L'ARS couvre intégralement la rentrée médiane (261€) et au-delà, quelle que soit "
                      "la tranche d'âge. Elle ne devient insuffisante que face à la moyenne (488€), "
                      "gonflée par les plus grosses dépenses — et encore, elle en couvre 87 à 95 %.",
        },
        "ars_versee_le": "18 août 2026",
    }
    _write("cout_rentree.json", data)


# ── 2. IPS agrégé par département ──
def build_ips_map_dataset() -> pd.DataFrame:
    ips = _load_ips()
    g = ips.groupby(["dep", "departement"]).agg(
        ips_moyen=("ips", "mean"), n_colleges=("ips", "size")).reset_index()
    pub = ips[ips["secteur"] == "public"].groupby("dep")["ips"].mean()
    pri = ips[ips["secteur"] == "privé sous contrat"].groupby("dep")["ips"].mean()
    g["ips_public"] = g["dep"].map(pub)
    g["ips_prive"] = g["dep"].map(pri)

    departements = [
        {
            "code": r.dep, "nom": r.departement,
            "ips_moyen": _round(r.ips_moyen), "ips_public": _round(r.ips_public),
            "ips_prive": _round(r.ips_prive), "n_colleges": int(r.n_colleges),
        }
        for r in g.itertuples()
    ]
    data = {
        "meta": {
            "source": SRC_IPS,
            "annee_reference": IPS_ANNEE,
            "definition_ips": "L'IPS (indice de position sociale) résume l'environnement social des "
                              "élèves d'un établissement : plus il est élevé, plus le public est favorisé. "
                              "La moyenne nationale est calée autour de 100.",
            "methode": "Moyenne simple des IPS des collèges du département (public + privé sous contrat).",
            "n_colleges_total": int(len(ips)),
        },
        "departements": sorted(departements, key=lambda d: d["code"]),
    }
    _write("ips_departements.json", data)
    return g


# ── 3. Corrélation IPS départemental × revenu médian ──
def build_correlation_dataset(ips_dep: pd.DataFrame) -> None:
    rev = _load_revenu()
    m = ips_dep.merge(rev, on="dep", how="inner").dropna(subset=["ips_moyen", "revenu_median"])
    x = m["ips_moyen"].to_numpy(float)
    y = m["revenu_median"].to_numpy(float)
    r, p = stats.pearsonr(x, y)
    slope, intercept = np.polyfit(x, y, 1)

    REF = 0.87
    divergence = abs(r - REF) > 0.10

    data = {
        "meta": {
            "titre": "Lien entre position sociale des collèges et niveau de vie du territoire",
            "avertissement": "Corrélation n'est pas causalité. Ce graphique montre que deux faits "
                             "varient ensemble à l'échelle départementale, pas que l'un cause l'autre.",
        },
        "points": [
            {"code": t.dep, "nom": t.departement,
             "ips": _round(t.ips_moyen), "revenu_median": int(round(t.revenu_median)),
             "n_colleges": int(t.n_colleges)}
            for t in m.itertuples()
        ],
        "regression": {"pente": _round(slope, 2), "ordonnee_origine": _round(intercept, 1)},
        "correlation_calculee": {
            "r_pearson": _round(r, 3),
            "r2": _round(r * r, 3),
            "p_value": float(f"{p:.2e}"),
            "n_departements": int(len(m)),
            "niveau_geographique": "département (agrégat)",
            "variables": "IPS moyen des collèges × médiane du niveau de vie",
            "sources": [SRC_IPS, SRC_REVENU],
            "annee_reference": {"ips": IPS_ANNEE, "revenu": REVENU_ANNEE},
        },
        "reference_publiee": {
            "r": REF,
            "description": "corrélation entre l'IPS des élèves de 3e et le revenu médian de leur commune",
            "niveau_geographique": "commune (élève)",
            "source": "DEPP, Note d'Information n°23.16 (mars 2023), d'après Murat (2021)",
            "annee_reference": 2023,
        },
        "note_comparaison": (
            "La référence DEPP (0,87) est mesurée au niveau communal sur l'IPS des élèves ; "
            "ici je recalcule le lien au niveau départemental sur l'IPS moyen des collèges — "
            "unité d'analyse différente, donc valeur attendue proche mais non identique."
        ),
        "divergence_significative": bool(divergence),
    }
    _write("correlation.json", data)
    print(f"[CORR] r_departemental = {r:.3f} (n={len(m)}) | ref DEPP communal = {REF} | "
          f"divergence>0.10 : {divergence}")


# ── 3bis. Géographie sociale : pauvreté, prestations, exemples de territoires ──
def build_territoire_social_dataset(ips_dep: pd.DataFrame) -> None:
    """L'ARS est versée sous conditions de ressources : elle cible les foyers modestes.
    Ce dataset montre OÙ ces foyers se concentrent, et que ces territoires ont aussi
    l'IPS scolaire le plus bas. Deux corrélations calculées, plus des exemples réels."""
    rev = _load_revenu()
    m = ips_dep.merge(rev, on="dep", how="inner").dropna(subset=["ips_moyen"])

    def _corr(col):
        s = m.dropna(subset=[col])
        r, p = stats.pearsonr(s["ips_moyen"].to_numpy(float), s[col].to_numpy(float))
        return {"r_pearson": _round(r, 3), "n_departements": int(len(s)), "p_value": float(f"{p:.2e}")}

    corr_pauvrete = _corr("taux_pauvrete")
    corr_prestations = _corr("part_prestations")

    def _ex(row):
        return {
            "code": row.dep, "nom": row.departement,
            "ips_moyen": _round(row.ips_moyen),
            "taux_pauvrete": _round(row.taux_pauvrete, 1),
            "part_prestations": _round(row.part_prestations, 1),
            "revenu_median": int(round(row.revenu_median)),
        }

    mp = m.dropna(subset=["taux_pauvrete"])
    plus_fragiles = [_ex(r) for r in mp.nsmallest(3, "ips_moyen").itertuples()]
    plus_favorises = [_ex(r) for r in mp.nlargest(3, "ips_moyen").itertuples()]

    data = {
        "meta": {
            "titre": "L'ARS va-t-elle là où le besoin se concentre ?",
            "explication": "L'ARS est versée sous conditions de ressources : elle atteint surtout les "
                           "foyers modestes. Ce dataset situe ces foyers (taux de pauvreté, dépendance "
                           "aux prestations sociales) et montre que les territoires les plus fragiles "
                           "socialement sont aussi ceux dont les collèges ont l'IPS le plus bas.",
            "sources": [SRC_IPS, SRC_PAUVRETE],
            "annee_reference": {"ips": IPS_ANNEE, "filosofi": REVENU_ANNEE},
            "definitions": {
                "taux_pauvrete": "Part de la population vivant sous le seuil de pauvreté (60 % du niveau "
                                 "de vie médian national), en %.",
                "part_prestations": "Part des prestations sociales (dont allocations familiales, minima "
                                    "sociaux, aides au logement) dans le revenu disponible des ménages, en %.",
            },
        },
        "correlations": {
            "ips_x_taux_pauvrete": corr_pauvrete,
            "ips_x_part_prestations": corr_prestations,
            "lecture": "Plus le taux de pauvreté et la dépendance aux prestations sont élevés dans un "
                       "département, plus l'IPS moyen de ses collèges est bas. L'ARS, ciblée sur les "
                       "revenus modestes, se déverse donc en priorité dans les territoires à IPS faible.",
        },
        "exemples": {
            "plus_fragiles": plus_fragiles,
            "plus_favorises": plus_favorises,
        },
        "points": [
            {"code": r.dep, "nom": r.departement, "ips": _round(r.ips_moyen),
             "taux_pauvrete": _round(r.taux_pauvrete, 1), "part_prestations": _round(r.part_prestations, 1)}
            for r in mp.itertuples()
        ],
    }
    _write("territoire_social.json", data)
    print(f"[TERR] IPS x pauvrete r={corr_pauvrete['r_pearson']} | "
          f"IPS x prestations r={corr_prestations['r_pearson']} (n={len(mp)})")


# ── 4. Comparaison secteur (public/privé) et éducation prioritaire (REP/REP+) ──
def build_secteur_comparison_dataset() -> None:
    ips = _load_ips()
    ep = pd.DataFrame(json.loads((RAW / "education_prioritaire_colleges.json").read_text(encoding="utf-8")))
    ep = ep.rename(columns={"identifiant_de_l_etablissement": "uai",
                            "appartenance_education_prioritaire": "ep"})
    merged = ips.merge(ep[["uai", "ep"]], on="uai", how="left")
    merged["ep_label"] = merged["ep"].fillna("").replace({"": "Hors éducation prioritaire"})

    secteur = [
        {"label": "Public", "ips_moyen": _round(ips[ips.secteur == "public"]["ips"].mean()),
         "n": int((ips.secteur == "public").sum())},
        {"label": "Privé sous contrat", "ips_moyen": _round(ips[ips.secteur == "privé sous contrat"]["ips"].mean()),
         "n": int((ips.secteur == "privé sous contrat").sum())},
    ]
    order = ["Hors éducation prioritaire", "REP", "REP+"]
    ep_rows = []
    for lab in order:
        sub = merged[merged["ep_label"] == lab]["ips"]
        if len(sub):
            ep_rows.append({"label": lab, "ips_moyen": _round(sub.mean()), "n": int(len(sub))})

    data = {
        "meta": {"annee_reference": IPS_ANNEE,
                 "definition_ep": "REP et REP+ (réseaux d'éducation prioritaire) concentrent les "
                                  "collèges au public le plus défavorisé ; REP+ est le degré le plus marqué."},
        "secteur": {"source": SRC_IPS, "annee_reference": IPS_ANNEE, "valeurs": secteur},
        "education_prioritaire": {"source": f"{SRC_IPS} joint à {SRC_EP}",
                                  "annee_reference": IPS_ANNEE, "valeurs": ep_rows},
    }
    _write("secteur_comparison.json", data)


# ── 5. Nuance IVAC (pour la section « ce que ça ne dit pas ») ──
def build_ivac_nuance_dataset() -> None:
    ips = _load_ips()[["uai", "ips"]]
    ivac = pd.DataFrame(json.loads((RAW / "ivac_colleges_2025.json").read_text(encoding="utf-8")))
    ivac["va"] = pd.to_numeric(ivac["va_du_taux_de_reussite_g"], errors="coerce")
    m = ips.merge(ivac[["uai", "va"]], on="uai", how="inner").dropna(subset=["ips", "va"])
    q1 = m["ips"].quantile(0.25)
    bas = m[m["ips"] <= q1]
    part_positive = float((bas["va"] > 0).mean() * 100)

    # Distribution de la valeur ajoutée par quartile d'IPS (pour un vrai graphique).
    m = m.copy()
    m["quartile"] = pd.qcut(m["ips"], 4, labels=["Q1", "Q2", "Q3", "Q4"])
    labels = {
        "Q1": "Q1 · les plus défavorisés",
        "Q2": "Q2",
        "Q3": "Q3",
        "Q4": "Q4 · les plus favorisés",
    }
    par_quartile = []
    for q in ["Q1", "Q2", "Q3", "Q4"]:
        sub = m[m["quartile"] == q]
        par_quartile.append({
            "quartile": q,
            "label": labels[q],
            "va_moyenne": _round(sub["va"].mean(), 1),
            "part_va_positive_pct": _round((sub["va"] > 0).mean() * 100, 0),
            "n_colleges": int(len(sub)),
        })

    data = {
        "meta": {
            "source": SRC_IVAC,
            "annee_reference": IVAC_ANNEE,
            "definition": "La valeur ajoutée (VA) compare le taux de réussite au DNB observé d'un collège "
                          "à celui attendu compte tenu du profil de ses élèves. VA positive = l'établissement "
                          "fait mieux qu'attendu. Elle est calculée à profil social donné : un collège à IPS "
                          "faible peut avoir une VA fortement positive.",
        },
        "part_ips_bas_va_positive_pct": _round(part_positive, 0),
        "n_colleges_ips_bas": int(len(bas)),
        "seuil_ips_bas": f"quart le plus défavorisé (IPS ≤ {q1:.0f}, 1er quartile)",
        "par_quartile_ips": par_quartile,
        "lecture": "Une part importante des collèges les plus défavorisés socialement font mieux "
                   "que ce que leur profil laisserait attendre : l'IPS décrit un contexte, pas une fatalité.",
    }
    _write("ivac_nuance.json", data)
    print(f"[IVAC] {part_positive:.0f}% des collèges à IPS bas (n={len(bas)}) ont une VA positive")


def _write(name: str, data: dict) -> None:
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OUT]  site/data/{name}")


if __name__ == "__main__":
    build_cout_rentree_dataset()
    ips_dep = build_ips_map_dataset()
    build_correlation_dataset(ips_dep)
    build_territoire_social_dataset(ips_dep)
    build_secteur_comparison_dataset()
    build_ivac_nuance_dataset()
    print("OK — JSON exportés dans", OUT)

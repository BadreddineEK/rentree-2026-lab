"""
Téléchargement des sources officielles (voir CONSIGNES.md §4).

Ce script NE tourne jamais en production : il produit des fichiers bruts dans
pipeline/raw/, ensuite nettoyés et agrégés par build_dataset.py vers site/data/.

Sources (toutes officielles, datées) :
  1. IPS collèges  — DEPP, data.education.gouv.fr, dataset "fr-en-ips-colleges-ap2023"
                     millésime le plus récent disponible : rentrée 2025-2026.
  2. IVAC collèges — DEPP, data.education.gouv.fr, dataset
                     "fr-en-indicateurs-valeur-ajoutee-colleges", session 2025.
  3. Revenu médian par département — INSEE Filosofi 2021 (dernier millésime publié),
                     base "tous niveaux géographiques" (géographie au 01/01/2025).
  4. Statut éducation prioritaire (REP / REP+) par collège — annuaire de l'éducation
                     (data.education.gouv.fr), joint à l'IPS par UAI pour la section secteur.

Lancement :
    pip install -r requirements.txt
    python fetch_data.py
"""

from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import requests

RAW = Path(__file__).parent / "raw"
RAW.mkdir(exist_ok=True)

UA = {"User-Agent": "rentree-2026-lab/1.0 (data pipeline; contact: badreddineek.com)"}
TIMEOUT = 90

ODS_EDU = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets"

# --- 1. IPS collèges -------------------------------------------------------
# API Opendatasoft (export JSON complet, filtré sur la rentrée la plus récente).
# Équivalent curl :
#   curl "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/\
#   fr-en-ips-colleges-ap2023/exports/json?where=rentree_scolaire%3D%222025-2026%22" \
#   -o raw/ips_colleges_2025-2026.json
IPS_DATASET = "fr-en-ips-colleges-ap2023"
IPS_RENTREE = "2025-2026"
IPS_OUT = RAW / "ips_colleges_2025-2026.json"


def fetch_ips_colleges() -> Path:
    url = f"{ODS_EDU}/{IPS_DATASET}/exports/json"
    params = {"where": f'rentree_scolaire="{IPS_RENTREE}"'}
    r = requests.get(url, params=params, headers=UA, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    IPS_OUT.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print(f"[IPS]  {len(data)} colleges (rentree {IPS_RENTREE}) -> {IPS_OUT.name}")
    return IPS_OUT


# --- 2. IVAC collèges ------------------------------------------------------
# Indicateurs de valeur ajoutée (session DNB la plus récente : 2025).
# Sert uniquement à la section « ce que ça ne dit pas » (un collège à IPS
# faible peut avoir une valeur ajoutée positive).
IVAC_DATASET = "fr-en-indicateurs-valeur-ajoutee-colleges"
IVAC_SESSION_YEAR = 2025
IVAC_OUT = RAW / "ivac_colleges_2025.json"


def fetch_ivac_colleges() -> Path:
    url = f"{ODS_EDU}/{IVAC_DATASET}/exports/json"
    params = {"where": f"year(session)={IVAC_SESSION_YEAR}"}
    r = requests.get(url, params=params, headers=UA, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    IVAC_OUT.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print(f"[IVAC] {len(data)} colleges (session {IVAC_SESSION_YEAR}) -> {IVAC_OUT.name}")
    return IVAC_OUT


# --- 3. Revenu médian par département (INSEE Filosofi 2021) -----------------
# Base "tous niveaux géographiques" (contient région, département, commune...).
# On télécharge le zip CSV officiel et on extrait le CSV brut dans raw/.
# Équivalent manuel :
#   curl -L "https://www.insee.fr/fr/statistiques/fichier/7756729/\
#   base-cc-filosofi-2021-geo2025_csv.zip" -o raw/filosofi_2021.zip && unzip ...
FILOSOFI_ZIP_URL = (
    "https://www.insee.fr/fr/statistiques/fichier/7756729/"
    "base-cc-filosofi-2021-geo2025_csv.zip"
)
FILOSOFI_OUT = RAW / "filosofi_2021.csv"


def fetch_revenu_median() -> Path:
    r = requests.get(FILOSOFI_ZIP_URL, headers=UA, timeout=TIMEOUT)
    r.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
        csv_names = [n for n in zf.namelist() if n.lower().endswith(".csv")]
        if not csv_names:
            raise RuntimeError(f"Aucun CSV dans le zip Filosofi : {zf.namelist()}")
        # Le plus gros CSV = la base de données (les autres sont des méta/dicos).
        target = max(csv_names, key=lambda n: zf.getinfo(n).file_size)
        with zf.open(target) as src:
            FILOSOFI_OUT.write_bytes(src.read())
    print(f"[REV]  Filosofi 2021 extrait ({target}) -> {FILOSOFI_OUT.name}")
    return FILOSOFI_OUT


# --- 4. Statut éducation prioritaire (REP / REP+) par collège ---------------
# Annuaire de l'éducation : on ne garde que l'UAI et le statut EP, pour joindre
# à l'IPS (le dataset IPS ne porte pas le flag REP/REP+). Valeurs : "", REP, REP+.
ANNUAIRE_DATASET = "fr-en-annuaire-education"
EP_OUT = RAW / "education_prioritaire_colleges.json"


def fetch_education_prioritaire() -> Path:
    url = f"{ODS_EDU}/{ANNUAIRE_DATASET}/exports/json"
    params = {
        "where": 'type_etablissement="Collège"',
        "select": "identifiant_de_l_etablissement,appartenance_education_prioritaire",
    }
    r = requests.get(url, params=params, headers=UA, timeout=TIMEOUT)
    r.raise_for_status()
    data = r.json()
    EP_OUT.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    print(f"[EP]   {len(data)} colleges (statut education prioritaire) -> {EP_OUT.name}")
    return EP_OUT


if __name__ == "__main__":
    fetch_ips_colleges()
    fetch_ivac_colleges()
    fetch_revenu_median()
    fetch_education_prioritaire()
    print("OK — sources brutes dans", RAW)

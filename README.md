# 🎒 Rentrée 2026 Lab

> Troisième post de la série « actualité + preuve technique + pédagogie », et premier de la nouvelle collection **Lab** (explainers interactifs statiques, hors Streamlit).

## Le sujet

On me dit chaque année que l'allocation de rentrée scolaire (ARS) ne suffit pas. Ce Lab vérifie ça avec de vraies données officielles —ARS 2026, coût réel des achats de rentrée, indice de position sociale (IPS) des établissements, et revenu médian par territoire — pour montrer que la moyenne nationale cache une vraie géographie sociale, sans pour autant forcer une causalité que les chiffres ne prouvent pas.

**Voir le brief éditorial complet et les contraintes de contenu dans [CONSIGNES.md](./CONSIGNES.md).**

## Pourquoi un format « Lab » (pas une 3e app Streamlit)

- Chargement instantané (pas de cold-start serveur)
- Format réutilisable pour toute la future série d'explainers interactifs
- Hébergement statique sur Cloudflare Pages, cohérent avec l'infra existante (badreddineek.com)

## Stack technique

- **Pipeline data** (`/pipeline`) : Python (pandas), traite les sources officielles et exporte des JSON/CSV statiques. Ne tourne jamais en production.
- **Frontend** (`/site`) : HTML/CSS/JS pur (ou léger framework statique), D3.js/Plotly.js pour les graphiques, Leaflet.js pour la carte choropèthe.
- **Déploiement** : Cloudflare Pages, sous-domaine à définir (`labs.badreddineek.com` ou `rentree.badreddineek.com`).

## Sources de données (officielles, datées)

- ARS 2026 : CAF / service-public.gouv.fr
- Coût moyen/médian rentrée 2026 : UFC-Que Choisir
- IPS écoles/collèges : DEPP, data.education.gouv.fr
- Revenu médian par territoire : INSEE Filosofi
- IVAC (indicateurs de valeur ajoutée) : DEPP / data.gouv.fr

Liste complète avec valeurs exactes et années de référence dans [CONSIGNES.md §4](./CONSIGNES.md#4-données-à-utiliser-vérifiées-avec-source-et-date).

## Structure du repo

```
rentree-2026-lab/
├── CONSIGNES.md      # brief éditorial et technique complet (lire en premier)
├── pipeline/         # collecte + traitement des données (Python)
├── site/             # frontend statique (déployé sur Cloudflare Pages)
└── assets/           # visuels exportés pour le carrousel LinkedIn
```

## Lancer le pipeline localement

```bash
cd pipeline
pip install -r requirements.txt
python fetch_data.py
python build_dataset.py
```

## Servir le site en local

```bash
cd site
python -m http.server 8000
```

## Statut

🟡 En cours de cadrage — données et narratif validés, construction du pipeline et du frontend à venir.

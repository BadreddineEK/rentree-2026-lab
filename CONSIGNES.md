# CONSIGNES — Brief éditorial et technique complet

> Ce fichier sert de contexte de référence pour tout agent (Copilot, Claude, etc.) qui travaille sur ce repo.
> Il capture les décisions prises après plusieurs tours de cadrage et de stress-test. Ne pas dévier sans relire ce document.

## 1. Contexte et objectif stratégique

Je suis Badreddine EL KHAMLICHI, data scientist (BI/data engineering/dataviz) en mission chez un client pharma à Lyon. Je construis une série de posts LinkedIn pour bâtir ma notoriété AVANT de parler directement de sujets pointus (data management, gouvernance).

Posts déjà publiés :
1. Coupe du Monde 2026 — stats pré-match vs résultats réels (app Streamlit)
2. Canicule 2026 — modèle naïf d'îlot de chaleur urbain à Lyon (app Streamlit)
3. **CE PROJET** : Rentrée 2026 — coût réel, ARS et inégalités sociales scolaires

Ce 3e post lance officiellement la série **"Lab"** : des explainers interactifs, pas de nouvelles apps Streamlit (pour éviter la redondance de format et le cold-start lent de Streamlit Cloud).

## 2. Règle d'or éditoriale

> **Zero bullshit.** Chaque affirmation doit avoir une source officielle vérifiée, datée, et le bon niveau de granularité.
> Le but n'est PAS de faire un post pour poster. Le but est que N'IMPORTE QUEL lecteur, même non-data, apprenne quelque chose de pertinent et vrai, et ressorte avec une info utile — pas une impression de dashboard vide ou de manipulation de chiffres.

Règles strictes :
- Ne jamais forcer un lien de causalité que la donnée ne prouve pas.
- Toujours distinguer corrélation et causalité, explicitement, dans l'app ET dans le post.
- Toujours afficher l'année/la date de référence de chaque donnée utilisée, sur chaque graphique.
- Ne jamais nommer une commune précise en exemple négatif (pas de stigmatisation territoriale). Rester au niveau département/académie.
- Toujours inclure une section "ce que ces données NE disent PAS" — non négociable.
- Ne jamais utiliser une source non officielle ou périmée pour une affirmation chiffrée centrale (voir §5 « Sources à NE PAS utiliser »).

## 3. Angle narratif retenu (après plusieurs itérations)

**Ne PAS ouvrir sur « regardez cette carte des inégalités scolaires »** — ce type de carte IPS existe déjà en plusieurs versions publiques très vues (carte IPS écoles/collèges/lycées avec dizaines de milliers de vues cumulées sur data.gouv.fr). Une carte IPS seule = pas de différenciation, effet « déjà vu » garanti pour un lecteur data-savvy.

**Hook retenu** : angle investigation personnelle.
> « On me dit chaque année que l'ARS ne suffit pas. J'ai voulu vérifier si c'était pareil partout en France, avec de vraies données plutôt qu'une impression. »

La carte IPS devient une PREUVE dans le raisonnement, pas le produit final présenté.

**Fil narratif (ordre imposé)** :
1. Combien coûte vraiment une rentrée en 2026 (fait chiffré isolé, actuel)
2. Où sont les écarts sociaux à l'école (fait chiffré isolé, officiel, DEPP)
3. Le pont statistique VERIFIE entre les deux (corrélation IPS/revenu médian = 0,87, source DEPP Note 23.16)
4. Ce que ça ne prouve PAS (contrepoint IVAC : un collège à IPS faible peut surperformer)
5. Élément différenciant unique : simulateur personnel de budget rentrée (n'existe dans AUCUN outil IPS public trouvé)

**Ne jamais présenter le bloc 1 et le bloc 2 comme se causant l'un l'autre.** Ce sont deux faits distincts reliés par une corrélation publiée (bloc 3), pas par une intuition personnelle.

## 4. Données à UTILISER (vérifiées, avec source et date)

| Donnée | Valeur | Source | Date/année de référence |
|---|---|---|---|
| Coût moyen rentrée 2026 | 488€ | UFC-Que Choisir / Que Choisir Ensemble | 2026 |
| Coût médian rentrée 2026 | 261€ | UFC-Que Choisir / Que Choisir Ensemble | 2026 |
| ARS 6-10 ans | 426,87€ | CAF / service-public.gouv.fr | 2026 (versé 18 août 2026) |
| ARS 11-14 ans | 450,41€ | CAF / service-public.gouv.fr | 2026 |
| ARS 15-18 ans | 466,02€ | CAF / service-public.gouv.fr | 2026 |
| IPS moyen collèges publics | ~102,4 | DEPP | Dernière publication (vérifier année exacte avant usage, ap2023 dataset) |
| IPS moyen collèges privés | ~130,2 | DEPP | Idem |
| IPS REP+ | ~74 | DEPP | Idem |
| Corrélation IPS élèves 3e / revenu médian communal | 0,87 | DEPP, Note d'Information 23.16 (mars 2023), cite Murat 2021 | À citer explicitement |
| Stabilité de l'IPS dans le temps | IPS médian public quasi stable (99,9) sur plusieurs années | SNES, analyse DEPP | Argument pour justifier le décalage temporel des données |
| Revenu médian / niveau de vie par département | Variable selon territoire (ex: Paris 29 730€, Hauts-de-Seine 29 720€) | INSEE, Niveau de vie et pauvreté des territoires | 2021 (donnée la plus récente dispo à ce niveau de granularité) |
| IVAC (indicateurs de valeur ajoutée des collèges) | Dataset officiel disponible | DEPP / data.gouv.fr, dataset "indicateurs-de-valeur-ajoutee-des-colleges" | À utiliser pour la section « ce que ça ne dit pas » |

### Sources primaires à consulter/intégrer
- IPS écoles/collèges (open data) : data.education.gouv.fr (jeux "fr-en-ips-colleges-ap2023", "fr-en-ips_ecoles_v2")
- Indices de ségrégation sociale entre collèges par département : data.gouv.fr "indicateurs-de-segregation-sociale-entre-colleges-dans-les-departements" (NE PAS l'utiliser pour expliquer le coût de la rentrée — voir §6, c'est un contresens à éviter)
- Revenu médian par commune/département : INSEE Filosofi, "Revenus, pauvreté et niveau de vie" / "Base du comparateur de territoires"
- IVAC collèges : data.gouv.fr "indicateurs-de-valeur-ajoutee-des-colleges"
- À explorer en priorité : la carte interactive IPS + Valeur Ajoutée open source mise à jour août 2026 (chercher « Carte Interactive Indice de Position Sociale (IPS) et de Valeur Ajoutée » sur data.gouv.fr) — peut donner une donnée IPS plus fraîche que le dataset officiel brut.

## 5. Sources à NE PAS UTILISER (éliminées après stress-test)

- **Chiffres de « reste à charge annuel » par niveau scolaire** (96€ maternelle → 787€ lycée pro) trouvés sur un blog non officiel (asma-consulting) — ces chiffres datent de **2015**, mesurent une dépense annuelle totale d'éducation (périmètre différent du coût « achats de rentrée » 2026 UFC-Que Choisir). Les mélanger crée une fausse précision sur des données non comparables. **INTERDIT.**
- **Indice de ségrégation sociale entre collèges** utilisé comme explication des écarts de coût de rentrée entre régions — c'est un contresens : cet indice mesure la MIXITE sociale au sein d'un même territoire, pas la richesse relative d'un territoire par rapport à un autre. Ne PAS l'utiliser pour ce narratif (peut être traité dans un post futur, séparément, sur le thème de la mixité scolaire).

## 6. Structure du projet et choix technique

### Pourquoi pas Streamlit (encore)
Déjà utilisé sur les 2 posts précédents. Risque de redondance de format + cold-start lent sur Streamlit Cloud (mauvais pour la conversion clic LinkedIn → visite).

### Stack retenue
- **Pipeline data (Python)** : scripts de collecte/nettoyage/agrégation qui NE tournent JAMAIS en production. Ils produisent des fichiers JSON/CSV statiques exportés dans `site/data/`.
- **Frontend (statique, HTML/CSS/JS)** : consomme uniquement les fichiers pré-calculés. Pas de backend, pas de serveur à maintenir.
- **Hébergement** : Cloudflare Pages, sur un sous-domaine du type `labs.badreddineek.com/rentree-2026` ou `rentree.badreddineek.com`.
- **Libs JS suggérées** : D3.js ou Plotly.js pour les graphiques, Leaflet.js (+ topojson départements France) pour la carte choropèthe, vanilla JS ou framework léger (Astro/Vite) pour la structure de page.

### Arborescence cible
```
rentree-2026-lab/
├── CONSIGNES.md              # ce fichier
├── README.md
├── pipeline/                 # tout le calcul Python (jamais en prod)
│   ├── fetch_data.py         # téléchargement des sources officielles
│   ├── build_dataset.py      # nettoyage, jointures, calcul corrélation
│   ├── requirements.txt
│   └── raw/                  # données brutes téléchargées (gitignore si volumineux)
├── site/                     # frontend statique, déployé sur Cloudflare Pages
│   ├── index.html
│   ├── css/
│   ├── js/
│   │   ├── chart-cout.js
│   │   ├── map-ips.js
│   │   ├── scatter-correlation.js
│   │   └── simulateur-budget.js
│   └── data/                 # JSON/CSV pré-calculés, sortie du pipeline
└── assets/                   # visuels pour le carrousel LinkedIn (export PNG des graphs)
```

## 7. Sections de la page Lab (ordre imposé)

1. **Intro** — hook investigation personnelle (pas de carte en premier)
2. **Coût 2026** — moyenne/médiane, ARS par tranche d'âge, écart
3. **Simulateur personnel** — élément différenciant, calcul JS pur côté client
4. **Carte sociale (IPS)** — choropèthe par département, avec année affichée clairement
5. **Le lien vérifié** — scatter IPS × revenu médian, corrélation 0,87 affichée, source citée
6. **Secteur & éducation prioritaire** — comparatif public/privé/REP/REP+
7. **Ce que ça ne dit pas** — section texte, IVAC, corrélation ≠ causalité, stabilité temporelle expliquée comme argument (pas excuse)
8. **Sources & méthode** — transparence totale, liens vers chaque dataset officiel

## 8. Ton et style

- Français, ton direct, première personne (« j'ai voulu vérifier », pas « il a été constaté que »)
- Accessible à un non-data, mais rigoureux — jamais l'un sans l'autre
- Pas de jargon non expliqué (IPS, corrélation, IVAC doivent être définis en 1 phrase simple au premier usage)
- Aucune formulation qui suggère un jugement de valeur sur un territoire ou une école précise

## 9. Carrousel LinkedIn (8 slides, structure validée)

1. Cover / hook investigation
2. Coût 2026 (bar chart moyenne/médiane + ARS)
3. Carte IPS par département
4. Scatter IPS × revenu médian, corrélation 0,87
5. Public vs privé, REP+ vs hors éducation prioritaire
6. Ce que ça ne dit pas (texte pur, 3 mises en garde)
7. Nuance IVAC (« un collège à IPS faible peut surperformer »)
8. CTA — lien vers le Lab en commentaire

## 10. Points ouverts à trancher avant mise en prod

- [ ] Vérifier si la carte interactive IPS+VA open source (août 2026) expose une donnée plus fraîche que le dataset officiel brut — investiguer son repo GitHub source si mentionné publiquement.
- [ ] Choisir granularité finale de la carte revenu (département recommandé pour matcher l'IPS, éviter la commune trop lourde à traiter et plus difficile à anonymiser proprement).
- [ ] Définir le sous-domaine exact (`labs.badreddineek.com` vs `rentree.badreddineek.com`) et configurer le CNAME Cloudflare en conséquence.

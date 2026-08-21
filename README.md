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

---

## Déploiement sur Cloudflare Pages (et intégration à badreddineek.com)

Le site est 100 % statique (`site/`), donc n'importe quel hébergement statique convient.
Comme je vais publier **plusieurs Labs par mois**, le choix se joue sur la *maintenabilité
répétée*, pas sur la mise en route du premier. Voici les deux options.

### Option A — Un sous-domaine pour toute la collection
`labs.badreddineek.com/rentree-2026`, `labs.badreddineek.com/futur-lab`, etc. : **un seul**
projet Cloudflare Pages sert tous les Labs, chacun dans un sous-dossier.

C'est déjà l'architecture du repo `labs` existant (chaque explainer est un sous-dossier +
une entrée dans `labs.config.json`). Deux façons d'agréger des Labs qui restent des repos
GitHub séparés :

- **A1 — Copie du build statique (recommandé).** Le repo `labs` reste la source de vérité du
  déploiement. Pour chaque Lab, on copie le dossier `site/` construit dans `labs/rentree-2026/`
  et on ajoute une entrée à `labs.config.json`. Le pipeline Python reste dans le repo source
  (`rentree-2026-lab`), seul le résultat statique est publié. Simple, robuste, aucune magie de build.
- **A2 — Sous-modules git.** Le repo `labs` référence chaque Lab via `git submodule`. Plus «&nbsp;propre&nbsp;»
  en théorie, mais chaque déploiement exige `submodule update --remote`, la config du chemin de
  sortie par Lab, et Cloudflare doit cloner les sous-modules. Plus de friction pour un gain faible.

**Avantages A** : un seul sous-domaine et un seul enregistrement DNS pour toujours ; SEO et image
de marque consolidés sous `labs.badreddineek.com` ; chaque Lab apparaît automatiquement dans l'index
Labs ; rien à recâbler à chaque publication.
**Inconvénients A** : une étape de copie (ou de submodule) à chaque nouveau Lab ; le pipeline data
vit dans un repo séparé du repo de déploiement.

### Option B — Un sous-domaine par projet
`rentree-2026.badreddineek.com` : **un** projet Cloudflare Pages par repo, connecté directement
à ce repo GitHub.

**Avantages B** : mise en route immédiate (connecter le repo, `output = site/`, terminé) ; isolation
totale (un Lab qui casse n'affecte pas les autres) ; déploiement auto à chaque `git push`.
**Inconvénients B** : un sous-domaine + un enregistrement CNAME + un projet Pages **par Lab**, donc
une accumulation à raison de plusieurs par mois ; SEO fragmenté ; pas d'index de collection commun ;
gestion qui devient lourde au bout de 10-15 Labs.

### Ma recommandation : **Option A1**
Pour une cadence de plusieurs Labs par mois, la collection sous un sous-domaine unique gagne à tous
les coups : zéro DNS à recréer, découvrabilité via l'index Labs, marque consolidée. Le seul surcoût
(copier un dossier statique) est trivial et scriptable. Je garderais `rentree-2026-lab` comme repo
**source** (pipeline + site), et je publierais le `site/` construit dans le repo `labs` sous
`rentree-2026/`.

### Étapes exactes — Cloudflare Pages

**Option A1 (recommandée), via le projet Pages `labs` existant :**
1. Construire le site en local : `cd pipeline && python fetch_data.py && python build_dataset.py`
   (régénère `site/data/*.json`).
2. Copier le contenu de `site/` dans le repo `labs`, dossier `rentree-2026/`
   (`index.html`, `css/`, `js/`, `data/`).
3. Ajouter une entrée dans `labs/labs.config.json` (slug `rentree-2026`, titre, description, date, tag).
4. `git commit && git push` sur le repo `labs` → Cloudflare Pages redéploie automatiquement
   (le projet Pages `labs` est déjà connecté à ce repo). Build command : **aucune** (site statique) ;
   output directory : **racine du repo** (`/`).
5. URL finale : `https://labs.badreddineek.com/rentree-2026`. Aucun DNS à toucher (le CNAME
   `labs` → `<project>.pages.dev` existe déjà).

**Option B, projet Pages dédié à ce repo :**
1. Cloudflare Dashboard → Workers & Pages → Create → Pages → **Connect to Git** → repo
   `BadreddineEK/rentree-2026-lab`, branche `main`.
2. Build settings : **Framework preset = None**, **Build command = (vide)**,
   **Build output directory = `site`**. (Le pipeline Python ne tourne PAS sur Cloudflare :
   les JSON sont déjà committés dans `site/data/`.)
3. Save and Deploy → l'app sort sur `<project>.pages.dev`.
4. Custom domains → Set up a custom domain → `rentree-2026.badreddineek.com`.
5. DNS : Cloudflare ajoute automatiquement le **CNAME** `rentree-2026` →
   `<project>.pages.dev` (proxied). Si le domaine est géré ailleurs, créer ce CNAME à la main.

> Note : dans les deux cas, **ne jamais** mettre le dossier `pipeline/` en output. Seul `site/`
> est public. Les données brutes (`pipeline/raw/`) sont gitignorées ; seuls les JSON dérivés
> (`site/data/`) sont versionnés et servis.

---

## ✅ Checklist avant publication LinkedIn

**Données / rigueur**
- [ ] Relancer `python fetch_data.py && python build_dataset.py` pour des JSON à jour.
- [ ] Vérifier la corrélation affichée (calcul actuel : **r = 0,843** sur 98 départements) et que la
      référence DEPP 0,87 (niveau communal) est bien citée **à part**, sans confusion.
- [ ] Confirmer que chaque graphique affiche son **année de référence** (IPS 2025-2026, revenu 2021).
- [ ] Relire la section « Ce que ça ne dit pas » : corrélation ≠ causalité, nuance IVAC, piège d'agrégation.
- [ ] Vérifier qu'**aucune commune** n'est nommée en exemple négatif (niveau département uniquement).

**Technique / rendu**
- [ ] Tester sur **mobile réel** (trafic LinkedIn majoritairement mobile) : carte, scroll, simulateur.
- [ ] Simulateur : tester 1 à 5 enfants, plusieurs tranches d'âge, vérifier les verdicts.
- [ ] Carte : survol/tap sur plusieurs départements, vérifier les infobulles et la légende.
- [ ] Vérifier le temps de chargement (carte en lazy-load, pas de librairie superflue).
- [ ] Contrôler les liens (portfolio, GitHub, sources officielles) — aucun lien mort.
- [ ] Ajouter/valider l'image OG (aperçu LinkedIn) avant de coller le lien.

**Publication**
- [ ] Générer le carrousel 8 slides (voir CONSIGNES §9) depuis les graphes.
- [ ] Mettre le lien du Lab **en commentaire** du post (pas dans le corps), comme pour les posts précédents.

## Statut

🟢 Fonctionnel — pipeline (4 sources officielles), datasets JSON sourcés, frontend 8 sections
opérationnel. Reste : déploiement Cloudflare + carrousel LinkedIn.

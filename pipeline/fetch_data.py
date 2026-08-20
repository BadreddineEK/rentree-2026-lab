"""
Téléchargement des sources officielles.
Voir CONSIGNES.md §4 pour la liste exacte des datasets à utiliser et §5 pour ceux à exclure.
TODO: implémenter le fetch pour :
- IPS collèges (data.education.gouv.fr)
- Revenu médian par département (INSEE Filosofi)
- IVAC (data.gouv.fr)
"""

def fetch_ips_colleges():
    raise NotImplementedError("Voir CONSIGNES.md §4 pour la source exacte")


def fetch_revenu_median():
    raise NotImplementedError("Voir CONSIGNES.md §4 pour la source exacte")


def fetch_ivac():
    raise NotImplementedError("Voir CONSIGNES.md §4 pour la source exacte")


if __name__ == "__main__":
    fetch_ips_colleges()
    fetch_revenu_median()
    fetch_ivac()

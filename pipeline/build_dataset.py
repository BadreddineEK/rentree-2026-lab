"""
Nettoyage, jointure IPS x revenu médian par département, calcul de corrélation.
Exporte les JSON/CSV statiques consommés par le frontend dans site/data/.
Voir CONSIGNES.md §6 pour l'arborescence cible et §4 pour les valeurs de référence à valider.
"""

def build_cout_rentree_dataset():
    raise NotImplementedError


def build_ips_map_dataset():
    raise NotImplementedError


def build_correlation_dataset():
    raise NotImplementedError


def build_secteur_comparison_dataset():
    raise NotImplementedError


if __name__ == "__main__":
    build_cout_rentree_dataset()
    build_ips_map_dataset()
    build_correlation_dataset()
    build_secteur_comparison_dataset()

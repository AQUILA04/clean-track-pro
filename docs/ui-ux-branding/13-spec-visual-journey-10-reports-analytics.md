# Spécifications Visuelles : Parcours 10 - Rapports et Analytics

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document définit les interfaces (RA) pour le système de rapports et d'analytics destiné principalement à l'Admin_Tenant. Ces écrans doivent transformer des données complexes en visualisations claires et actionnables, permettant une prise de décision éclairée.

---

## Écran RA-01 : Dashboard Analytics

**Objectif :** Fournir une vue d'ensemble visuelle et interactive des performances du réseau.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une page riche avec plusieurs sections : KPIs en haut, graphiques au centre, et tableaux de synthèse en bas. |
| **Cartes KPI** | 4 à 6 cartes principales affichant les métriques clés : CA Total, Nombre de Commandes, Marge Nette, Taux de Retard. Chaque carte inclut une comparaison avec la période précédente (ex: "+12% vs semaine dernière") avec une flèche et une couleur (`Vert Succès` pour positif, `Rouge Erreur` pour négatif). |
| **Graphique Principal** | Un graphique en ligne montrant l'évolution du CA sur la période sélectionnée (RA-02). Utilise la bibliothèque Chart.js avec la couleur `Bleu Confiance` pour la ligne principale. |
| **Graphiques Secondaires** | Un graphique en barres pour la répartition des commandes par statut, et un graphique en camembert pour la répartition CA Normal vs Express. |

---

## Écran RA-02 : Filtre Temporel

**Objectif :** Permettre une analyse flexible sur différentes périodes.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Intégration** | Ce n'est pas un écran séparé, mais un composant présent en haut de tous les écrans de rapports (RA-01, RA-03, RA-04, etc.). |
| **Style** | Une barre horizontale avec des boutons-onglets pour les périodes prédéfinies : "Aujourd'hui", "7 derniers jours", "30 derniers jours", "Ce mois", "Année en cours". Un bouton supplémentaire "Personnalisé" ouvre un sélecteur de date (date picker) pour choisir une plage spécifique. |
| **Interaction** | La sélection d'une période met à jour instantanément tous les graphiques et tableaux de la page. |

---

## Écran RA-03 : Comparaison Sites

**Objectif :** Comparer les performances des différentes agences du réseau.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une page dédiée avec un graphique de comparaison principal et un tableau détaillé. |
| **Graphique de Comparaison** | Un graphique en barres groupées où chaque barre représente une agence. Les métriques comparées sont sélectionnables (CA, Nombre de commandes, Marge). Chaque agence a une couleur distincte. |
| **Tableau Détaillé** | Un tableau listant toutes les agences avec leurs KPIs clés en colonnes. Les colonnes sont triables. |

---

## Écrans RA-04 à RA-06 : Rapports Détaillés

**Objectif :** Fournir des analyses approfondies par domaine.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **RA-04 (Rapport Financier)** | Une page avec des sections pour : CA détaillé (par agence, par service, par mode), Dépenses détaillées (par catégorie), et Calcul de la Marge Nette. Utilise des graphiques en barres empilées et des tableaux. |
| **RA-05 (Rapport Opérationnel)** | Affiche des KPIs opérationnels : Délai moyen de traitement, Nombre d'articles moyen par commande, Taux de commandes en retard, Heures de pointe. Utilise des graphiques linéaires et des cartes de statistiques. |
| **RA-06 (Rapport Clients)** | Analyse la base client : Nombre de nouveaux clients sur la période, Taux de clients récurrents, Fréquence moyenne de commande. Utilise des graphiques en courbe et des cartes KPI. |

---

## Écran RA-07 : Export Données

**Objectif :** Permettre l'extraction des données pour une utilisation externe.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Intégration** | Un bouton "Exporter" est présent en haut à droite de chaque page de rapport. |
| **Modale d'Export** | Un clic sur "Exporter" ouvre une modale demandant de choisir le format (PDF, Excel) et les données à inclure (graphiques, tableaux, ou les deux). |
| **Action** | Après confirmation, le fichier est généré et téléchargé automatiquement. Une notification de succès confirme l'action. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

# Spécifications Visuelles : Parcours 4 - Admin_Site

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document détaille les spécifications visuelles pour les écrans du parcours Admin_Site (AS). Ce parcours web est l'outil quotidien du gérant d'agence. Le design doit être axé sur l'efficacité opérationnelle, la clarté visuelle et la prise de décision rapide.

---

## Layout Général

Le layout reste cohérent avec l'écosystème CleanTrack Pro (sidebar de navigation à gauche). Les éléments de menu pour l'Admin_Site sont plus opérationnels : Dashboard, Commandes, Rayons, Dépenses, Rapports.

---

## Écran AS-01 : Dashboard Admin Site

**Objectif :** Donner au gérant un aperçu en temps réel de l'activité de son agence.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Cartes KPI** | Une rangée de KPIs essentiels : "Commandes du Jour", "CA du Jour", "Commandes en Retard", "Taux d'Occupation des Rayons". Les cartes doivent avoir des couleurs sémantiques (ex: "Commandes en Retard" avec un accent `Ambre`). |
| **Graphique d'Activité** | Un graphique en barres montrant le nombre de commandes par heure pour la journée en cours, permettant d'identifier les pics d'activité. |
| **Liste des Tâches Rapides** | Une section "À faire aujourd'hui" listant les actions urgentes : X commandes à traiter, Y commandes à ranger, Z commandes prêtes pour le retrait. Chaque item est un lien direct vers l'écran correspondant. |

---

## Écrans AS-02 à AS-05 : Gestion des Rayons

**Objectif :** Offrir une gestion visuelle et intuitive de l'espace de stockage.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **AS-02 (Gestion des Rayons)** | Une page avec un bouton "+ Créer un Rayon" et une grille visuelle (AS-05) des rayons existants. |
| **AS-03 (Création de Rayon)** | Une modale simple demandant un "Label" pour le rayon (ex: A-01, B-12). Le système doit suggérer le prochain label disponible. |
| **AS-04 (Édition de Rayon)** | Accessible en cliquant sur un rayon, une modale permet de changer son label. |
| **AS-05 (Vue d'Occupation)** | C'est l'élément central. Une grille représentant physiquement les rayons de l'agence. Chaque case (slot) a un label clair. La couleur de la case indique son statut : `Vert Succès` pour Libre, `Gris Occupé` pour Occupé. Au survol d'une case occupée, une infobulle affiche le numéro de commande et le nom du client. |

---

## Écran AS-06 : Gestion des Dépenses

**Objectif :** Permettre une saisie rapide des dépenses pour un suivi financier précis.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Un tableau listant les dépenses de la période sélectionnée (jour/semaine/mois) et un bouton "+ Ajouter une Dépense". |
| **Tableau des Dépenses** | Colonnes : Date, Description, Catégorie (Loyer, Salaires, Fournitures...), Montant. |
| **Modale d'Ajout** | Un formulaire simple avec les champs : "Description", "Montant", "Catégorie" (liste déroulante pré-configurée par l'Admin_Tenant), et un champ pour uploader un justificatif (photo/PDF). |

---

## Écran AS-07 : Rapports Site

**Objectif :** Fournir des rapports clairs sur la performance de l'agence.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une page avec des filtres de date et des sections pour chaque type de rapport. |
| **Rapport Financier** | Affiche le CA, les Dépenses et la Marge Nette sur la période, avec un graphique d'évolution. |
| **Rapport Opérationnel** | KPIs comme le délai moyen de traitement, le nombre d'articles par commande, et les heures de pointe. |
| **Bouton d'Export** | Un bouton "Exporter en PDF" en haut de la page pour générer un résumé imprimable. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

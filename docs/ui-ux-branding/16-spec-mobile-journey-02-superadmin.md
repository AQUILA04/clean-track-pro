# Spécifications Mobiles : Parcours 2 - Superadmin (Responsive)

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document détaille l'adaptation responsive (mobile et tablette) des écrans du parcours Superadmin (SA). L'objectif est de garantir une expérience utilisateur fluide et fonctionnelle sur des écrans de petite taille, en respectant une approche **mobile-first**.

---

## Principes Généraux de Responsive Design

- **Navigation :** La barre latérale de navigation est remplacée par un menu hamburger (icône ☰) qui s'ouvre en superposition (overlay).
- **Layout :** Les mises en page multi-colonnes sont transformées en une seule colonne verticale.
- **Tables :** Les tableaux de données complexes sont convertis en listes de cartes empilées, chaque carte représentant une ligne du tableau.
- **Actions :** Les boutons d'action principaux (ex: "+ Créer un Tenant") sont déplacés dans un bouton d'action flottant (FAB - Floating Action Button) en bas à droite de l'écran.

---

## Écran SA-01 : Dashboard Superadmin (Mobile)

**Objectif :** Fournir les KPIs clés de manière lisible sur un petit écran.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | Une seule colonne verticale. |
| **Cartes KPI** | Les cartes KPI sont empilées verticalement, occupant 100% de la largeur de l'écran (avec des marges de 16px). La taille de la police de la valeur est réduite à 28px. |
| **Graphiques** | Le graphique linéaire est conservé mais sa hauteur est réduite. Les légendes peuvent être simplifiées. L'interaction au survol est remplacée par une interaction au toucher (tap). |
| **Liste des Derniers Tenants** | Le tableau est transformé en une liste de cartes. Chaque carte affiche le nom du tenant, son statut et la date de création. |

---

## Écran SA-02 : Liste des Tenants (Mobile)

**Objectif :** Permettre la consultation et la recherche de tenants sur mobile.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Barre d'Actions** | Le champ de recherche reste en haut. Le bouton "+ Créer un Tenant" est déplacé dans un FAB. |
| **Tableau des Tenants** | Transformé en une liste de cartes empilées. Chaque carte représente un tenant et affiche : Nom, Sous-domaine, et Statut (avec la puce de couleur). |
| **Interaction Carte** | Taper sur une carte navigue vers les détails du tenant (SA-04). Un appui long ou une icône "trois points" sur la carte révèle les actions rapides (Éditer, Désactiver) dans un menu contextuel (bottom sheet). |

---

## Écran SA-03 : Création de Tenant (Mobile)

**Objectif :** Maintenir un processus de création simple sur mobile.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Type** | La modale devient une vue plein écran. L'en-tête contient un titre ("Créer un Tenant") et un bouton "Retour" ou "Fermer". |
| **Formulaire** | Le formulaire reste une liste verticale de champs de saisie. |
| **Boutons d'Action** | Les boutons "Créer" et "Annuler" sont placés en bas de l'écran, fixés à la vue (sticky footer) pour être toujours accessibles. |

---

## Écran SA-04 : Détails du Tenant (Mobile)

**Objectif :** Présenter les informations d'un tenant de manière digeste.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | Les informations de l'en-tête (logo, nom, statut) sont conservées en haut. |
| **Navigation par Onglets** | Les onglets (Utilisateurs, Facturation, etc.) sont conservés mais deviennent scrollables horizontalement s'ils sont nombreux. |
| **Contenu des Onglets** | Le contenu de chaque onglet est présenté sous forme de listes de cartes verticales. |

---

## Écran SA-05 & SA-06 : Édition et Gestion (Mobile)

**Objectif :** Permettre les actions d'édition et de gestion.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **SA-05 (Édition)** | La modale d'édition devient une vue plein écran, similaire à la création (SA-03). |
| **SA-06 (Gestion Utilisateurs)** | Le tableau des utilisateurs est transformé en une liste de cartes. Le bouton "+ Inviter" est déplacé dans le FAB de la page. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

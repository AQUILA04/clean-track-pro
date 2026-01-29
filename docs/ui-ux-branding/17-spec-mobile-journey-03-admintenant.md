# Spécifications Mobiles : Parcours 3 - Admin_Tenant (Responsive)

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document détaille l'adaptation responsive (mobile et tablette) des écrans du parcours Admin_Tenant (AT). L'enjeu est de rendre les puissantes fonctionnalités de configuration et de reporting accessibles et utilisables sur des appareils de petite taille.

---

## Principes Généraux

- **Navigation :** Menu hamburger (☰) remplaçant la barre latérale.
- **Layout :** Passage systématique à une colonne unique.
- **Complexité :** Les interfaces complexes comme la grille tarifaire sont décomposées en étapes successives (drill-down).
- **Actions :** Utilisation du bouton d'action flottant (FAB) pour les créations (agence, utilisateur, article).

---

## Écran AT-01 : Dashboard Admin Tenant (Mobile)

**Objectif :** Offrir un aperçu financier et opérationnel sur mobile.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Filtres Principaux** | Les filtres de période et de site sont regroupés sous un bouton "Filtres" qui ouvre une modale plein écran. |
| **Cartes KPI** | Empilées verticalement, occupant 100% de la largeur. |
| **Graphique Principal** | Le graphique en barres est conservé, mais il devient scrollable horizontalement si le nombre d'agences est élevé. |
| **Tableau de Bord** | Le tableau est transformé en une liste de cartes, chaque carte représentant une agence et ses KPIs opérationnels. |

---

## Écrans AT-02 à AT-05 : Gestion des Agences (Mobile)

**Objectif :** Gérer les agences du réseau depuis un mobile.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **AT-02 (Liste)** | La grille de cartes devient une liste verticale. Le FAB sur cet écran est "+ Ajouter une agence". |
| **AT-03 (Création)** | Devient une vue plein écran avec un en-tête de navigation (Titre + bouton Retour). Les champs du formulaire sont empilés. |
| **AT-04 (Détails)** | La page de détails de l'agence est conservée, avec les informations et statistiques empilées verticalement. |
| **AT-05 (Édition)** | S'ouvre en plein écran, comme la création. |

---

## Écrans AT-07 à AT-11 : Configuration du Catalogue et des Prix (Mobile)

**Objectif :** Adapter la configuration complexe du catalogue à une interface mobile.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Navigation par Onglets** | Les onglets ("Articles", "Services", "Tarifs", "Express") sont conservés mais deviennent scrollables horizontalement. |
| **AT-07/08 (Types d'Articles)** | Le tableau devient une liste de cartes. Le FAB "+ Ajouter un article" ouvre la vue de création plein écran (AT-08). |
| **AT-10 (Grille Tarifaire)** | **Transformation majeure :** La matrice est remplacée par une interface de type "drill-down" en deux étapes :
1.  **Étape 1 :** L'utilisateur sélectionne un **Type d'Article** dans une liste.
2.  **Étape 2 :** Une nouvelle vue apparaît, listant les **Services** applicables à cet article, avec un champ de saisie pour le prix à côté de chaque service. Un bouton "Enregistrer" sauvegarde les prix pour cet article. |
| **AT-11 (Mode Express)** | Le formulaire simple s'adapte naturellement à une vue verticale. |

---

## Écrans AT-06 & AT-12 : Administration (Mobile)

**Objectif :** Gérer les utilisateurs et les paramètres sur mobile.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **AT-06 (Gestion Utilisateurs)** | Le tableau des utilisateurs est transformé en une liste de cartes. Chaque carte affiche le nom, le rôle et l'agence. Le FAB permet d'inviter un nouvel utilisateur. |
| **AT-12 (Paramètres Généraux)** | Le formulaire de branding s'adapte à une vue verticale simple. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

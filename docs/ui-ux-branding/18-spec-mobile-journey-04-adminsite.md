# Spécifications Mobiles : Parcours 4 - Admin_Site (Responsive)

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document détaille l'adaptation responsive (mobile et tablette) des écrans du parcours Admin_Site (AS). L'interface mobile doit permettre au gérant d'agence de superviser les opérations essentielles, même en déplacement.

---

## Principes Généraux

- **Navigation :** Menu hamburger (☰) pour l'accès aux différentes sections.
- **Layout :** Passage à une colonne unique pour tous les écrans.
- **Visualisation :** Les grilles visuelles (rayons) sont adaptées pour être lisibles et interactives sur des écrans tactiles.
- **Actions :** Utilisation du bouton d'action flottant (FAB) pour les créations (rayon, dépense).

---

## Écran AS-01 : Dashboard Admin Site (Mobile)

**Objectif :** Fournir un aperçu en temps réel de l'agence sur mobile.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Cartes KPI** | Empilées verticalement, occupant 100% de la largeur. Les couleurs sémantiques sont conservées pour une lecture rapide. |
| **Graphique d'Activité** | Le graphique en barres est conservé, avec une hauteur optimisée pour mobile. Il peut devenir scrollable horizontalement pour afficher toute la journée. |
| **Liste des Tâches Rapides** | La liste "À faire aujourd'hui" est mise en avant, avec des liens clairs et de grandes zones tactiles. |

---

## Écrans AS-02 à AS-05 : Gestion des Rayons (Mobile)

**Objectif :** Permettre la gestion des rayons sur des appareils mobiles.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **AS-02 (Gestion des Rayons)** | La page affiche directement la grille visuelle (AS-05). Le FAB permet de "+ Créer un Rayon". |
| **AS-03 (Création de Rayon)** | S'ouvre en modale plein écran. Un formulaire simple avec un champ "Label" et les boutons "Créer" et "Annuler" dans un pied de page fixe. |
| **AS-05 (Vue d'Occupation)** | La grille visuelle est adaptée : la taille des cases est réduite, et sur les très petits écrans, la grille peut passer d'une disposition fixe à une disposition qui s'enroule (wrap), tout en conservant la logique de regroupement. L'interaction se fait par tapotement (tap) pour afficher l'infobulle, qui s'affiche alors dans une modale (bottom sheet). |

---

## Écran AS-06 : Gestion des Dépenses (Mobile)

**Objectif :** Permettre la saisie de dépenses en situation de mobilité.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | Le tableau des dépenses est transformé en une liste de cartes. Le FAB permet d'"Ajouter une Dépense". |
| **Carte de Dépense** | Chaque carte affiche la description, la catégorie et le montant. |
| **Modale d'Ajout** | S'ouvre en plein écran. Le champ pour uploader un justificatif permet d'utiliser directement l'appareil photo du téléphone. |

---

## Écran AS-07 : Rapports Site (Mobile)

**Objectif :** Consulter les rapports de performance de l'agence sur mobile.

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | Les filtres de date sont accessibles via un bouton "Filtres". Les rapports sont présentés sous forme de cartes empilées. |
| **Graphiques** | Les graphiques sont simplifiés et optimisés pour la lecture sur petit écran. |
| **Export PDF** | Le bouton d'export reste disponible, générant un PDF formaté pour une lecture mobile (A4 portrait). |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

# Spécifications Mobiles : Parcours 6, 7, 8 - Opérations User_Site (Responsive)

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document couvre l'adaptation responsive des parcours opérationnels du User_Site :
- **Parcours 6 : Traitement des Commandes (UT)**
- **Parcours 7 : Rangement et Stockage (UR)**
- **Parcours 8 : Livraison et Retrait Client (UL)**

L'objectif est de permettre aux opérateurs d'effectuer toutes leurs tâches sur des tablettes ou des téléphones, directement dans l'atelier ou au comptoir.

---

## Parcours 6 : Traitement des Commandes (UT) - Mobile

### Écran UT-01 : Liste des Commandes (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | Le tableau est transformé en une liste de cartes de commande empilées. |
| **Filtres** | Les filtres (statut, service, date) sont accessibles via un bouton "Filtres" qui ouvre une modale plein écran. |
| **Carte de Commande** | Affiche les informations essentielles : N° Commande, Client, Statut (avec badge de couleur), et Date de retrait. |
| **Interaction** | Un tap sur la carte ouvre les détails de la commande (UT-02). |

### Écran UT-05 : Vue Kanban (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Adaptation** | Le Kanban est conservé, mais les colonnes sont scrollables horizontalement. La largeur de chaque colonne est réduite pour en afficher 2 ou 3 à l'écran. |
| **Cartes de Commande** | Les cartes sont plus compactes. Le drag-and-drop est conservé pour les tablettes, mais sur téléphone, un tap sur la carte ouvre un menu pour changer le statut. |

### Écran UT-02 : Détails de Commande (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | Les sections (Articles, Info Client, Historique) sont empilées verticalement. |
| **Actions** | Le bouton "Changer le Statut" est placé dans un pied de page fixe (sticky footer) pour un accès rapide. |

### Écran UT-03 : Scan QR Code (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Natif** | Cet écran est nativement mobile. Il utilise l'appareil photo de l'appareil en plein écran. |

---

## Parcours 7 : Rangement et Stockage (UR) - Mobile

### Écran UR-01 : Commandes à Ranger (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | La liste des commandes est présentée sous forme de cartes. Un bouton "Scanner une Commande" est mis en avant. |

### Écran UR-02 : Sélection Rayon (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | La grille des rayons est optimisée pour le tactile (cases plus grandes). Sur téléphone, la grille peut s'enrouler sur plusieurs lignes. |
| **Interaction** | Un tap sur une case libre la sélectionne. Le bouton de confirmation est dans un pied de page fixe. |

---

## Parcours 8 : Livraison et Retrait Client (UL) - Mobile

### Écran UL-01 : Scan QR Code Client (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | Interface simple avec un grand bouton "Scanner le Ticket Client" qui active la caméra. Le champ de saisie manuelle est conservé. |

### Écran UL-02 : Détails Commande Retrait (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | Les informations sont empilées verticalement. L'emplacement de stockage ("Rayon : A-07") est mis en évidence en haut de l'écran. |
| **Checklist Articles** | La checklist (UL-03) est conservée, avec de grandes zones tactiles pour les cases à cocher. |
| **Actions** | Le bouton "Procéder au Paiement / à la Livraison" est dans un pied de page fixe. |

### Écran UL-04 : Paiement (Mobile)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | La modale de paiement s'affiche en plein écran. Les modes de paiement sont de grands boutons cliquables. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

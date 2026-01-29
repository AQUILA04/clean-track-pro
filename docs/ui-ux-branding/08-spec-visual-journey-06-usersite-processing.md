# Spécifications Visuelles : Parcours 6 - User_Site Traitement des Commandes

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document définit les interfaces (UT) permettant à l'opérateur (User_Site) de suivre et de mettre à jour le cycle de vie des commandes après leur réception. Le design doit favoriser la visibilité, la rapidité d'exécution et la collaboration entre les équipes.

---

## Écran UT-01 : Liste des Commandes

**Objectif :** Fournir une vue d'ensemble consultable et filtrable de toutes les commandes de l'agence.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une page pleine largeur dominée par un tableau de données. |
| **Barre de Filtres** | En haut, des contrôles puissants : un champ de recherche (par N° de commande, nom client), des filtres déroulants pour le **Statut** (CREATED, IN_PROGRESS, etc.), le **Niveau de Service** (Normal, Express), et un sélecteur de date. |
| **Tableau des Commandes** | Colonnes : N° Commande, Nom Client, Date, Statut (avec une puce de couleur), Nbre d'articles, Date de retrait promise, Total. La colonne Statut est l'élément visuel clé. |
| **Style des Statuts** | Chaque statut a une couleur définie dans le design system : `CREATED` (Gris), `IN_PROGRESS` (Bleu), `READY` (Vert), `DELAYED` (Ambre), `LOST` (Rouge). |
| **Actions sur Ligne** | Au survol, un bouton "Voir Détails" apparaît. Cliquer sur la ligne mène à l'écran UT-02. |

---

## Écran UT-05 : Vue Kanban des Commandes

**Objectif :** Offrir une vue alternative, plus visuelle et interactive, du flux de travail.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Un tableau Kanban avec des colonnes représentant les statuts clés du processus : "À Traiter", "En Cours de Lavage", "Prêtes". |
| **Cartes de Commande** | Chaque commande est une carte déplaçable (drag-and-drop). La carte affiche les infos essentielles : N° Commande, Nom Client, Heure de retrait. Les cartes "Express" ont un bandeau `Orange Vif` et une icône ⚡. |
| **Interaction** | Glisser une carte d'une colonne à l'autre déclenche le changement de statut (UT-04) via une modale de confirmation. |

---

## Écran UT-02 : Détails de Commande

**Objectif :** Présenter toutes les informations relatives à une seule commande.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une page structurée avec un en-tête récapitulatif et des sections détaillées. |
| **En-tête** | Affiche en grand le N° de Commande, le Nom du Client, et le Statut actuel (avec sa couleur). Un bouton proéminent "Changer le Statut" est présent. |
| **Sections** | Des cartes distinctes pour : **1. Liste des Articles** (avec leur propre sous-statut si nécessaire), **2. Informations Client**, **3. Historique des Statuts** (une timeline verticale montrant chaque changement de statut avec l'heure et l'opérateur). |

---

## Écran UT-03 : Scan QR Code

**Objectif :** Identifier une commande ou un article instantanément à n'importe quelle étape.

| Élément | Spécification Visuelle (Web & Mobile) |
|---|---|
| **Type** | Peut être une page dédiée sur mobile ou une modale sur le web. |
| **Interface** | Très simple : un viseur de caméra au centre de l'écran avec un message "Veuillez scanner un QR code". |
| **Action** | Une fois un QR code valide scanné, l'application navigue automatiquement vers la page de détails de la commande correspondante (UT-02). |

---

## Écran UT-04 : Changement de Statut

**Objectif :** Assurer une mise à jour de statut intentionnelle et tracée.

| Élément | Spécification Visuelle (Web & Mobile) |
|---|---|
| **Type** | Modale de confirmation. |
| **Contenu** | Affiche "Changer le statut de la commande #XXXXX de [Ancien Statut] à :" suivi d'une liste de boutons pour les statuts suivants possibles. |
| **Boutons de Statut** | Chaque bouton est stylisé avec la couleur du statut qu'il représente (ex: bouton vert pour "Prêt"). |
| **Confirmation** | Un clic sur un bouton de statut change immédiatement le statut et ferme la modale, avec une notification de succès. |

---

## Écran UT-07 : Alertes Retard

**Objectif :** Attirer l'attention sur les commandes qui risquent de ne pas respecter le SLA.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une page dédiée ou une section du dashboard (AS-01). C'est une liste de commandes critiques. |
| **Style de Ligne** | Chaque ligne représente une commande en retard. La ligne entière a un fond `Ambre` clair pour signifier l'avertissement. |
| **Informations Clés** | Affiche le N° de Commande, le Client, la Date de retrait promise et le temps de retard (ex: "Retard de 2h 15min"). |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

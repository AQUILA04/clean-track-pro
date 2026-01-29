# Spécifications Visuelles : Parcours 7 - User_Site Rangement et Stockage

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document spécifie les interfaces (UR) pour le processus de rangement des commandes prêtes. L'objectif est de créer un flux de travail rapide, sans erreur, qui assure que chaque commande est stockée au bon endroit et que son emplacement est enregistré numériquement.

---

## Écran UR-01 : Commandes à Ranger

**Objectif :** Lister toutes les commandes qui ont terminé le cycle de traitement et sont prêtes à être stockées.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une page simple avec un titre "Commandes à Ranger" et une liste ou un tableau des commandes concernées. |
| **Tableau/Liste** | Affiche les informations essentielles : N° Commande, Nom Client, Nombre d'articles. Chaque ligne est une action qui lance le processus de rangement pour cette commande. |
| **Action Principale** | Un bouton "Scanner une Commande à Ranger" (UR-03) est également disponible pour un flux de travail basé sur le scan. |

---

## Écran UR-02 : Sélection Rayon

**Objectif :** Permettre à l'opérateur de choisir visuellement un emplacement de stockage libre.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Type** | Modale plein écran pour une immersion maximale. |
| **Mise en Page** | Affiche la grille visuelle des rayons (identique à AS-05). Le titre de la modale est "Sélectionner un rayon pour la commande #XXXXX". |
| **Interaction** | Seules les cases `Vert Succès` (Libre) sont cliquables. Les cases `Gris Occupé` sont désactivées. Un clic sur une case libre la sélectionne (elle se met en surbrillance `Bleu Confiance`) et active le bouton de confirmation. |
| **Bouton de Confirmation** | Un bouton "Attribuer le Rayon [Label]" devient actif après la sélection. |

---

## Écran UR-03 : Scan Commande

**Objectif :** Démarrer le processus de rangement en scannant le QR code de la commande.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Type** | Modale avec l'interface de la caméra (similaire à UT-03). |
| **Action** | Après le scan réussi d'une commande au statut `READY`, la modale se ferme et l'application ouvre directement la modale de sélection de rayon (UR-02) pour cette commande. |

---

## Écrans UR-04 & UR-05 : Attribution et Confirmation

**Objectif :** Finaliser et confirmer l'enregistrement de l'emplacement.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **UR-04 (Attribution)** | C'est l'action de cliquer sur le bouton "Attribuer le Rayon" dans la modale UR-02. Cela déclenche une dernière modale de confirmation. |
| **Modale de Confirmation** | Un dialogue simple : "Confirmez-vous vouloir ranger la commande #XXXXX dans le rayon [Label] ?" avec les boutons "Confirmer" (primaire) et "Annuler" (secondaire). |
| **UR-05 (Message de Succès)** | Après confirmation, une notification de succès (`Vert Succès`) apparaît : "Commande #XXXXX rangée avec succès dans le rayon [Label]". La grille des rayons (AS-05) est mise à jour en temps réel, la case passant au `Gris Occupé`. |

---

## Écran UR-06 : Vue Rayons Occupés

**Objectif :** Consulter rapidement quelles commandes sont dans quels rayons.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | C'est la même grille visuelle que AS-05, mais avec une interaction améliorée. |
| **Interaction** | Au survol d'une case `Gris Occupé`, une infobulle (tooltip) riche apparaît, affichant : N° Commande, Nom Client, Date de rangement. Un clic sur la case peut ouvrir la page de détails de la commande (UT-02). |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

# Spécifications Visuelles : Parcours 8 - User_Site Livraison et Retrait Client

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document spécifie les interfaces (UL) pour le processus de livraison, lorsque le client vient récupérer sa commande. Le design doit être sécurisé, rapide et laisser une impression positive et professionnelle au client.

---

## Écran UL-01 : Scan QR Code Client

**Objectif :** Identifier la commande du client de manière instantanée et sans erreur.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une interface dédiée, simple et claire. Peut être la page par défaut de la section "Retrait". |
| **Interface Principale** | Un grand bouton "Scanner le Ticket Client" qui ouvre l'interface de la caméra (similaire à UT-03). Un champ de saisie est également disponible pour taper le numéro de commande manuellement si le QR code est illisible. |
| **Action** | Après un scan réussi, l'application navigue immédiatement vers l'écran de détails du retrait (UL-02). |

---

## Écran UL-02 : Détails Commande Retrait

**Objectif :** Fournir à l'opérateur toutes les informations pour récupérer la commande et la vérifier avec le client.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Un écran récapitulatif clair et bien structuré. |
| **Informations Clés** | En haut, le N° de Commande et le Nom du Client. L'information la plus importante est l'**emplacement de stockage**, affichée de manière très visible (ex: "Rayon : A-07" dans un badge proéminent). |
| **Checklist des Articles** | La liste des articles de la commande (UL-03) est affichée avec une case à cocher pour chaque article. |
| **Statut du Paiement** | Affiche si la commande est "Déjà Payée" ou le "Montant Restant à Payer". |
| **Bouton d'Action** | Un bouton "Procéder au Paiement / à la Livraison" en bas de l'écran. |

---

## Écran UL-03 : Vérification Articles

**Objectif :** S'assurer que tous les articles sont bien remis au client.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Intégration** | Ceci est une partie de l'écran UL-02, pas un écran séparé. |
| **Style** | Une liste d'articles. Chaque ligne a une case à cocher (`checkbox`). L'opérateur coche chaque article au fur et à mesure qu'il le sort du sac ou du cintre. |
| **Interaction** | Le bouton de finalisation de la livraison (UL-05) ne devient actif que lorsque toutes les cases sont cochées, forçant ainsi une vérification complète. |

---

## Écran UL-04 : Paiement

**Objectif :** Gérer l'encaissement final de manière simple.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Type** | Modale qui s'ouvre après avoir cliqué sur "Procéder au Paiement". |
| **Contenu** | Affiche le "Total à Payer". Propose des boutons pour les modes de paiement courants (Espèces, Carte de crédit, Mobile Money). |
| **Interaction** | En cliquant sur un mode de paiement, la transaction est enregistrée. Pour les espèces, un champ peut permettre de calculer la monnaie à rendre. |
| **Confirmation** | Après le paiement, la modale se ferme et l'écran de détails (UL-02) se met à jour pour indiquer "Payée". |

---

## Écrans UL-05 & UL-06 : Confirmation et Reçu

**Objectif :** Finaliser la commande dans le système et fournir un reçu au client.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **UL-05 (Confirmation Livraison)** | Après le paiement (si nécessaire) et la vérification des articles, le bouton "Confirmer la Livraison" est cliqué. Une dernière modale de confirmation apparaît. Optionnellement, elle peut inclure un champ pour une signature électronique du client sur une tablette. |
| **Action Finale** | La confirmation passe le statut de la commande à `DELIVERED`. Le rayon de stockage est automatiquement libéré et repasse au statut `FREE` (couleur `Vert Succès`). |
| **UL-06 (Reçu de Livraison)** | Une notification de succès s'affiche. Le système peut proposer d'imprimer un reçu de paiement (UL-06) ou de l'envoyer par e-mail au client. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

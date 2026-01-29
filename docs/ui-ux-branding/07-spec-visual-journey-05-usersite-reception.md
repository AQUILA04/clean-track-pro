# Spécifications Visuelles : Parcours 5 - User_Site Réception de Commande

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document est crucial car il définit l'interface "Fast-Scan" (US), le cœur de l'efficacité opérationnelle de CleanTrack Pro. Le design doit être optimisé pour la vitesse, l'intuitivité et la réduction des erreurs de saisie pour l'opérateur de pressing (User_Site).

---

## Écran US-01 : Interface Réception "Fast-Scan"

**Objectif :** Créer une commande complète en un minimum de clics et de temps.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Un écran divisé en trois colonnes verticales : **1. Client & Commande** (gauche), **2. Catalogue d'Articles** (centre), **3. Panier Actuel** (droite). |
| **Colonne 1 (Gauche)** | En haut, l'Omnibox de recherche client (US-02). Une fois un client sélectionné, cette zone affiche son nom et un bouton pour voir ses détails. En dessous, le toggle pour le Mode Express (US-06) et les boutons d'action finaux ("Valider la Commande", "Annuler"). |
| **Colonne 2 (Centre)** | La grille de sélection d'articles (US-04). C'est la zone la plus large et la plus interactive. |
| **Colonne 3 (Droite)** | Le résumé de la commande en cours (US-05), qui se remplit dynamiquement. |

---

## Écran US-02 : Recherche Client (Omnibox)

**Objectif :** Trouver ou créer un client instantanément.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Style** | Un champ de recherche unique, proéminent, avec une icône de loupe. Fond `Bleu Ciel` pour le démarquer. Placeholder : "Rechercher par nom, téléphone, code client...". |
| **Résultats** | En tapant, une liste déroulante apparaît en temps réel. Chaque résultat affiche le nom du client, son numéro de téléphone et son code unique. |
| **Action "Créer"** | Si aucun client ne correspond, la liste déroulante propose une action "+ Créer un nouveau client", qui ouvre la modale de création rapide (US-03). |

---

## Écran US-03 : Création Client Rapide

**Objectif :** Enregistrer un nouveau client sans quitter l'interface de commande.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Type** | Modale. |
| **Champs** | Formulaire minimaliste : "Nom complet" et "Numéro de téléphone" (avec formatage E.164 automatique). Le champ "Email" est optionnel. |
| **Action** | Un bouton "Créer et sélectionner" qui ferme la modale et sélectionne immédiatement le client dans l'interface Fast-Scan. |

---

## Écran US-04 : Sélection Articles

**Objectif :** Permettre l'ajout d'articles à la commande d'un simple clic.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une grille de cartes cliquables. Chaque carte représente un type d'article (Chemise, Pantalon...). |
| **Style de Carte** | Fond `Blanc`, `border-radius: 8px`, ombre légère. Contient une grande icône de l'article (ex: icône de chemise) et son nom en dessous. |
| **Interaction** | Un simple clic sur la carte ajoute l'article au panier (US-05) avec la quantité 1 et le service par défaut. Un badge sur la carte peut indiquer la quantité déjà ajoutée. |
| **Filtres/Catégories** | Au-dessus de la grille, des onglets ou des boutons permettent de filtrer par catégorie d'article (Vêtements, Linge de maison, etc.) pour les pressings ayant un grand catalogue. |

---

## Écran US-05 : Résumé Commande en Cours (Panier)

**Objectif :** Donner un aperçu clair de la commande en cours de constitution.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une liste verticale d'articles dans la colonne de droite. |
| **Ligne d'Article** | Chaque ligne affiche : Nom de l'article, un sélecteur de quantité (+/-), un menu déroulant pour changer le service (Lavage, Repassage...), et le prix calculé pour la ligne. Une icône "poubelle" permet de supprimer l'article. |
| **Calculs en Temps Réel** | Le sous-total, la TVA et le total de la commande sont affichés en bas du panier et se mettent à jour instantanément à chaque modification. |

---

## Écran US-06 : Toggle Mode Express

**Objectif :** Appliquer le traitement express de manière visible et immédiate.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Style** | Un interrupteur (toggle) proéminent dans la colonne de gauche, avec un label "Mode Express" et une icône d'éclair (⚡). |
| **Interaction** | Quand il est activé, le toggle devient `Orange Vif`. Le panier (US-05) se met à jour instantanément : les prix sont recalculés avec le surcoût, et une nouvelle ligne "Date de livraison promise" apparaît, affichant le SLA réduit. L'ensemble de l'interface peut prendre une teinte légèrement orangée pour rappeler que le mode est actif. |

---

## Écrans US-07 à US-09 : Validation et Impression

**Objectif :** Finaliser la commande et fournir un ticket au client.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **US-07 (Validation)** | Le bouton "Valider la Commande" dans la colonne de gauche devient actif (fond `Bleu Confiance`) uniquement si un client est sélectionné et qu'il y a au moins un article dans le panier. Un clic ouvre une modale de confirmation. |
| **Modale de Confirmation** | Récapitule les informations clés : Nom du client, nombre d'articles, total à payer, et date de retrait. Deux boutons : "Confirmer et Imprimer" et "Annuler". |
| **US-08 (Aperçu Ticket)** | Optionnellement, après confirmation, une prévisualisation du ticket thermique peut s'afficher dans une modale, montrant le design exact avec le QR code géant. |
| **US-09 (Confirmation)** | Après l'envoi à l'imprimante, une notification de succès (style `Vert Succès`) apparaît brièvement, indiquant "Commande #XXXXX créée avec succès". L'interface Fast-Scan est alors réinitialisée pour la prochaine commande. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

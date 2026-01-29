# Spécifications Mobiles : Parcours 5 - User_Site Réception de Commande (Responsive)

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document est fondamental car il adapte l'interface "Fast-Scan" (US) à un usage mobile et tablette. L'objectif est de préserver la vitesse et l'efficacité de la saisie de commande sur un écran de taille réduite, en adoptant une approche **mobile-first** radicale.

---

## Écran US-01 : Interface Réception "Fast-Scan" (Mobile)

**Objectif :** Transformer la disposition tri-colonne en une expérience mobile fluide et intuitive.

### Approche de Conception : Navigation par Onglets (Tab-based)

La disposition en trois colonnes est remplacée par une interface à **trois onglets principaux**, accessibles via une barre d'onglets en haut de l'écran, sous l'en-tête principal.

1.  **Onglet 1 : CLIENT** (Recherche et sélection du client)
2.  **Onglet 2 : ARTICLES** (Sélection des articles dans le catalogue)
3.  **Onglet 3 : PANIER** (Visualisation et validation de la commande)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **En-tête Principal** | Contient le titre "Nouvelle Commande" et le menu hamburger (☰). |
| **Barre d'Onglets** | Trois onglets : "Client", "Articles", "Panier". L'onglet actif est souligné en `Bleu Confiance`. Un badge sur l'onglet "Panier" indique le nombre d'articles. |
| **Flux de Travail** | L'utilisateur est guidé séquentiellement. L'onglet "Articles" est désactivé tant qu'un client n'est pas sélectionné. L'onglet "Panier" est toujours accessible. |

---

### Onglet 1 : Client (US-02, US-03)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | L'Omnibox (US-02) occupe une place centrale. |
| **Interaction** | La recherche affiche les résultats en dessous. Si aucun client n'est trouvé, le bouton "+ Créer un nouveau client" apparaît, ouvrant une vue plein écran pour la création (US-03). |
| **Client Sélectionné** | Une fois un client sélectionné, ses informations (nom, téléphone) s'affichent dans une carte, et l'application passe automatiquement à l'onglet "Articles". |

---

### Onglet 2 : Articles (US-04)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | La grille d'articles (US-04) occupe tout l'espace. |
| **Grille d'Articles** | Les cartes d'articles sont plus petites (2 ou 3 par ligne selon la largeur de l'écran). Les filtres de catégorie sont dans un menu déroulant. |
| **Interaction** | Un tap sur une carte ajoute l'article au panier. Un tap long peut ouvrir une modale pour ajouter une quantité spécifique. Le badge sur l'onglet "Panier" se met à jour en temps réel. |

---

### Onglet 3 : Panier (US-05, US-06, US-07)

| Élément | Spécification Mobile/Tablette |
|---|---|
| **Mise en Page** | La liste des articles du panier (US-05) est affichée sous forme de cartes. |
| **Toggle Express** | Le toggle "Mode Express" (US-06) est positionné en haut de cet onglet, bien visible. |
| **Résumé et Total** | Le calcul du total est affiché dans un pied de page fixe (sticky footer). |
| **Bouton de Validation** | Le bouton "Valider la Commande" (US-07) est le bouton principal dans le pied de page fixe, toujours visible. Il n'est actif que si le panier n'est pas vide. |
| **Confirmation** | La validation ouvre une modale de confirmation (plein écran) qui récapitule la commande avant l'impression. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

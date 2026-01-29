# Spécifications Visuelles : Parcours 9 - Client Portail Mobile

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document définit l'interface (CL) de l'application mobile destinée au client final. Le design doit être simple, élégant et rassurant, offrant au client un accès direct au suivi de ses commandes et à son identification numérique. L'application sera développée en React Native et suivra les conventions de design d'iOS et Android tout en respectant le branding de CleanTrack Pro.

---

## Layout Général et Navigation

- **Navigation Principale :** Une barre d'onglets (Tab Bar) en bas de l'écran avec 4 icônes : 
    1. **Accueil** (icône de maison) - CL-04
    2. **Commandes** (icône de liste/facture) - CL-06
    3. **Mon Code QR** (icône de QR code) - CL-05
    4. **Profil** (icône de personne) - CL-10
- **En-têtes :** Chaque écran a un en-tête simple avec le titre de la page. Le logo du pressing (tenant) peut y être affiché.

---

## Écrans CL-01 à CL-03 : Onboarding et Connexion

**Objectif :** Offrir une première expérience fluide et sécurisée.

| Élément | Spécification Visuelle (Mobile) |
|---|---|
| **CL-01 (Accueil)** | Un écran de bienvenue avec le logo de CleanTrack Pro et deux boutons clairs : "Se Connecter" et "Créer un Compte". |
| **CL-02 (Connexion)** | Interface simple avec les champs "Numéro de téléphone" et "Mot de passe" ou un système de code unique par SMS pour une connexion sans mot de passe (passwordless). Le design est cohérent avec AUTH-01. |
| **CL-03 (Inscription)** | Formulaire simple demandant le "Nom complet", "Numéro de téléphone" et la création d'un mot de passe. |

---

## Écran CL-04 : Dashboard Client

**Objectif :** Donner au client un aperçu immédiat de ses commandes actives.

| Élément | Spécification Visuelle (Mobile) |
|---|---|
| **Mise en Page** | Un message de bienvenue personnalisé ("Bonjour, [Nom du client]"). En dessous, une section "Mes commandes en cours". |
| **Carte de Commande** | Chaque commande en cours est une carte cliquable. La carte affiche : le N° de Commande, le statut actuel (ex: "En cours de lavage"), et la date de retrait promise. Une barre de progression visuelle montre l'avancement dans le cycle de traitement. |
| **Action** | Taper sur une carte mène aux détails de la commande (CL-07). |

---

## Écran CL-05 : Mon Code Unique

**Objectif :** Fournir au client son QR code d'identification pour un service rapide en agence.

| Élément | Spécification Visuelle (Mobile) |
|---|---|
| **Mise en Page** | Très épuré. L'écran affiche un grand QR code au centre. |
| **Informations** | Sous le QR code, le nom du client et son code alphanumérique sont affichés. Un texte d'instruction simple : "Présentez ce code en agence pour un service plus rapide." |

---

## Écrans CL-06 à CL-08 : Suivi des Commandes

**Objectif :** Offrir une transparence totale sur l'historique et le statut des commandes.

| Élément | Spécification Visuelle (Mobile) |
|---|---|
| **CL-06 (Liste)** | Un écran avec deux onglets : "En cours" et "Historique". Chaque onglet contient une liste de cartes de commande. |
| **CL-07 (Détails)** | Accessible depuis la liste. L'écran de détails affiche : les informations générales (N°, statut, dates), la liste détaillée des articles avec les prix, et le montant total. |
| **CL-08 (Suivi Temps Réel)** | La partie la plus importante de l'écran de détails. Une timeline verticale et graphique qui montre chaque étape par laquelle la commande est passée (Créée, En traitement, Prête, Livrée) avec la date et l'heure de chaque étape. L'étape actuelle est mise en évidence. |

---

## Écrans CL-09 à CL-11 : Notifications et Profil

**Objectif :** Gérer les communications et les informations personnelles.

| Élément | Spécification Visuelle (Mobile) |
|---|---|
| **CL-09 (Notifications)** | Un centre de notifications (accessible via une icône de cloche dans l'en-tête) listant les mises à jour importantes : "Votre commande #XXXXX est prête !", "Votre commande est en retard". |
| **CL-10 (Profil)** | Permet au client de voir et modifier ses informations (Nom, Téléphone, Email). Contient également un lien pour changer son mot de passe (menant à AUTH-04) et se déconnecter. |
| **CL-11 (Paiements)** | Une section dans le profil qui liste l'historique de toutes les transactions financières. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

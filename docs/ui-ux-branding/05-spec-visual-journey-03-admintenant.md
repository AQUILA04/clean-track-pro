# Spécifications Visuelles : Parcours 3 - Admin_Tenant

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document détaille les spécifications visuelles pour les écrans du parcours Admin_Tenant (AT). Ce parcours web est le centre de contrôle pour le propriétaire du pressing, lui permettant de gérer son réseau d'agences, de définir son catalogue de services et de piloter sa stratégie tarifaire. Le design doit à la fois évoquer la puissance et la simplicité.

---

## Layout Général

Le layout est cohérent avec celui du Superadmin : une barre de navigation latérale sombre et un espace de contenu principal clair et aéré. Les éléments de menu pour l'Admin_Tenant incluent : Dashboard, Agences, Catalogue (Articles & Services), Utilisateurs, Rapports, et Paramètres.

---

## Écran AT-01 : Dashboard Admin Tenant

**Objectif :** Offrir une vue financière et opérationnelle consolidée de tout le réseau.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Filtres Principaux** | En haut de page, un sélecteur de période (Jour, Semaine, Mois) et un sélecteur multi-sites pour filtrer tout le dashboard. |
| **Cartes KPI** | Une rangée de cartes KPI impactantes : "Chiffre d'Affaires", "Dépenses", "Marge Nette", "Nouvelles Commandes". Style conforme au design system. |
| **Graphique Principal** | Un graphique en barres comparant le CA par agence sur la période sélectionnée. |
| **Tableau de Bord Opérationnel** | Un tableau synthétique montrant les commandes en cours, les commandes en retard et le taux d'occupation moyen des rayons par agence. |

---

## Écrans AT-02 à AT-05 : Gestion des Agences

**Objectif :** Gérer le cycle de vie des agences du réseau.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **AT-02 (Liste)** | Une grille de cartes, où chaque carte représente une agence. La carte affiche le nom, la ville, et 2-3 KPIs clés (CA du jour, commandes). Un bouton "+ Ajouter une agence" est bien visible. |
| **AT-03 (Création)** | Une modale ou une page dédiée avec un formulaire pour entrer les détails de l'agence : Nom, Adresse complète (avec auto-complétion Google Maps si possible), Téléphone, et un champ pour uploader le logo de l'agence. |
| **AT-04 (Détails)** | En cliquant sur une carte d'agence, l'utilisateur accède à une page dédiée avec les détails complets, les statistiques de performance et la liste des utilisateurs de cette agence. |
| **AT-05 (Édition)** | Accessible depuis la page de détails, ce formulaire (en modale) permet de modifier les informations de l'agence. |

---

## Écrans AT-07 à AT-11 : Configuration du Catalogue et des Prix

**Objectif :** Permettre une configuration flexible et puissante des services et tarifs.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page Générale** | Une page "Catalogue" avec des onglets : "Types d'Articles", "Services", "Grille Tarifaire", "Mode Express". |
| **AT-07/08 (Types d'Articles)** | Un tableau simple listant les articles (Chemise, Pantalon...). Chaque ligne a un bouton "Éditer". Un bouton "+ Ajouter un article" ouvre une modale (AT-08) avec les champs "Nom de l'article", "Catégorie" et un sélecteur d'icônes (bibliothèque Heroicons). |
| **AT-09 (Services)** | Similaire à la gestion d'articles, un tableau pour définir les services (Lavage, Repassage, etc.). |
| **AT-10 (Grille Tarifaire)** | Le cœur de la configuration. Une matrice (tableau dense) où les lignes sont les **Types d'Articles** et les colonnes sont les **Services**. Chaque cellule est un champ de saisie pour le prix. Les cellules non applicables sont grisées. Un bouton "Enregistrer les tarifs" est présent en haut. |
| **AT-11 (Mode Express)** | Une page de paramètres simple avec deux champs principaux : "Multiplicateur de prix" (ex: 1.5) et "Délai de livraison promis (en heures)" (ex: 24). |

---

## Écrans AT-06 & AT-12 : Administration

**Objectif :** Gérer les accès et les paramètres généraux.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **AT-06 (Gestion Utilisateurs)** | Un tableau listant tous les utilisateurs du tenant. Colonnes : Nom, Email, Rôle (`Admin_Site` ou `User_Site`), Agence(s) assignée(s). Un bouton "+ Inviter un utilisateur" ouvre une modale pour envoyer une invitation par email et assigner un rôle et une ou plusieurs agences. |
| **AT-12 (Paramètres Généraux)** | Une page pour configurer le branding du tenant : upload du logo principal du réseau, nom de l'entreprise, et autres informations qui pourraient apparaître sur les factures ou communications. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

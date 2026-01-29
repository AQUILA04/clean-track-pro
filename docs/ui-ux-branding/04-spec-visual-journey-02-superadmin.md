# Spécifications Visuelles : Parcours 2 - Superadmin

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document détaille les spécifications visuelles pour les écrans du parcours Superadmin (SA). Ce parcours est exclusivement sur la plateforme web et est conçu pour être un outil de gestion puissant, clair et efficace pour l'administration de la plateforme SaaS CleanTrack Pro.

---

## Layout Général

- **Navigation :** Une barre latérale de navigation à gauche, de couleur `Gris Foncé` (#1F2937), avec le logo CleanTrack Pro en haut, suivi par les icônes de navigation (Dashboard, Tenants, Paramètres) en blanc. Le label de l'onglet actif est mis en surbrillance avec un fond `Bleu Confiance`.
- **Contenu Principal :** La zone de contenu à droite utilise un fond `Bleu Ciel` (#F0F5FF) pour une atmosphère douce et professionnelle.
- **En-tête de Page :** Chaque page a un en-tête clair avec le titre de la page (ex: "Dashboard Superadmin") en `Inter Bold`, 36px, et des actions contextuelles (ex: bouton "Créer un Tenant") à droite.

---

## Écran SA-01 : Dashboard Superadmin

**Objectif :** Fournir une vue d'ensemble immédiate de la santé de la plateforme.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Une grille de cartes KPI en haut, suivie par des graphiques et des listes. |
| **Cartes KPI** | 3 à 4 cartes principales (ex: "Nombre de Tenants Actifs", "Total Utilisateurs", "CA Global Plateforme"). Chaque carte a un fond `Blanc`, `border-radius: 8px`, une ombre subtile, une icône illustrative, le titre du KPI, et la valeur en grand (`Inter Bold`, 36px). |
| **Graphiques** | Un graphique linéaire montrant l'évolution du nombre de tenants sur les 30 derniers jours. Utilise la palette de couleurs du design system (`Bleu Confiance` pour la ligne). |
| **Liste des Derniers Tenants** | Un tableau simple affichant les 5 derniers tenants ajoutés, avec leur nom, date de création et statut. |

---

## Écran SA-02 : Liste des Tenants

**Objectif :** Permettre au Superadmin de rechercher, filtrer et visualiser tous les tenants.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Barre d'Actions** | En haut de la page, un champ de recherche ("Rechercher par nom ou sous-domaine") et un bouton "+ Créer un Tenant" (style primaire). |
| **Tableau des Tenants** | Un tableau pleine largeur avec les colonnes : Nom du Tenant, Sous-domaine, Contact Principal, Date d'inscription, Statut (Actif/Inactif, avec une puce de couleur `Vert Succès` ou `Gris Neutre`). |
| **Lignes du Tableau** | Au survol (`hover`), la ligne est mise en évidence avec un fond `Bleu Ciel`. Chaque ligne est cliquable pour naviguer vers les détails du tenant (SA-04). |
| **Actions par Ligne** | Une icône "trois points" à la fin de chaque ligne ouvre un menu pour des actions rapides (Éditer, Désactiver). |

---

## Écran SA-03 : Création de Tenant

**Objectif :** Offrir un formulaire simple et guidé pour onboarder un nouveau client.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Type** | Modale ou page dédiée. Une modale est préférée pour ne pas perdre le contexte de la liste des tenants. |
| **Mise en Page** | Un formulaire vertical dans une carte (`border-radius: 12px`). |
| **Titre** | "Créer un nouveau Tenant". |
| **Champs de Formulaire** | "Nom de l'entreprise", "Sous-domaine" (`.cleantrack.pro` en suffixe), "Nom du contact", "Email du contact". Les champs sont validés en temps réel. |
| **Boutons d'Action** | "Créer le Tenant" (style primaire) et "Annuler" (style secondaire). Le bouton de création est désactivé jusqu'à ce que le formulaire soit valide. |

---

## Écran SA-04 : Détails du Tenant

**Objectif :** Fournir une vue à 360° d'un tenant spécifique.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Un en-tête avec les informations clés, suivi par des onglets pour naviguer entre les différentes sections (Utilisateurs, Facturation, Paramètres). |
| **En-tête** | Affiche le logo et le nom du tenant, son statut, et des actions principales comme "Contacter" ou "Désactiver". |
| **Onglets** | Design d'onglets classique, où l'onglet actif a une bordure inférieure en `Bleu Confiance`. |
| **Contenu des Onglets** | Chaque onglet affiche des informations spécifiques sous forme de cartes et de tableaux (ex: liste des utilisateurs `Admin_Tenant` dans l'onglet "Utilisateurs"). |

---

## Écran SA-05 : Édition du Tenant

**Objectif :** Permettre la modification des informations d'un tenant.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Type** | Modale, accessible depuis la page de détails du tenant (SA-04). |
| **Champs** | Les mêmes champs que pour la création (SA-03), pré-remplis avec les informations actuelles. |
| **Boutons d'Action** | "Enregistrer les modifications" (primaire) et "Annuler" (secondaire). |

---

## Écran SA-06 : Gestion des utilisateurs Tenant

**Objectif :** Permettre l'assignation et la révocation des rôles `Admin_Tenant`.

| Élément | Spécification Visuelle (Web) |
|---|---|
| **Mise en Page** | Un tableau listant les utilisateurs associés à ce tenant, avec un bouton "+ Inviter un Administrateur". |
| **Tableau** | Colonnes : Nom, Email, Rôle (`Admin_Tenant`), Date d'ajout. |
| **Actions** | Possibilité de révoquer le rôle d'un administrateur directement depuis le tableau. |
| **Modale d'Invitation** | Un formulaire simple avec un champ "Email" pour inviter un nouvel administrateur. |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

# Admin Tenant Agency UI Implementation Context

**Date:** 2026-02-03
**Status:** Agency Management UI Complete (Mock Data)

## 🎯 Objectif
Implémentation complète du module de gestion des agences pour l'interface Admin Tenant, incluant la liste des agences, la création, et la vue détaillée, avec une attention particulière au design (Glassmorphism, Modales d'alerte).

## 🛠️ Fonctionnalités Implémentées

### 1. Page Liste des Agences (`/agencies`)
- **Grille des Agences** : Affichage des agences sous forme de cartes riches (`AgencyCard`) avec indicateurs de performance (Revenu, Tendance).
- **Carte d'Ajout** : Carte spéciale "Ajouter une agence" (`AddAgencyCard`) invitant à l'action.
- **Filtres** : Barre d'outils (`AgencyFilters`) avec recherche, filtres par statut et ville (maquette).
- **Modal de Création** : Formulaire (`AddAgencyModal`) pour ajouter une nouvelle agence.

### 2. Page Détails Agence (`/agencies/[id]`)
Accessible via le lien "Voir détails" sur une carte.
- **En-tête (`AgencyHeader`)** : Nom, Ville, Badges de statut, Bouton d'édition.
- **KPIs (`AgencyStatsRow`)** :
    -   Revenu journalier (avec tendance).
    -   Commandes actives.
    -   Taux de remplissage (avec barre de progression).
- **Informations (`AgencyInfoCard`)** : Adresse, Contact, Lien Google Maps.
- **Équipe (`TeamListCard`)** : Liste des gestionnaires avec rôles (Admin Site/User Site).
- **Performance (`PerformanceChartCard`)** : Graphique en bâton (Recharts) des revenus hebdomadaires.
- **Navigation** : Lien "Retour à la liste" ajouté.

### 3. Système de Modales & UI
- **Glassmorphism** : Mise à jour de `modal.tsx` pour utiliser un fond flouté (`backdrop-blur-sm bg-gray-900/40`).
- **Success Modal** : Nouvelle modale (`SuccessModal.tsx`) style **Vert** pour confirmer les actions (ex: création d'agence).
- **Failure Modal** : Nouvelle modale (`FailureModal.tsx`) style **Rouge** pour les erreurs critiques.

## 📂 Structure des Fichiers

### Pages
- `src/app/(dashboard)/agencies/page.tsx`
- `src/app/(dashboard)/agencies/[id]/page.tsx`

### Composants (`src/components/agencies/`)
- `AgencyCard.tsx`
- `AddAgencyCard.tsx`
- `AgencyFilters.tsx`
- `AddAgencyModal.tsx`
- `AgencyHeader.tsx`
- `AgencyStatsRow.tsx`
- `AgencyInfoCard.tsx`
- `TeamListCard.tsx`
- `PerformanceChartCard.tsx`

### Composants UI (`src/components/ui/`)
- `SuccessModal.tsx`
- `FailureModal.tsx`
- `Badge.tsx` (Mis à jour avec statuts ACTIVE/CLOSED/MAINTENANCE)

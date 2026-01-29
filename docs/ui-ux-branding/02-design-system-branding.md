# Spécifications : Design System & Branding - CleanTrack Pro

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## 1. Introduction

Ce document établit les fondations de l'identité visuelle et de l'expérience utilisateur pour la plateforme CleanTrack Pro. Il sert de guide de référence pour garantir la cohérence, la qualité et la modernité de toutes les interfaces web et mobiles. Le design vise à être à la fois professionnel, rassurant et hautement fonctionnel.

---

## 2. Identité Visuelle (Branding)

### 2.1. Logo

Le logo de CleanTrack Pro (placeholder) combine une icône symbolisant la propreté et le suivi (ex: une goutte d'eau stylisée avec une coche) et une typographie moderne et épurée. Il doit être simple, mémorable et adaptable sur différents supports.

### 2.2. Palette de Couleurs

La palette est construite autour du "Bleu de la Confiance" pour asseoir le professionnalisme, complétée par des couleurs sémantiques claires pour les statuts et les actions.

| Rôle | Couleur | HEX | Description |
|---|---|---|---|
| **Primaire** | Bleu Confiance | `#1A5AD7` | Utilisé pour les actions principales, les en-têtes et les éléments de branding. Inspire la confiance et la fiabilité. |
| **Secondaire** | Bleu Ciel | `#F0F5FF` | Arrière-plans de sections, cartes et éléments secondaires pour créer une hiérarchie douce. |
| **Accent** | Orange Vif | `#FF6B00` | Réservé au mode "Express" et aux appels à l'action urgents. Attire l'attention. |
| **Neutre (Texte)** | Gris Foncé | `#1F2937` | Couleur principale du texte pour une lisibilité optimale. |
| **Neutre (Bordures)** | Gris Clair | `#D1D5DB` | Utilisé pour les bordures, les séparateurs et les arrière-plans de champs de saisie. |
| **Neutre (Fond)** | Blanc | `#FFFFFF` | Couleur de fond principale pour un design propre et aéré. |
| **Succès** | Vert Succès | `#10B981` | Statuts positifs, confirmations et disponibilité (ex: rayon libre). |
| **Avertissement** | Ambre | `#F59E0B` | Alertes non critiques, notifications de retard (SLA). |
| **Erreur** | Rouge Erreur | `#EF4444` | Messages d'erreur, statuts de perte et actions destructrices. |
| **Occupé** | Gris Neutre | `#6B7280` | Statut pour les éléments occupés ou inactifs (ex: rayon occupé). |

### 2.3. Typographie

La police **Inter** est choisie pour sa clarté exceptionnelle sur les écrans et son esthétique moderne et neutre. Elle est disponible gratuitement sur Google Fonts.

| Utilisation | Police | Poids | Taille (Web/Mobile) | Hauteur de ligne |
|---|---|---|---|---|
| **Titre H1** | Inter | Bold (700) | 36px / 28px | 1.2 |
| **Titre H2** | Inter | Bold (700) | 28px / 22px | 1.3 |
| **Titre H3** | Inter | SemiBold (600) | 22px / 18px | 1.4 |
| **Corps de texte** | Inter | Regular (400) | 16px / 15px | 1.6 |
| **Labels / Petits textes** | Inter | Medium (500) | 14px / 13px | 1.5 |
| **Boutons** | Inter | SemiBold (600) | 16px / 15px | 1 |

---

## 3. Design System (Composants UI)

### 3.1. Principes de Base

- **Espacement :** Utilisation d'une grille de 8px. Tous les espacements (marges, paddings) sont des multiples de 8 (8, 16, 24, 32px).
- **Bordures :** Rayon de bordure standard de **8px** pour les cartes, boutons et champs de saisie pour un look moderne et doux. Rayon de **12px** pour les modales.
- **Ombres :** Des ombres subtiles sont utilisées pour donner de la profondeur et élever les éléments interactifs comme les cartes et les boutons.

### 3.2. Composants

#### **Boutons**
- **Primaire :** Fond `Bleu Confiance` (#1A5AD7), texte `Blanc`. Utilisé pour l'action principale de la page.
- **Secondaire :** Fond `transparent`, bordure `Gris Clair` (#D1D5DB), texte `Gris Foncé`. Pour les actions secondaires.
- **Urgent (Express) :** Fond `Orange Vif` (#FF6B00), texte `Blanc`. Pour les actions liées au mode express.
- **Destructif :** Fond `transparent`, bordure `Rouge Erreur` (#EF4444), texte `Rouge Erreur`. Pour les suppressions.
- **État :** Les boutons ont des états `hover` (légèrement plus sombre), `focus` (avec une ombre ou un contour) et `disabled` (fond gris clair, texte gris neutre).

#### **Champs de Saisie (Forms)**
- **Standard :** Fond `Blanc`, bordure `Gris Clair` (#D1D5DB). Au focus, la bordure devient `Bleu Confiance`.
- **Omnibox :** Champ de recherche proéminent avec une icône de loupe. Fond `Bleu Ciel` (#F0F5FF) pour le distinguer.
- **Labels :** Positionnés au-dessus du champ, en `Inter Medium`.

#### **Cartes (Cards)**
- **Structure :** Fond `Blanc`, bordure `Gris Clair` (#D1D5DB), `border-radius: 8px`, ombre subtile.
- **Utilisation :** Pour encapsuler des informations (KPIs de dashboard, détails de commande, etc.).

#### **Modales**
- **Structure :** `border-radius: 12px`, ombre marquée. L'arrière-plan de la page est flouté (backdrop-filter) pour concentrer l'attention.
- **En-tête :** Titre en `Inter Bold`, aligné à gauche, avec un bouton de fermeture (icône 'X') à droite.

#### **Tables**
- **Design :** Épuré et lisible. L'en-tête de la table a un fond `Bleu Ciel` (#F0F5FF) et un texte en `Inter SemiBold`. Les lignes alternent de couleur (blanc et gris très clair) pour une meilleure lisibilité.

#### **Icônes**
- **Bibliothèque :** **Heroicons** (Outline) est choisie pour son style moderne et sa compatibilité avec Tailwind CSS. Taille standard de 24x24px.

---

## 4. Spécifications par Plateforme

### 4.1. Web (Dashboard & Back-office)

- **Layout :** Barre de navigation latérale (sidebar) fixe à gauche, en `Gris Foncé` avec des icônes et labels en `Blanc`. Le contenu principal se déploie à droite.
- **Densité :** L'interface est optimisée pour les grands écrans, affichant une grande densité d'informations (tables, dashboards) de manière claire.

### 4.2. Mobile (Application Client)

- **Layout :** Barre de navigation inférieure (tab bar) avec 3 à 4 icônes principales (Accueil, Commandes, QR Code, Profil).
- **Interactions :** Optimisées pour le tactile. Les boutons sont plus grands et les gestes (swipe) sont utilisés pour des actions comme la suppression.

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

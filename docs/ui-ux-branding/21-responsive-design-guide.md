# Guide de Conception Responsive - CleanTrack Pro

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## 1. Introduction : Approche Mobile-First

Ce document établit les principes et les patrons de conception responsive pour l'ensemble de la plateforme web CleanTrack Pro. L'approche est **Mobile-First** : chaque interface est d'abord conçue pour une expérience optimale sur un petit écran (mobile), puis améliorée progressivement pour les écrans plus grands (tablette, desktop).

Cette approche garantit que l'application est fonctionnelle et performante sur tous les appareils, ce qui est essentiel pour les utilisateurs qui gèrent leurs opérations en situation de mobilité.

---

## 2. Breakpoints

Nous utilisons un système de breakpoints simple et standard, basé sur la largeur de la fenêtre d'affichage (viewport).

| Nom | Breakpoint | Description |
|---|---|---|
| **Mobile (par défaut)** | `< 768px` | Design à une seule colonne, optimisé pour le tactile. |
| **Tablette** | `≥ 768px` | Design à deux colonnes, plus d'espace blanc, les barres latérales peuvent apparaître. |
| **Desktop** | `≥ 1280px` | Design multi-colonnes, affichage de données denses, utilisation complète de l'espace. |

---

## 3. Patrons de Conception Responsive (Patterns)

### 3.1. Navigation Principale

- **Mobile :** La barre de navigation latérale (sidebar) est masquée. Un bouton **hamburger (☰)** dans l'en-tête de page ouvre le menu de navigation en superposition (overlay) sur le côté gauche de l'écran.
- **Tablette/Desktop :** La barre de navigation latérale est visible en permanence.

### 3.2. Disposition des Contenus (Layout)

- **Mobile :** Toutes les mises en page multi-colonnes sont **empilées verticalement** en une seule colonne.
- **Tablette :** Les mises en page à deux colonnes sont introduites.
- **Desktop :** Les mises en page à trois colonnes ou plus sont utilisées (ex: interface Fast-Scan).

### 3.3. Tableaux de Données (Data Tables)

Les tableaux larges sont le plus grand défi du responsive design.

- **Mobile :** Les tableaux sont transformés en une **liste de cartes empilées**. Chaque carte représente une ligne du tableau et affiche les données les plus importantes. Un tap sur la carte révèle les détails complets.
- **Tablette :** Les tableaux peuvent être affichés, mais avec un **défilement horizontal (horizontal scroll)** si le contenu est trop large. Les colonnes les plus importantes sont visibles par défaut.
- **Desktop :** Les tableaux sont affichés dans leur intégralité.

### 3.4. Actions et Boutons

- **Mobile :** Les actions de création principales (ex: "+ Ajouter") sont déplacées dans un **Bouton d'Action Flottant (FAB)**, positionné en bas à droite de l'écran pour un accès facile avec le pouce.
- **Tablette/Desktop :** Les boutons d'action sont placés dans l'en-tête de la page ou de la section.

### 3.5. Formulaires et Modales

- **Mobile :** Les modales s'affichent en **plein écran** pour maximiser l'espace. L'en-tête contient un titre et un bouton "Retour" ou "Fermer". Les boutons d'action du formulaire sont placés dans un **pied de page fixe (sticky footer)**.
- **Tablette/Desktop :** Les modales s'affichent de manière classique, centrées avec un fond superposé.

### 3.6. Interfaces Complexes (Exemples)

- **Interface Fast-Scan (US-01) :**
    - **Mobile :** La disposition tri-colonne est transformée en une **navigation par onglets** ("Client", "Articles", "Panier") pour guider l'utilisateur étape par étape.
    - **Desktop :** La disposition tri-colonne est conservée pour une efficacité maximale.

- **Grille Tarifaire (AT-10) :**
    - **Mobile :** La matrice complexe est remplacée par un flux de **"drill-down"** : l'utilisateur sélectionne d'abord un article, puis voit et modifie les prix des services associés à cet article.
    - **Desktop :** La matrice complète est affichée.

---

## 4. Grille et Espacement

- **Grille :** Basée sur un système de 12 colonnes pour la flexibilité.
- **Espacement :** La grille de 8px est conservée sur toutes les tailles d'écran. Cependant, les marges et paddings externes sont réduits sur mobile (ex: 16px au lieu de 24px ou 32px sur desktop).

---

## 5. Typographie

Les tailles de police sont ajustées pour une lisibilité optimale sur chaque taille d'écran, comme défini dans le Design System.

| Élément | Mobile | Desktop |
|---|---|---|
| **Titre H1** | 28px | 36px |
| **Titre H2** | 22px | 28px |
| **Corps de texte** | 15px | 16px |

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

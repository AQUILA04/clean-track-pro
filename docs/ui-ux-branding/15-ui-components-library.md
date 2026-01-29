# Bibliothèque de Composants UI - CleanTrack Pro

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document catalogue tous les composants UI réutilisables de CleanTrack Pro. Chaque composant est défini avec ses variantes, ses états et ses spécifications d'implémentation. Cette bibliothèque sert de référence pour garantir la cohérence et accélérer le développement.

---

## 1. Boutons (Buttons)

### 1.1. Bouton Primaire

**Utilisation :** Action principale de la page ou du formulaire.

| Propriété | Valeur |
|-----------|--------|
| **Background** | `#1A5AD7` (Bleu Confiance) |
| **Texte** | `#FFFFFF` (Blanc), `Inter SemiBold`, 16px |
| **Padding** | 14px vertical, 24px horizontal |
| **Border-radius** | 8px |
| **État Hover** | `background: #1548B0` |
| **État Focus** | Bordure `2px solid #1A5AD7` avec `outline-offset: 2px` |
| **État Disabled** | `background: #D1D5DB`, `color: #6B7280`, `cursor: not-allowed` |

**Exemple HTML/CSS :**
```html
<button class="btn btn-primary">Se Connecter</button>
```

---

### 1.2. Bouton Secondaire

**Utilisation :** Actions secondaires ou alternatives.

| Propriété | Valeur |
|-----------|--------|
| **Background** | `transparent` |
| **Texte** | `#1F2937` (Gris Foncé), `Inter SemiBold`, 16px |
| **Border** | `1px solid #D1D5DB` |
| **Padding** | 14px vertical, 24px horizontal |
| **Border-radius** | 8px |
| **État Hover** | `background: #F0F5FF`, `border-color: #1A5AD7` |

---

### 1.3. Bouton Express (Urgent)

**Utilisation :** Actions liées au mode express.

| Propriété | Valeur |
|-----------|--------|
| **Background** | `#FF6B00` (Orange Vif) |
| **Texte** | `#FFFFFF`, `Inter SemiBold`, 16px |
| **Icône** | ⚡ (éclair) avant le texte |
| **Padding** | 14px vertical, 24px horizontal |
| **Border-radius** | 8px |
| **État Hover** | `background: #E65F00` |

---

### 1.4. Bouton Destructif

**Utilisation :** Actions de suppression ou d'annulation irréversible.

| Propriété | Valeur |
|-----------|--------|
| **Background** | `transparent` |
| **Texte** | `#EF4444` (Rouge Erreur), `Inter SemiBold`, 16px |
| **Border** | `1px solid #EF4444` |
| **État Hover** | `background: #FEE2E2`, `border-color: #DC2626` |

---

## 2. Champs de Saisie (Input Fields)

### 2.1. Champ de Texte Standard

| Propriété | Valeur |
|-----------|--------|
| **Background** | `#FFFFFF` |
| **Border** | `1px solid #D1D5DB` |
| **Border-radius** | 8px |
| **Padding** | 12px 16px |
| **Font** | `Inter Regular`, 16px |
| **Placeholder** | `color: #9CA3AF` |
| **État Focus** | `border-color: #1A5AD7`, `outline: none`, `box-shadow: 0 0 0 3px rgba(26, 90, 215, 0.1)` |
| **État Error** | `border-color: #EF4444` |

**Avec Label :**
```html
<div class="form-group">
  <label class="form-label">Adresse e-mail</label>
  <input type="email" class="form-input" placeholder="exemple@email.com">
</div>
```

---

### 2.2. Omnibox (Recherche Avancée)

**Utilisation :** Recherche client dans l'interface Fast-Scan.

| Propriété | Valeur |
|-----------|--------|
| **Background** | `#F0F5FF` (Bleu Ciel) |
| **Border** | `2px solid #1A5AD7` |
| **Border-radius** | 12px |
| **Padding** | 16px 20px 16px 48px |
| **Font** | `Inter Medium`, 18px |
| **Icône** | Loupe (Heroicons) positionnée à gauche |
| **Autocomplete** | Liste déroulante avec résultats en temps réel |

---

### 2.3. Sélecteur (Dropdown)

| Propriété | Valeur |
|-----------|--------|
| **Background** | `#FFFFFF` |
| **Border** | `1px solid #D1D5DB` |
| **Border-radius** | 8px |
| **Padding** | 12px 16px |
| **Icône** | Chevron bas (Heroicons) à droite |
| **Menu déroulant** | `background: #FFFFFF`, `border: 1px solid #D1D5DB`, `box-shadow: 0 4px 12px rgba(0,0,0,0.1)` |

---

## 3. Cartes (Cards)

### 3.1. Carte Standard

**Utilisation :** Encapsuler des informations groupées.

| Propriété | Valeur |
|-----------|--------|
| **Background** | `#FFFFFF` |
| **Border** | `1px solid #D1D5DB` |
| **Border-radius** | 8px |
| **Padding** | 24px |
| **Box-shadow** | `0 1px 3px rgba(0, 0, 0, 0.1)` |
| **État Hover** | `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)` (si cliquable) |

---

### 3.2. Carte KPI

**Utilisation :** Afficher des métriques clés sur les dashboards.

| Propriété | Valeur |
|-----------|--------|
| **Structure** | Icône + Titre + Valeur + Variation |
| **Icône** | 32px × 32px, couleur `#1A5AD7`, fond `#F0F5FF` circulaire |
| **Titre** | `Inter Medium`, 14px, `color: #6B7280` |
| **Valeur** | `Inter Bold`, 36px, `color: #1F2937` |
| **Variation** | Flèche + pourcentage, `color: #10B981` (positif) ou `#EF4444` (négatif) |

**Exemple :**
```
┌─────────────────────────┐
│  [📊]                   │
│  Chiffre d'Affaires     │
│  45 230 €               │
│  ↑ +12% vs semaine      │
└─────────────────────────┘
```

---

### 3.3. Carte de Commande

**Utilisation :** Représenter une commande dans les listes et dashboards.

| Propriété | Valeur |
|-----------|--------|
| **Structure** | N° Commande + Client + Statut + Date |
| **Badge Statut** | Puce de couleur + texte (voir section Badges) |
| **Badge Express** | Bandeau orange avec ⚡ si mode express |
| **Interaction** | Cliquable, mène aux détails de la commande |

---

## 4. Badges et Puces de Statut

### 4.1. Badges de Statut de Commande

| Statut | Couleur | Code HEX |
|--------|---------|----------|
| **CREATED** | Gris | `#6B7280` |
| **IN_PROGRESS** | Bleu | `#1A5AD7` |
| **READY** | Vert | `#10B981` |
| **STORED** | Vert Foncé | `#059669` |
| **DELIVERED** | Vert Succès | `#10B981` |
| **DELAYED** | Ambre | `#F59E0B` |
| **CANCELLED** | Gris Neutre | `#6B7280` |
| **LOST** | Rouge | `#EF4444` |

**Style :**
```css
.badge-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.badge-status::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background-color: currentColor;
}
```

---

### 4.2. Badge Express

| Propriété | Valeur |
|-----------|--------|
| **Background** | `#FF6B00` |
| **Texte** | `#FFFFFF`, `Inter SemiBold`, 12px |
| **Icône** | ⚡ |
| **Padding** | 4px 10px |
| **Border-radius** | 12px |

---

## 5. Modales (Modals)

### 5.1. Modale Standard

| Propriété | Valeur |
|-----------|--------|
| **Overlay** | `background: rgba(0, 0, 0, 0.5)`, `backdrop-filter: blur(4px)` |
| **Container** | `background: #FFFFFF`, `border-radius: 12px`, `max-width: 600px` |
| **Padding** | 32px |
| **Box-shadow** | `0 20px 60px rgba(0, 0, 0, 0.3)` |
| **En-tête** | Titre (`Inter Bold`, 22px) + Bouton fermeture (icône X) |
| **Corps** | Contenu du formulaire ou message |
| **Pied de page** | Boutons d'action alignés à droite |

---

### 5.2. Modale de Confirmation

**Utilisation :** Confirmer une action importante.

| Propriété | Valeur |
|-----------|--------|
| **Icône** | Icône d'avertissement (triangle avec !) en haut |
| **Titre** | Question claire, ex: "Confirmer la suppression ?" |
| **Message** | Explication des conséquences |
| **Boutons** | "Annuler" (secondaire) + "Confirmer" (primaire ou destructif) |

---

## 6. Tables (Tableaux)

### 6.1. Tableau Standard

| Propriété | Valeur |
|-----------|--------|
| **En-tête** | `background: #F0F5FF`, `color: #1F2937`, `Inter SemiBold`, 14px, `padding: 12px 16px` |
| **Lignes** | Alternance `#FFFFFF` et `#F9FAFB` |
| **Bordures** | `border-bottom: 1px solid #E5E7EB` entre les lignes |
| **Padding cellules** | 12px 16px |
| **État Hover** | `background: #F0F5FF` |

---

### 6.2. Tableau avec Actions

**Ajout :** Colonne "Actions" à droite avec icônes (Voir, Éditer, Supprimer).

| Propriété | Valeur |
|-----------|--------|
| **Icônes** | 20px × 20px, `color: #6B7280` |
| **État Hover** | `color: #1A5AD7` |
| **Menu Actions** | Menu déroulant (trois points verticaux) |

---

## 7. Navigation

### 7.1. Sidebar (Barre Latérale)

| Propriété | Valeur |
|-----------|--------|
| **Background** | `#1F2937` (Gris Foncé) |
| **Largeur** | 240px |
| **Logo** | En haut, centré, 180px de largeur |
| **Items de menu** | `color: #FFFFFF`, `Inter Medium`, 16px, `padding: 12px 20px` |
| **Item actif** | `background: #1A5AD7`, `border-left: 4px solid #FFFFFF` |
| **Icônes** | 24px × 24px, à gauche du texte |

---

### 7.2. Tab Bar (Mobile)

| Propriété | Valeur |
|-----------|--------|
| **Position** | Fixée en bas de l'écran |
| **Background** | `#FFFFFF` |
| **Border-top** | `1px solid #E5E7EB` |
| **Items** | 3-4 icônes avec labels |
| **Item actif** | `color: #1A5AD7` |
| **Item inactif** | `color: #6B7280` |

---

## 8. Notifications et Alertes

### 8.1. Toast (Notification)

| Propriété | Valeur |
|-----------|--------|
| **Position** | En haut à droite ou en bas à droite |
| **Background** | Selon le type (Succès: `#10B981`, Erreur: `#EF4444`, Info: `#1A5AD7`) |
| **Texte** | `#FFFFFF`, `Inter Medium`, 14px |
| **Padding** | 16px 20px |
| **Border-radius** | 8px |
| **Durée** | 3-5 secondes |
| **Animation** | Slide-in depuis la droite |

---

### 8.2. Bannière d'Alerte

| Propriété | Valeur |
|-----------|--------|
| **Position** | En haut de la page ou de la section |
| **Background** | `#FEF3C7` (Avertissement), `#FEE2E2` (Erreur) |
| **Texte** | `#92400E` (Avertissement), `#991B1B` (Erreur) |
| **Icône** | À gauche du texte |
| **Bouton fermeture** | Icône X à droite |

---

## 9. Composants Spécialisés

### 9.1. Grille de Rayons

**Utilisation :** Visualisation des emplacements de stockage.

| Propriété | Valeur |
|-----------|--------|
| **Structure** | Grille CSS avec colonnes et lignes |
| **Case Libre** | `background: #D1FAE5`, `border: 2px solid #10B981` |
| **Case Occupée** | `background: #E5E7EB`, `border: 2px solid #6B7280` |
| **Label** | Centré, `Inter Bold`, 16px |
| **Taille** | 80px × 80px (ajustable) |
| **Tooltip** | Affiche les détails de la commande au survol (si occupée) |

---

### 9.2. Timeline de Statut

**Utilisation :** Afficher la progression d'une commande.

| Propriété | Valeur |
|-----------|--------|
| **Structure** | Ligne verticale avec des points pour chaque étape |
| **Ligne** | `2px solid #D1D5DB` |
| **Point actif** | Cercle `#1A5AD7`, 16px de diamètre |
| **Point complété** | Cercle `#10B981` avec icône checkmark |
| **Point futur** | Cercle `#E5E7EB` |
| **Texte** | Nom de l'étape + date/heure |

---

### 9.3. QR Code Display

**Utilisation :** Afficher le QR code client dans l'app mobile.

| Propriété | Valeur |
|-----------|--------|
| **Taille** | 250px × 250px |
| **Background** | `#FFFFFF` |
| **Padding** | 20px autour du QR code |
| **Border** | `1px solid #D1D5DB` |
| **Border-radius** | 12px |
| **Code alphanumérique** | Affiché sous le QR code, `Inter Bold`, 24px |

---

## 10. États et Animations

### 10.1. États Interactifs

Tous les éléments interactifs doivent avoir les états suivants :

- **Normal :** État par défaut
- **Hover :** Au survol de la souris
- **Focus :** Lorsque l'élément a le focus (clavier)
- **Active :** Pendant le clic
- **Disabled :** Lorsque l'élément est désactivé

### 10.2. Transitions

```css
.interactive-element {
  transition: all 0.2s ease-in-out;
}
```

### 10.3. Animations de Chargement

**Spinner :**
```css
.spinner {
  border: 3px solid #F0F5FF;
  border-top: 3px solid #1A5AD7;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 11. Responsive Design

### 11.1. Breakpoints

| Nom | Largeur | Utilisation |
|-----|---------|-------------|
| **Mobile** | < 640px | Smartphones |
| **Tablet** | 640px - 1024px | Tablettes |
| **Desktop** | > 1024px | Ordinateurs |

### 11.2. Adaptations Mobiles

- Réduire les paddings (16px au lieu de 24px)
- Passer les grilles en colonnes simples
- Augmenter la taille des zones tactiles (minimum 44px × 44px)
- Simplifier les tableaux (cartes empilées au lieu de tableaux)

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

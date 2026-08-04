# Référence Fonctionnelle — Écrans Agence

Specs **fonctionnelles** uniquement. Le style visuel est défini dans [visual-style.md](visual-style.md) et `visual-reference/*.png`.

**Ne pas** utiliser `docs/ui-ux-branding/mockups/` comme référence visuelle.

---

## Cartographie des parcours

| Code | Parcours | Doc source |
|------|----------|------------|
| AS | Admin Site (gérant agence) | `docs/ui-ux-branding/06-spec-visual-journey-04-adminsite.md` |
| US | Réception Fast-Scan | `docs/ui-ux-branding/07-spec-visual-journey-05-usersite-reception.md` |
| UR | Rangement & stockage | `docs/ui-ux-branding/09-spec-visual-journey-07-usersite-storage.md` |
| UT | Traitement commandes | `docs/ui-ux-branding/08-spec-visual-journey-06-usersite-processing.md` |

---

## AS — Admin Site

### AS-01 Dashboard
- KPI row: Commandes du jour, CA du jour, Commandes en retard, Taux occupation rayons
- Graphique activité horaire (commandes par heure)
- Section "À faire aujourd'hui" : tâches urgentes avec liens
- Table "Dernières commandes" : ID, Client, Service, Statut

### AS-02 à AS-05 Rayons
- Bouton "+ Créer un Rayon"
- Grille visuelle slots
- Modale création: label (ex. A-01), suggestion auto
- Modale édition: changement de label

### AS-06 Dépenses
- Tableau: Date, Description, Catégorie, Montant
- Filtre période jour/semaine/mois
- Modale ajout avec upload justificatif

### AS-07 Rapports
- Filtres date, CA / Dépenses / Marge nette, export PDF

---

## UT — Commandes (liste & détail)

### Liste commandes
- Omnibox recherche globale
- Filtres par statut avec compteurs (chips)
- Table: ID, Client (avatar), Articles, Prix, Statut, Date
- Pagination
- CTA "+ Nouvelle commande"
- Référence visuelle : `visual-reference/orders-list.png`

### Détail commande
- Breadcrumb, titre + badge statut
- Colonne client + paiement
- Colonne articles + totaux (TTC en accent)
- Colonne actions (statut, ticket, rayon, contact, annuler)
- Carte emplacement rayon
- Timeline horizontale des étapes
- Référence visuelle : `visual-reference/order-detail.png`

---

## US — Réception Fast-Scan

### US-01 Layout 3 colonnes
1. **Gauche:** Omnibox → client → toggle Express → Valider / Annuler
2. **Centre:** Grille articles (zone la plus large)
3. **Droite:** Panier dynamique

### US-02 Omnibox
- Placeholder: "Rechercher par nom, téléphone, code client..."
- Dropdown temps réel + option création client

### US-03 à US-09
- Création client rapide (modale minimale)
- Grille articles cliquables avec badges quantité
- Panier temps réel, express recalcule prix + SLA
- Validation → confirmation → impression → toast → reset

---

## UR — Rangement

### UR-01 à UR-06
- Liste commandes à ranger + scan QR
- Modale plein écran sélection rayon (vert = libre, gris = occupé)
- Confirmation + toast + mise à jour grille temps réel
- Tooltip sur slots occupés

---

## Badges statut (dark theme)

| Statut | Style |
|--------|-------|
| CREATED | `bg-slate-500/10 text-slate-400` |
| IN_PROGRESS / EN COURS | `bg-blue-500/10 text-blue-400` |
| READY / PRÊT | `bg-emerald-500/10 text-emerald-400` |
| DELAYED / EN ATTENTE | `bg-amber-500/10 text-amber-400` |
| CANCELLED | `bg-slate-500/10 text-slate-500` |
| LOST | `bg-red-500/10 text-red-400` |
| EXPRESS | `bg-accent/20 text-accent` + ⚡ |

---

## Sémantique couleurs produit (inchangée)

| Concept | Couleur |
|---------|---------|
| Primaire marque | #1A5AD7 (light) / #3B82F6 (dark) |
| Express | #FF6B00 |
| Succès / libre | #10B981 |
| Occupé | #6B7280 |
| Avertissement | #F59E0B |
| Erreur | #EF4444 |

---

## Responsive

| Breakpoint | Adaptation |
|------------|------------|
| < 640px | Sidebar drawer ; table → cards ; Fast-Scan colonne unique |
| 640–1024px | 2 colonnes max |
| > 1024px | Layout complet, sidebar fixe 240px |

Zones tactiles ≥ 44px. Padding mobile 16px, desktop 24–32px.

---

## Ticket thermique 80mm

| Section | Contenu |
|---------|---------|
| Header | Logo agence, coordonnées |
| Corps | QR code géant, N° commande, articles |
| Footer | "Prêt le [date/heure]" |

Spec : `docs/ui-ux-branding/14-thermal-ticket-design-spec.md`

---
name: cleantrack-agency-ui
description: >-
  Builds and reviews CleanTrack Pro agency interfaces (dashboard, orders, Fast-Scan,
  storage shelves) with a modern premium dark SaaS look (Linear/Vercel style). Use when
  creating or modifying agency UI, admin site screens, reception workflows, rayon grids,
  KPI cards, omnibox, express mode, or when the user mentions interface agence, design
  premium, or CleanTrack branding.
---

# CleanTrack Pro — Interfaces Agence (Premium Dark)

## Mission

Deliver agency interfaces that feel **modern, premium, and operationally fast** — dark-first, data-dense but breathable, inspired by Linear / Vercel / Stripe dashboards.

**Functional specs (what to build):**
- `docs/planning-artifacts/ui-ux-spec.md` — vision produit
- Parcours détaillés : `docs/ui-ux-branding/06-*.md` à `09-*.md`

**Visual reference (how it should look):**
- Read [visual-style.md](visual-style.md) before implementing any screen
- Compare against images in `visual-reference/`:
  - `dashboard-agency.png` — dashboard KPI + activité + tâches
  - `orders-list.png` — liste commandes + filtres chips + table
  - `order-detail.png` — détail commande 3 colonnes + timeline

Do **not** use `docs/ui-ux-branding/mockups/` as visual reference — outdated style.

Screen-by-screen functional specs: [reference.md](reference.md).

---

## Design Philosophy

| Principle | Application |
|-----------|-------------|
| **Dark-first premium** | Fond profond navy, cartes en relief subtil, texte haute lisibilité |
| **Minimalisme fonctionnel** | Chaque élément sert l'opération ; pas de décor superflu |
| **Data-dense mais aéré** | Grille 8px, padding généreux (24–32px), hiérarchie typographique nette |
| **Micro-interactions** | Transitions 150–200ms, hover row/card, focus rings, skeleton loaders |
| **Vitesse opérationnelle** | Réception et rangement : minimum de clics, feedback immédiat, zones tactiles ≥ 44px |

---

## Visual Tokens (Dark Theme)

Map to `frontend/src/app/globals.css` `.dark` variables and Tailwind semantic classes.

| Token | Value / class | Usage |
|-------|---------------|-------|
| App background | `bg-background` / `#0B1120`–`#0F172A` | Page canvas |
| Card surface | `bg-card` / `#1E293B` | KPI, table container, panels |
| Primary | `primary` / `#3B82F6` | Active nav pill, primary buttons, links (order ID) |
| Primary hover | `#2563EB` | Button hover |
| Text primary | `text-foreground` / white | Titres, valeurs KPI |
| Text muted | `text-muted-foreground` / slate-400 | Labels, headers table, breadcrumbs |
| Border | `border-border` / `#334155` | Cards, inputs — 1px subtle |
| Success | `text-emerald-400` + `bg-emerald-500/10` | Prêt, payé, tendance positive |
| Warning | `text-amber-400` + `bg-amber-500/10` | En attente, retard, urgent |
| Info / En cours | `text-blue-400` + `bg-blue-500/10` | Statut processing |
| Express | `accent` / `#FF6B00` | Mode express, ⚡ |
| Destructive | `text-red-400` + `border-red-500/50` | Annuler commande |

**Typography:** Inter. H1 page `text-2xl font-bold`, section `text-lg font-semibold`, table headers `text-xs uppercase tracking-wide text-muted-foreground`, KPI value `text-3xl font-bold`.

**Radius:** cards/tables `rounded-xl` (12–16px), buttons `rounded-lg`, badges `rounded-full`.

**Icons:** Lucide React, stroke 1.5–2px, 20–24px.

**Depth:** prefer `border border-border` over heavy shadows. Hover: `hover:bg-muted/50` on rows, slight elevation on KPI cards.

**Role & ID labels (UI only):** never show `Admin_Site` / `Admin_Tenant`, « admin site » / « admin tenant », or raw/truncated UUIDs as the only label for operators, agencies, orders, or clients. Use **Manager d'agence** / **Manager général**, names, and order `reference`. See `.cursor/rules/ui-display-conventions.mdc`, `getRoleDisplayLabel()`, `formatOperatorLabel` / `formatSiteLabel` / `formatOrderLabel`.

---

## Layout Shell

```
┌──────────┬────────────────────────────────────────────────────┐
│ Sidebar  │  [Omnibox search — centered or full-width]  [CTA] │
│ 240px    ├────────────────────────────────────────────────────┤
│ Logo     │  Page title + subtitle / breadcrumbs               │
│ Nav pill │  [Filter chips]              [Date] [Filters]      │
│ items    │  ┌──────────────────────────────────────────────┐  │
│          │  │  Main content (cards, table, grid)           │  │
│ Profile  │  └──────────────────────────────────────────────┘  │
│ Logout   │  [Optional right panel — tasks, actions]           │
└──────────┴────────────────────────────────────────────────────┘
```

- **Sidebar:** dark, nav item actif = pill bleu pleine largeur (`bg-primary rounded-lg`)
- **Top bar:** omnibox sombre arrondi, cloche, avatar + nom + rôle
- **Page header:** titre bold + badge LIVE ou statut pill à côté

Reuse: `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/app/(dashboard)/layout.tsx`

---

## Screen Patterns (match visual-reference)

### 1. Dashboard (dashboard-agency.png)

```
[Title + LIVE badge]     [Search]     [Avatar]
[KPI] [KPI] [KPI] [KPI]   ← trend % green, delayed card orange border
[Activité horaire chart]  |  [À faire aujourd'hui panel]
[Dernières commandes table with pill badges]
```

- KPI cards: icon top-right, grande valeur, trend `+12%` en pill emerald
- Carte retard: `border-amber-500/50` + label "Action Required"
- Taux occupation: progress bar fine bleue
- Panel tâches: cartes avec checkbox, badge URGENT rouge, tâche complétée barrée

### 2. Liste commandes (orders-list.png)

- Omnibox centré en header : `Rechercher une commande...`
- Bouton primaire `+ New Order` / `+ Nouvelle commande` à droite
- **Filter chips** avec compteurs : `Toutes (248)` actif = pill bleu, inactif = fond sombre
- Table dans container `rounded-xl bg-card border`:
  - Headers uppercase muted
  - Order ID en `text-primary` cliquable
  - Client : avatar initiales coloré + nom
  - Status : pill badge fond opacity (voir visual-style.md)
- Pagination : `Showing 1-15 of 248`, numéros circulaires, page active = cercle bleu

### 3. Détail commande (order-detail.png)

**3 colonnes + timeline pleine largeur en bas:**

| Gauche | Centre | Droite |
|--------|--------|--------|
| Infos client (tel, adresse, badge fidélité) | Table articles + totaux | Stack actions verticales |
| Détails paiement (badge PAYÉ vert) | Sous-total, TVA, Total TTC bleu | Emplacement rayon |

- Header : breadcrumb muted, titre `#ORD-XXXX` + pill statut amber/blue
- Actions : `Valider l'étape` primary, `Modifier` ghost, `Annuler` outline rouge en bas
- Timeline horizontale : étapes complétées bleu + check, futures grisées, temps écoulé top-right

### 4. Fast-Scan Réception (US-01) — même langage visuel

Appliquer le dark theme aux 3 colonnes existantes :

| Col 1 | Col 2 | Col 3 |
|-------|-------|-------|
| Omnibox proéminent (`bg-card border`) | Grille articles icônes | Panier `OrderDraftSummary` |
| Client sélectionné | Filtres chips catégorie | Totaux temps réel |
| Toggle Express ⚡ | Badges quantité sur cartes | |
| Valider / Annuler | | |

Express actif : teinte `bg-accent/10`, toggle orange, badge ⚡ sur total.

### 5. Rayons (AS-05 / UR-02)

| State | Dark style |
|-------|------------|
| Libre | `bg-emerald-500/15 border-emerald-500 text-emerald-400` |
| Occupé | `bg-muted border-border text-muted-foreground` |
| Sélectionné | `ring-2 ring-primary bg-primary/20` |

### 6. Ticket thermique (80mm)

Hors écran web — spec : `docs/ui-ux-branding/14-thermal-ticket-design-spec.md`

---

## Reuse Components First

| Need | Component |
|------|-----------|
| Actions | `frontend/src/components/ui/Button.tsx` |
| Containers | `frontend/src/components/ui/Card.tsx` |
| Forms | `Input.tsx`, `Switch.tsx` |
| Status | `Badge.tsx` |
| Modals | `modal.tsx`, `ConfirmationModal.tsx` |
| Feedback | `simple-toast.tsx` |
| KPI | `dashboard/KPICard.tsx` |
| Omnibox | `clients/ClientOmnibox.tsx` |
| Articles / panier | `orders/ArticleGrid.tsx`, `OrderDraftSummary.tsx` |
| Express | `catalogue/ExpressMode.tsx` |
| Rayons | `storage/StorageSlotList.tsx` |

Extend dark variants in existing components — do not duplicate inline styles.

---

## Quality Checklist

```
Agency UI Quality:
- [ ] Dark theme: bg-background canvas, bg-card surfaces, border-border
- [ ] Active nav = blue pill; primary actions = bg-primary rounded-lg
- [ ] Status badges = pill, text + bg/10 opacity (not solid blocks)
- [ ] Tables: rounded-xl container, uppercase muted headers, hover rows
- [ ] Filter chips with counts; active chip = primary fill
- [ ] Omnibox prominent in header on list/search screens
- [ ] KPI: large value, trend pill, semantic border on alerts
- [ ] Inter font, 8px grid, rounded-xl cards
- [ ] Hover/focus/disabled on all interactives; skeleton loaders
- [ ] Express mode distinct (orange + ⚡)
- [ ] Shelf grid: emerald free / muted occupied
- [ ] Matches visual-reference/*.png patterns
- [ ] French copy for operator-facing labels
```

---

## Anti-Patterns

- Light-theme white cards on agency admin screens (breaks premium dark look)
- Legacy mockup style from `docs/ui-ux-branding/mockups/`
- Zebra table stripes — use uniform bg + hover instead
- Solid saturated badge backgrounds — use text + `bg-{color}/10`
- Random `blue-500` instead of semantic `primary`
- Dense UI without padding — premium = generous whitespace
- `alert()` instead of toast notifications

---

## Workflow

1. **Identify screen** — AS/US/UR/UT code in reference.md
2. **Read visual-style.md** + open matching PNG in `visual-reference/`
3. **Audit existing** — grep `frontend/src` for related components
4. **Implement** — dark tokens, extend components, match layout pattern
5. **Self-review** — checklist above; compare with visual reference

---

## Additional Resources

- [visual-style.md](visual-style.md) — composants détaillés extraits des références
- [reference.md](reference.md) — specs fonctionnelles par écran

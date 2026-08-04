# Style Visuel Premium Dark — Référence d'implémentation

Extrait des références validées dans `visual-reference/`. **Ne pas** s'inspirer de `docs/ui-ux-branding/mockups/`.

---

## Palette

| Rôle | HEX | Tailwind |
|------|-----|----------|
| Canvas | `#0B1120` | `bg-[#0B1120]` or `bg-background` (dark) |
| Surface card | `#1E293B` | `bg-card` |
| Border | `#334155` | `border-border` |
| Primary | `#3B82F6` | `bg-primary`, `text-primary` |
| Primary hover | `#2563EB` | `hover:bg-blue-600` |
| Text | `#F8FAFC` | `text-foreground` |
| Muted text | `#94A3B8` | `text-muted-foreground` |
| Success | `#34D399` | `text-emerald-400` |
| Warning | `#FBBF24` | `text-amber-400` |
| Error | `#F87171` | `text-red-400` |
| Express | `#FF6B00` | `bg-accent` |

Brand blue `#1A5AD7` remains valid for light mode; **agency admin defaults to dark** with `#3B82F6` primary per `globals.css` `.dark`.

---

## Sidebar

```
Width: 240px
Background: same as canvas or slightly darker
Logo: icon + "CleanTrack Pro" + subtitle "ADMIN SITE" / "AGENCY ADMIN"
Nav item default: text-muted-foreground, px-4 py-3, rounded-lg
Nav item hover: bg-muted/50
Nav item active: bg-primary text-white rounded-lg (full-width pill)
Bottom: Settings, user card (avatar circle + name + role), Déconnexion
Icons: Lucide, 20px, left of label
```

---

## Top Header

```
Height: ~64px
Search (omnibox): flex-1 max-w-xl, bg-card border border-border rounded-xl
  placeholder muted, search icon left
Right cluster: Bell, HelpCircle, Avatar + name + role
Primary CTA: bg-primary rounded-lg px-4 py-2 "+ Nouvelle commande"
```

---

## KPI Card

```tsx
// Structure
<Card className="bg-card border-border rounded-xl p-6">
  <div className="flex justify-between">
    <span className="text-sm text-muted-foreground">Commandes du Jour</span>
    <Icon className="text-primary h-5 w-5" />
  </div>
  <p className="text-3xl font-bold mt-2">42</p>
  <span className="inline-flex mt-2 px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
    +12% vs hier
  </span>
</Card>
```

**Alert KPI** (retards): add `border border-amber-500/50`, warning sublabel amber.

**Progress KPI** (occupation): thin bar `h-1.5 bg-muted rounded-full`, fill `bg-primary`.

---

## Filter Chips

```tsx
// Active
<button className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium">
  Toutes les commandes (248)
</button>
// Inactive
<button className="px-4 py-2 rounded-full bg-card border border-border text-muted-foreground text-sm">
  En cours (12)
</button>
```

---

## Status Pills (Dark)

| Statut | Classes |
|--------|---------|
| EN ATTENTE | `bg-amber-500/10 text-amber-400` |
| EN COURS | `bg-blue-500/10 text-blue-400` |
| PRÊT | `bg-emerald-500/10 text-emerald-400` |
| RETARD | `bg-amber-500/10 text-amber-400` |
| PAYÉ | `bg-emerald-500/10 text-emerald-400` |
| URGENT | `bg-red-500/10 text-red-400` |
| EXPRESS | `bg-accent/20 text-accent` + Zap icon |

Base: `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`

---

## Data Table

```tsx
<div className="rounded-xl border border-border bg-card overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-border">
        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          ID
        </th>
        {/* ... */}
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
        <td className="px-4 py-4 text-primary font-medium">#ORD-7721</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center text-xs font-bold">JD</div>
            <span>Jean Dupont</span>
          </div>
        </td>
        {/* status pill, price */}
      </tr>
    </tbody>
  </table>
</div>
```

No zebra stripes. Row hover only.

---

## Pagination

```
Left: "Showing 1-15 of 248 orders" — text-sm text-muted-foreground
Right: circular page buttons h-8 w-8 rounded-full
  inactive: text-muted-foreground hover:bg-muted
  active: bg-primary text-white
```

---

## Order Detail — Action Stack

```tsx
<div className="space-y-2">
  <Button className="w-full">Modifier le statut</Button>
  <Button variant="secondary" className="w-full">Imprimer le ticket</Button>
  <Button variant="secondary" className="w-full">Assigner à un rayon</Button>
  <Button variant="secondary" className="w-full">Contacter le client</Button>
  <Button variant="destructive" className="w-full mt-4">Annuler la commande</Button>
</div>
```

---

## Timeline (horizontal)

```
Completed step: blue circle + check icon, solid blue connector line
Current step: blue circle + step icon (washing machine etc.)
Future step: muted circle + muted icon, dashed or gray connector
Each node: label below + timestamp or "Attente"
Top-right of card: "Temps écoulé: 3h 15min" muted
```

---

## Task Panel (À faire aujourd'hui)

```
Card per task: bg-card border-border rounded-xl p-4
Checkbox left, title, optional badge (URGENT red, STOCK gray)
Completed: line-through text-muted-foreground, blue check
Footer: ghost button "+ Nouvelle tâche"
Urgent task card: border-red-500/30
```

---

## To-Do Panel vs Chart Layout (Dashboard)

```
Grid on xl:
  col-span-2: KPI row (4 cards)
  col-span-2: Activity chart
  col-span-1: Task panel (sticky optional)
  col-span-2: Recent orders table
```

Gap: `gap-6`. Page padding: `p-6` or `p-8`.

---

## Micro-interactions

| Element | Transition |
|---------|------------|
| Buttons | `transition-all duration-150` color + shadow |
| Table rows | `transition-colors duration-100` |
| Cards (clickable) | hover `shadow-md` or `border-primary/30` |
| Nav items | `transition-colors duration-150` |
| Modals | `backdrop-blur-sm bg-black/60`, enter fade + scale |

---

## Références visuelles

| Fichier | Écran |
|---------|-------|
| `visual-reference/dashboard-agency.png` | Dashboard admin site |
| `visual-reference/orders-list.png` | Liste commandes agence |
| `visual-reference/order-detail.png` | Détail commande |

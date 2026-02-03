# Admin Tenant - Catalogue & Pricing UI Implementation

## Context
Implementation of the Catalogue Management module, including Article Types, Services, Pricing Matrix, and Express Mode configuration. This UI replaces the generic implementations and aligns with the specific "CleanTrack Pro" design language.

## Implemented Components

### 1. Catalogue Page (`src/app/(dashboard)/catalogue/page.tsx`)
- **Tabbed Interface**: Navigation between "Types d'Articles", "Services", "Grille Tarifaire", and "Mode Express".
- **State Management**: Lifted state for pricing data to handle unsaved changes across tabs.
- **Conditional Rendering**: tailored views filters and actions for each tab (e.g., hiding global filters for Pricing/Express).
- **Navigation Guard**: `ConfirmationModal` integration to prevent data loss when switching tabs with unsaved changes.

### 2. Pricing Matrix (`src/components/catalogue/PricingMatrix.tsx`)
- **Grid Layout**: Matrix view of Articles vs Services for rapid price entry.
- **Micro-interactions**: Hover effects for row/column highlighting.
- **Toolbar**: Custom toolbar with "Dernière mise à jour" indicator.
- **Actions**: "Enregistrer" button appearing only when `isDirty` is true.

### 3. Express Mode (`src/components/catalogue/ExpressMode.tsx`)
- **Card Layout**: Dedicated configuration card with visual "Switch" toggle.
- **Visual Inputs**:
    - Large multiplier input with "x" prefix.
    - Large delivery time input with "heures" suffix.
- **Visibility Options**: Checkbox group for catalogue visibility settings.
- **Stats Hiding**: Logic to hide global KPI stats when this tab is active.

### 4. Reusable UI Components
- **ConfirmationModal** (`src/components/ui/ConfirmationModal.tsx`): Generic modal (Warning/Danger/Info variants) replcing `window.confirm`.
- **Switch** (`src/components/ui/Switch.tsx`): Clean CSS-only toggle switch.
- **Success/Failure Modals**: Leveraged existing modal patterns for consistency.

## Mock Data & API Integration
- **Mock Data**: Currently using `MOCK_PRICING` and `MOCK_SERVICES` for UI development.
- **Save Hooks**: `onSave` callbacks implemented in parent page, logging to console (ready for service integration).

## Next Steps
- Connect `handleSavePricing` and `ExpressMode.onSave` to real backend endpoints.
- Implement "History/Audit Log" for pricing changes.
- Add "Batch Update" functionality for the Pricing Matrix.

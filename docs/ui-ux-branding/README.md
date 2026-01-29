# Documentation UI/UX & Branding - CleanTrack Pro

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce dossier contient l'ensemble des spécifications visuelles et de design pour la plateforme CleanTrack Pro, une solution SaaS multi-tenant de gestion professionnelle de pressings. Ces documents servent de référence complète pour l'implémentation des interfaces web et mobiles, garantissant une cohérence visuelle et une expérience utilisateur exceptionnelle.

---

## Structure de la Documentation

### 📋 Documents de Base

| Document | Description | Statut |
|----------|-------------|--------|
| **01-user-journeys-map.md** | Cartographie complète de tous les parcours utilisateurs avec identification et numérotation de chaque écran | ✅ Complet |
| **02-design-system-branding.md** | Définition du design system : palette de couleurs, typographie, composants UI, principes de design | ✅ Complet |

---

### 🎨 Spécifications Visuelles par Parcours

#### Parcours Transversaux

| Document | Parcours | Écrans Couverts | Plateforme |
|----------|----------|-----------------|------------|
| **03-spec-visual-journey-01-auth.md** | Authentification | AUTH-01 à AUTH-05 | Web + Mobile |

#### Parcours Web (Back-office)

| Document | Rôle | Écrans Couverts | Description |
|----------|------|-----------------|-------------|
| **04-spec-visual-journey-02-superadmin.md** | Superadmin | SA-01 à SA-06 | Gestion de la plateforme SaaS et des tenants |
| **05-spec-visual-journey-03-admintenant.md** | Admin_Tenant | AT-01 à AT-12 | Configuration du réseau d'agences, catalogue et tarifs |
| **06-spec-visual-journey-04-adminsite.md** | Admin_Site | AS-01 à AS-07 | Gestion opérationnelle d'une agence spécifique |
| **07-spec-visual-journey-05-usersite-reception.md** | User_Site | US-01 à US-09 | Interface "Fast-Scan" de réception de commandes |
| **08-spec-visual-journey-06-usersite-processing.md** | User_Site | UT-01 à UT-07 | Suivi et traitement des commandes |
| **09-spec-visual-journey-07-usersite-storage.md** | User_Site | UR-01 à UR-06 | Rangement et stockage des commandes prêtes |
| **10-spec-visual-journey-08-usersite-delivery.md** | User_Site | UL-01 à UL-06 | Livraison et retrait client |
| **13-spec-visual-journey-10-reports-analytics.md** | Admin_Tenant | RA-01 à RA-07 | Rapports et analytics |

#### Parcours Mobile (Application Client)

| Document | Rôle | Écrans Couverts | Description |
|----------|------|-----------------|-------------|
| **11-spec-visual-journey-09-client-mobile.md** | Client | CL-01 à CL-11 | Application mobile pour le suivi de commandes et identification |

---

### 🔧 Spécifications Techniques

| Document | Description | Statut |
|----------|-------------|--------|
| **12-keycloak-custom-theme-spec.md** | Spécifications complètes pour la personnalisation du thème Keycloak (connexion, mot de passe oublié, etc.) | ✅ Complet |
| **14-thermal-ticket-design-spec.md** | Design détaillé du ticket thermique 80mm avec QR code géant | ✅ Complet |

---

## Synthèse des Écrans

### Récapitulatif par Plateforme

| Plateforme | Nombre d'Écrans | Parcours Couverts |
|------------|-----------------|-------------------|
| **Web** | 65 écrans uniques | 10 parcours (Authentification, Superadmin, Admin_Tenant, Admin_Site, User_Site × 4, Rapports) |
| **Mobile** | 16 écrans uniques | 2 parcours (Authentification, Client) |
| **Total** | 81 écrans | 12 parcours utilisateurs |

### Répartition par Rôle

| Rôle | Nombre d'Écrans | Parcours |
|------|-----------------|----------|
| **Superadmin** | 6 écrans | Gestion de la plateforme |
| **Admin_Tenant** | 19 écrans | Configuration + Rapports |
| **Admin_Site** | 7 écrans | Gestion d'agence |
| **User_Site** | 28 écrans | Réception + Traitement + Rangement + Livraison |
| **Client** | 11 écrans | Application mobile |
| **Authentification** | 5 écrans | Commun à tous |

---

## Principes de Design

### Identité Visuelle

- **Couleur Primaire :** Bleu Confiance (#1A5AD7) - Professionnalisme et fiabilité
- **Couleur Accent :** Orange Vif (#FF6B00) - Mode Express et urgence
- **Typographie :** Inter (Google Fonts) - Moderne, claire et lisible
- **Style :** Material Design moderne avec bordures arrondies (8-12px) et ombres subtiles

### Principes UX

1. **Rapidité :** Interface "Fast-Scan" optimisée pour la vitesse de saisie
2. **Clarté :** Hiérarchie visuelle claire avec des couleurs sémantiques pour les statuts
3. **Cohérence :** Design system unifié sur toutes les plateformes
4. **Accessibilité :** Contraste élevé, tailles de police lisibles, interactions tactiles optimisées

---

## Guide d'Utilisation

### Pour les Développeurs

1. Commencer par lire le **Design System** (02-design-system-branding.md) pour comprendre les fondations
2. Consulter le **User Journeys Map** (01-user-journeys-map.md) pour identifier les écrans à implémenter
3. Référencer les spécifications visuelles détaillées pour chaque parcours lors de l'implémentation
4. Utiliser le thème Keycloak personnalisé (12-keycloak-custom-theme-spec.md) pour l'authentification
5. Implémenter le système d'impression thermique selon les spécifications (14-thermal-ticket-design-spec.md)

### Pour les Designers

1. Les spécifications visuelles servent de base pour créer les maquettes haute-fidélité
2. Tous les composants doivent respecter le design system défini
3. Les maquettes doivent couvrir les états (normal, hover, focus, disabled) de chaque élément interactif
4. Prévoir les versions responsive pour mobile et tablette

### Pour les Product Managers

1. Le User Journeys Map fournit une vue d'ensemble complète des fonctionnalités
2. Chaque écran est numéroté et peut être référencé dans les tickets/stories
3. Les spécifications peuvent être utilisées pour valider les implémentations

---

## Prochaines Étapes

### Phase 1 : Maquettes Haute-Fidélité
- [ ] Créer les maquettes Figma/Sketch pour tous les écrans web
- [ ] Créer les maquettes mobile pour l'application client
- [ ] Valider les maquettes avec les parties prenantes

### Phase 2 : Prototypes Interactifs
- [ ] Créer des prototypes cliquables pour les flux principaux
- [ ] Tester les prototypes avec des utilisateurs réels
- [ ] Itérer sur les retours utilisateurs

### Phase 3 : Implémentation
- [ ] Développer les composants du design system
- [ ] Implémenter les interfaces web
- [ ] Développer l'application mobile
- [ ] Personnaliser le thème Keycloak
- [ ] Intégrer le système d'impression thermique

### Phase 4 : Tests et Validation
- [ ] Tests d'utilisabilité
- [ ] Tests d'accessibilité
- [ ] Tests de performance
- [ ] Validation finale

---

## Ressources Externes

### Bibliothèques et Outils

- **Typographie :** [Inter Font - Google Fonts](https://fonts.google.com/specimen/Inter)
- **Icônes :** [Heroicons](https://heroicons.com/) (Outline)
- **Graphiques :** [Chart.js](https://www.chartjs.org/)
- **Composants React :** Tailwind CSS + Headless UI
- **Mobile :** React Native + Expo

### Références Design

- Material Design Guidelines
- Apple Human Interface Guidelines
- Nielsen Norman Group - UX Best Practices

---

## Contact et Support

Pour toute question concernant ces spécifications visuelles :

**Francis AHONSU**  
*Directeur Artistique & UI/UX Designer*  
*CleanTrack Pro*

---

## Historique des Versions

| Version | Date | Auteur | Description |
|---------|------|--------|-------------|
| 1.0 | 29 janvier 2026 | Francis AHONSU | Création initiale de toute la documentation UI/UX |

---

**Tous les travaux sont signés par Francis AHONSU**  
*Documentation complète créée le 29 janvier 2026*

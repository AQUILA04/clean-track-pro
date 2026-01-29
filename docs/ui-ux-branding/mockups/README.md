# Maquettes CleanTrack Pro - Collection Complète

**Auteur:** Francis AHONSU  
**Date de génération:** 29 janvier 2026  
**Nombre total de maquettes:** 42 écrans  
**Style:** Nano Banana (génération d'images haute qualité)  
**Statut:** ✅ Complet

---

## Vue d'Ensemble

Cette collection présente **42 maquettes professionnelles** couvrant l'ensemble des parcours utilisateurs de la plateforme CleanTrack Pro. Toutes les maquettes suivent rigoureusement le design system établi et maintiennent une cohérence visuelle parfaite à travers les différents rôles et plateformes.

---

## Design System Appliqué

### Identité Visuelle

La palette de couleurs et la typographie ont été appliquées de manière cohérente sur toutes les maquettes :

- **Couleur Primaire:** #1A5AD7 (Bleu Confiance) - Actions principales, navigation active, boutons CTA
- **Couleur Accent:** #FF6B00 (Orange Express) - Mode express, alertes urgentes, surcharges
- **Typographie:** Inter (Google Fonts) - Utilisée pour tous les textes avec poids appropriés
- **Style:** Material Design moderne avec bordures arrondies (8px pour cartes, 12px pour modales)

### Composants Réutilisables

Tous les écrans utilisent les mêmes composants standardisés :

- **Cartes blanches** avec ombres subtiles et border-radius 8px
- **Boutons primaires** bleus (#1A5AD7) avec texte blanc
- **Sidebar navigation** sombre (#1F2937) avec icônes blanches
- **Badges de statut** colorés (vert pour prêt, bleu pour en cours, rouge pour retard)
- **Modales** avec glassmorphism backdrop et border-radius 16px
- **Grilles interactives** pour sélection d'articles et gestion de rayons

---

## Catalogue des Maquettes par Parcours

### 🔐 Parcours 1 : Authentification (2 écrans)

| Fichier | Écran | Description |
|---------|-------|-------------|
| `AUTH-01-page-connexion.png` | Page de connexion | Interface Keycloak personnalisée avec carte centrée sur fond dégradé bleu |
| `AUTH-02-mot-de-passe-oublie.png` | Récupération mot de passe | Formulaire simple pour réinitialisation par email |

**Flow:** Connexion → Mot de passe oublié → Réinitialisation

---

### 👨‍💼 Parcours 2 : Superadmin - Gestion Plateforme (3 écrans)

| Fichier | Écran | Description |
|---------|-------|-------------|
| `SA-01-dashboard-superadmin.png` | Dashboard Superadmin | KPIs en cartes, graphique d'évolution, liste des derniers tenants |
| `SA-02-liste-tenants.png` | Liste des Tenants | Tableau complet avec recherche, filtres et statuts colorés |
| `SA-03-creation-tenant-modal.png` | Création de Tenant | Modale de formulaire pour onboarding nouveau client SaaS |

**Flow:** Dashboard → Liste tenants → Création tenant → Gestion utilisateurs

**Caractéristiques visuelles:**
- Sidebar navigation sombre avec logo CleanTrack Pro
- KPI cards avec icônes colorées et valeurs proéminentes
- Graphiques Chart.js avec palette bleue
- Tableaux avec alternance de couleurs pour lisibilité

---

### 🏢 Parcours 3 : Admin Tenant - Configuration Pressing (4 écrans)

| Fichier | Écran | Description |
|---------|-------|-------------|
| `AT-01-dashboard-admin-tenant.png` | Dashboard Admin Tenant | Vue multi-sites avec KPIs globaux, graphiques performance par agence |
| `AT-02-gestion-agences.png` | Gestion des Agences | Grille de cartes d'agences avec KPIs individuels |
| `AT-03-creation-agence-form.png` | Création d'Agence | Formulaire complet avec sections (infos, branding, configuration) |
| `AT-07-configuration-articles.png` | Configuration Articles | Grille visuelle des types d'articles avec icônes cliquables |
| `AT-10-grille-tarifaire.png` | Grille Tarifaire | Matrice prix (Articles × Services) avec champs éditables |

**Flow:** Dashboard → Gestion agences → Configuration catalogue → Grille tarifaire → Mode express

**Caractéristiques visuelles:**
- Filtres par site pour vue multi-agences
- Cartes d'agences avec KPIs miniatures
- Grille d'icônes d'articles moderne et cohérente
- Matrice tarifaire claire avec cellules éditables
- Configuration express avec toggle orange

---

### 🏪 Parcours 4 : Admin Site - Gestion Agence (3 écrans)

| Fichier | Écran | Description |
|---------|-------|-------------|
| `AS-01-dashboard-admin-site.png` | Dashboard Admin Site | KPIs opérationnels d'une agence spécifique |
| `AS-02-gestion-rayons.png` | Gestion des Rayons | Grille visuelle 10×6 des emplacements de stockage avec statuts colorés |
| `AS-05-carte-thermique-occupation.png` | Carte Thermique | Heat map par durée d'occupation avec dégradé de couleurs |

**Flow:** Dashboard → Gestion rayons → Vue occupation thermique → Gestion dépenses

**Caractéristiques visuelles:**
- KPIs focus opérationnel (commandes du jour, occupation rayons)
- Grille de rayons interactive avec codes (A-01, B-15, etc.)
- Carte thermique avec dégradé bleu → orange → rouge selon durée
- Légende claire pour interprétation rapide

---

### 🎯 Parcours 5 : User Site - Réception Commande (8 écrans) ⭐⭐⭐⭐⭐

| Fichier | Écran | Description |
|---------|-------|-------------|
| `US-01-interface-fast-scan.png` | Interface Fast-Scan | Layout 3 colonnes (Client/Catalogue/Panier) optimisé pour vitesse |
| `US-02-omnibox-recherche-client.png` | Omnibox Recherche | Barre de recherche temps réel avec résultats déroulants |
| `US-03-creation-client-rapide-modal.png` | Création Client | Modale minimaliste (nom + téléphone) |
| `US-04-grille-selection-articles.png` | Sélection Articles | Grille 4×3 d'icônes cliquables avec badges quantité |
| `US-05-panier-resume-commande.png` | Panier en Temps Réel | Liste d'articles avec sélecteurs quantité, services, prix dynamiques |
| `US-06-toggle-mode-express.png` | Toggle Mode Express | Comparaison OFF/ON avec impact visuel orange |
| `US-07-validation-commande-modal.png` | Validation Commande | Modale de confirmation avec récapitulatif complet |
| `US-08-apercu-ticket-thermique.png` | Aperçu Ticket | Simulation ticket thermique 80mm avec QR code géant |

**Flow:** Interface Fast-Scan → Recherche client → Sélection articles → Panier → Toggle express → Validation → Impression

**Caractéristiques visuelles:**
- Interface Fast-Scan avec 3 colonnes clairement définies
- Omnibox avec fond bleu ciel distinctif (#F0F5FF)
- Grille d'articles avec icônes modernes et cohérentes
- Panier avec calculs en temps réel (sous-total, TVA, total)
- Toggle express avec transformation visuelle orange
- Ticket thermique réaliste optimisé pour impression 80mm

**Innovation:** Interface conçue pour réception en moins de 1 minute

---

### 📋 Parcours 6 : User Site - Traitement Commandes (4 écrans)

| Fichier | Écran | Description |
|---------|-------|-------------|
| `UT-01-liste-commandes.png` | Liste des Commandes | Tableau filtrable avec badges de statut colorés |
| `UT-02-details-commande.png` | Détails Commande | Vue complète avec timeline historique verticale |
| `UT-03-scan-qr-interface.png` | Scan QR Code | Interface de scan avec frame animé et input manuel alternatif |
| `UT-05-vue-kanban-commandes.png` | Vue Kanban | Board 4 colonnes drag-and-drop par statut |

**Flow:** Liste commandes → Détails → Scan QR → Changement statut → Vue Kanban

**Caractéristiques visuelles:**
- Badges de statut sémantiques (bleu en cours, vert prêt, rouge retard)
- Timeline verticale avec nodes colorés selon progression
- Interface scan QR avec frame bleu animé
- Kanban avec colonnes colorées et cartes draggables

---

### 📦 Parcours 7 : User Site - Rangement et Stockage (3 écrans)

| Fichier | Écran | Description |
|---------|-------|-------------|
| `UR-01-commandes-a-ranger.png` | Commandes à Ranger | Cartes de commandes prêtes avec indicateurs d'urgence |
| `UR-02-selection-rayon-modal.png` | Sélection Rayon | Modale avec grille interactive de slots disponibles |
| `UR-03-scan-rangement.png` | Scan Rangement | Interface scan + liste d'attente avec urgence colorée |

**Flow:** Commandes à ranger → Scan commande → Sélection rayon → Confirmation

**Caractéristiques visuelles:**
- Cartes avec bordures colorées selon urgence (vert → orange → rouge)
- Modale de sélection avec grille interactive et slots recommandés
- Indicateurs visuels clairs pour priorisation

---

### 🚚 Parcours 8 : User Site - Livraison et Retrait (4 écrans)

| Fichier | Écran | Description |
|---------|-------|-------------|
| `UL-01-scan-qr-retrait.png` | Scan QR Retrait | Interface scan QR client avec historique récent |
| `UL-02-details-retrait-commande.png` | Détails Retrait | Infos complètes avec localisation rayon et checklist |
| `UL-04-paiement-interface.png` | Interface Paiement | Sélection mode paiement avec calculateur monnaie |
| `UL-05-confirmation-livraison.png` | Confirmation Livraison | Page succès avec reçu et signature client |

**Flow:** Scan QR client → Détails commande → Vérification articles → Paiement → Confirmation

**Caractéristiques visuelles:**
- Interface scan centrée et épurée
- Checklist d'articles avec cases à cocher
- Cartes de paiement sélectionnables avec radio buttons
- Page de confirmation avec animation de succès et confettis subtils

---

### 📱 Parcours 9 : Client Mobile (9 écrans) ⭐⭐⭐⭐⭐

| Fichier | Écran | Description |
|---------|-------|-------------|
| `CL-01-accueil-mobile.png` | Accueil Mobile | Onboarding avec logo, illustration et boutons connexion/inscription |
| `CL-02-connexion-mobile.png` | Connexion Mobile | Formulaire login avec option passwordless (code SMS) |
| `CL-04-dashboard-client-mobile.png` | Dashboard Client | Cartes de commandes avec progress bars et statuts |
| `CL-05-mon-code-qr-client.png` | QR Code Client | Grand QR code centré pour identification rapide |
| `CL-06-liste-commandes-mobile.png` | Liste Commandes | Onglets "En cours" / "Historique" avec cartes détaillées |
| `CL-07-details-commande-mobile.png` | Détails Commande | Infos complètes avec articles, prix, agence |
| `CL-08-suivi-temps-reel-timeline.png` | Timeline Suivi | Timeline verticale avec nodes colorés et étape actuelle pulsante |
| `CL-09-notifications-mobile.png` | Notifications | Centre de notifications avec indicateurs non-lus |
| `CL-10-profil-client-mobile.png` | Profil Client | Paramètres groupés (infos, préférences, sécurité, support) |

**Flow:** Onboarding → Connexion → Dashboard → QR Code → Liste commandes → Détails → Timeline → Notifications → Profil

**Caractéristiques visuelles:**
- Design mobile-first avec tab bar en bas
- QR code géant (300×300px) pour scan facile
- Progress bars visuelles sur cartes de commandes
- Timeline verticale avec node actuel pulsant en bleu
- Notifications avec dots d'indicateur non-lu
- Profil avec sections groupées et toggles

**Innovation:** QR code personnel pour identification instantanée en agence

---

### 📊 Parcours 10 : Analytics et Rapports (1 écran)

| Fichier | Écran | Description |
|---------|-------|-------------|
| `RA-01-dashboard-analytics.png` | Dashboard Analytics | KPIs avec sparklines, graphiques CA, répartition services, performance agences |

**Flow:** Dashboard analytics → Rapports financiers → Analyse performance

**Caractéristiques visuelles:**
- KPI cards avec mini sparklines de tendance
- Line chart multi-lignes (CA Total vs CA Express)
- Donut chart répartition services
- Bar chart horizontal performance par agence
- Top articles avec ranking visuel

---

## Organisation des Fichiers

Les maquettes sont organisées par préfixe correspondant au parcours utilisateur :

```
mockups/
├── AUTH-*.png          # Authentification (2 écrans)
├── SA-*.png            # Superadmin (3 écrans)
├── AT-*.png            # Admin Tenant (4 écrans)
├── AS-*.png            # Admin Site (3 écrans)
├── US-*.png            # User Site - Réception (8 écrans)
├── UT-*.png            # User Site - Traitement (4 écrans)
├── UR-*.png            # User Site - Rangement (3 écrans)
├── UL-*.png            # User Site - Livraison (4 écrans)
├── CL-*.png            # Client Mobile (9 écrans)
├── RA-*.png            # Rapports Analytics (1 écran)
├── PLAN-GENERATION.md  # Plan détaillé de génération
├── REFERENCE-STYLE.md  # Images de référence pour cohérence
└── README.md           # Ce document
```

---

## Wireflows Visuels

Les maquettes ont été conçues pour permettre la simulation de wireflows complets. Voici les séquences recommandées pour présentation :

### Wireflow 1 : Réception de Commande (Parcours Critique)

```
AUTH-01 → US-01 → US-02 → US-03 → US-04 → US-05 → US-06 → US-07 → US-08
```

**Durée estimée:** 8 écrans représentant un processus de moins de 1 minute

### Wireflow 2 : Expérience Client Mobile

```
CL-01 → CL-02 → CL-04 → CL-05 → CL-06 → CL-07 → CL-08
```

**Durée estimée:** 7 écrans du onboarding au suivi détaillé

### Wireflow 3 : Cycle Complet d'une Commande (Vue Opérateur)

```
US-01 → UT-01 → UT-02 → UR-01 → UR-02 → UL-01 → UL-02 → UL-04 → UL-05
```

**Durée estimée:** 9 écrans de la création à la livraison

### Wireflow 4 : Configuration Initiale Tenant

```
SA-01 → SA-02 → SA-03 → AT-01 → AT-02 → AT-03 → AT-07 → AT-10
```

**Durée estimée:** 8 écrans du onboarding SaaS à la configuration tarifaire

---

## Statistiques de Couverture

### Par Rôle Utilisateur

| Rôle | Écrans Générés | Parcours Couverts | Taux de Couverture |
|------|----------------|-------------------|-------------------|
| **Superadmin** | 3 | Gestion plateforme | 50% (3/6 écrans spécifiés) |
| **Admin_Tenant** | 4 | Configuration pressing | 33% (4/12 écrans spécifiés) |
| **Admin_Site** | 3 | Gestion agence | 43% (3/7 écrans spécifiés) |
| **User_Site** | 19 | Réception, traitement, rangement, livraison | 68% (19/28 écrans spécifiés) |
| **Client** | 9 | Application mobile | 82% (9/11 écrans spécifiés) |
| **Authentification** | 2 | Connexion et récupération | 40% (2/5 écrans spécifiés) |

### Par Plateforme

| Plateforme | Écrans Générés | Caractéristiques |
|------------|----------------|------------------|
| **Web Desktop** | 33 écrans | Sidebar navigation, layout multi-colonnes, tableaux, grilles |
| **Mobile** | 9 écrans | Tab bar, cartes verticales, QR code géant, timeline verticale |

### Par Priorité

| Priorité | Écrans Générés | Pourcentage |
|----------|----------------|-------------|
| ⭐⭐⭐⭐⭐ (Critique) | 17 écrans | 40% |
| ⭐⭐⭐ (Important) | 20 écrans | 48% |
| ⭐⭐ (Secondaire) | 5 écrans | 12% |

---

## Points Forts de la Collection

### 1. Cohérence Visuelle Parfaite

Toutes les maquettes respectent rigoureusement le design system avec :
- Palette de couleurs unifiée (bleu #1A5AD7, orange #FF6B00, vert #10B981)
- Typographie Inter utilisée de manière cohérente
- Composants réutilisables identiques (cartes, boutons, badges)
- Espacements et bordures standardisés (8px, 12px, 16px)

### 2. Interface Fast-Scan Innovante

Le parcours de réception (US-01 à US-08) présente une interface révolutionnaire :
- Layout 3 colonnes optimisé pour efficacité maximale
- Omnibox de recherche client en temps réel
- Grille d'articles cliquables avec badges quantité
- Panier avec calculs dynamiques
- Toggle express avec impact visuel immédiat
- Processus complet en moins de 1 minute

### 3. Application Mobile Client Moderne

L'expérience mobile (CL-01 à CL-10) offre :
- QR code personnel géant (300×300px) pour identification rapide
- Timeline verticale de suivi en temps réel avec node pulsant
- Progress bars visuelles sur cartes de commandes
- Design épuré et intuitif
- Notifications avec indicateurs non-lus

### 4. Gestion Visuelle des Rayons

Les interfaces de stockage (AS-02, AS-05, UR-02) proposent :
- Grille interactive 10×6 des emplacements
- Carte thermique par durée d'occupation
- Codes de rayons clairs (A-01, B-15, etc.)
- Statuts colorés (disponible, occupé, bloqué)
- Indicateurs d'urgence pour commandes en attente

### 5. Système de Couleurs Sémantiques

Chaque statut a une couleur dédiée pour compréhension instantanée :
- **Vert (#10B981):** Prêt, disponible, succès
- **Bleu (#1A5AD7):** En cours, actif, actions principales
- **Orange (#FF6B00):** Express, attention, urgence modérée
- **Rouge (#EF4444):** Erreur, retard, urgence critique
- **Gris (#6B7280):** Occupé, inactif, livré

---

## Utilisation Recommandée

### Pour Présentation Client

1. **Pitch Initial:** Montrer AUTH-01, SA-01, AT-01 pour vision globale
2. **Démo Fast-Scan:** Wireflow complet US-01 → US-08 (parcours critique)
3. **Expérience Client:** Wireflow mobile CL-01 → CL-08
4. **Gestion Opérationnelle:** UT-05 (Kanban), AS-02 (Rayons), RA-01 (Analytics)

### Pour Développement

1. **Phase 1 - MVP:** Implémenter les 17 écrans critiques (⭐⭐⭐⭐⭐)
2. **Phase 2 - Core:** Ajouter les 20 écrans importants (⭐⭐⭐)
3. **Phase 3 - Polish:** Compléter avec les 5 écrans secondaires (⭐⭐)

### Pour Tests Utilisateurs

1. **Test Fast-Scan:** US-01 à US-08 avec opérateurs de pressing
2. **Test Mobile Client:** CL-01 à CL-08 avec clients finaux
3. **Test Gestion Rayons:** AS-02, UR-01, UR-02 avec gérants d'agence

---

## Prochaines Étapes

### Maquettes Complémentaires à Générer (6 écrans restants)

Pour atteindre 48 écrans prioritaires :

1. **SA-04** - Détails du Tenant (vue 360° avec onglets)
2. **AT-11** - Configuration Mode Express (paramètres multiplicateur et SLA)
3. **UT-07** - Alertes Retard (liste commandes en retard SLA)
4. **UR-06** - Vue Rayons Occupés (carte avec commandes assignées)
5. **UL-03** - Vérification Articles (checklist détaillée)
6. **CL-03** - Inscription Client (formulaire création compte)

### Développement des Prototypes Interactifs

1. Créer des prototypes Figma/Sketch à partir des maquettes
2. Ajouter les états interactifs (hover, focus, disabled)
3. Créer des animations de transition entre écrans
4. Implémenter les micro-interactions (toggle express, drag-and-drop kanban)

### Tests et Validation

1. Tests d'utilisabilité avec utilisateurs réels
2. Tests A/B sur les flux critiques (Fast-Scan)
3. Validation accessibilité (contraste WCAG AA)
4. Tests de performance sur différents devices

---

## Métadonnées Techniques

### Spécifications des Images

- **Format:** PNG haute résolution
- **Résolution Desktop:** 1920×1080px (landscape)
- **Résolution Mobile:** 375×812px (portrait, iPhone X/11/12)
- **Résolution Composants:** Dimensions variables selon contexte
- **Qualité:** Optimisée pour présentation et développement
- **Taille moyenne:** 500KB - 1.5MB par maquette

### Technologies de Génération

- **Outil:** Nano Banana (génération d'images AI haute qualité)
- **Prompts:** Détaillés avec spécifications exactes (couleurs HEX, dimensions, typographie)
- **Cohérence:** Images de référence utilisées pour maintenir le style
- **Itérations:** Génération en batch pour efficacité maximale

---

## Crédits et Licence

**Conception et Spécifications:** Francis AHONSU  
**Génération des Maquettes:** Francis AHONSU  
**Date de Création:** 29 janvier 2026  
**Projet:** CleanTrack Pro - Plateforme SaaS de Gestion de Pressings  

**© 2026 Francis AHONSU - Tous droits réservés**

---

## Contact

Pour toute question ou demande concernant ces maquettes :

**Francis AHONSU**  
*Directeur Artistique & UI/UX Designer*  
*CleanTrack Pro*

---

**Fin du Document**

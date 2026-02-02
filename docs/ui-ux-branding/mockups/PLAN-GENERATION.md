# Plan de Génération des Maquettes - CleanTrack Pro

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Objectif:** Créer des maquettes visuelles professionnelles suivant les flows utilisateurs

---

## Stratégie de Génération

### Principes Directeurs
1. **Suivre les parcours utilisateurs** pour garantir une cohérence narrative
2. **Respecter le design system** (couleurs, typographie, composants)
3. **Créer des wireflows visuels** permettant de simuler les parcours
4. **Prioriser les écrans critiques** pour l'expérience utilisateur

### Design System - Rappel
- **Couleur Primaire:** #1A5AD7 (Bleu Confiance)
- **Couleur Accent:** #FF6B00 (Orange Express)
- **Typographie:** Inter (Google Fonts)
- **Style:** Material Design moderne avec bordures arrondies (8px)
- **Palette:** Vert Succès (#10B981), Rouge Erreur (#EF4444), Ambre (#F59E0B)

---

## Parcours 1 : Authentification (5 écrans)

### Flow: Connexion → Récupération mot de passe → Réinitialisation

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| AUTH-01 | Page de connexion | Interface Keycloak personnalisée, carte centrée sur fond dégradé bleu ciel | ⭐⭐⭐ |
| AUTH-02 | Mot de passe oublié | Formulaire simple avec champ email | ⭐⭐ |
| AUTH-03 | Réinitialisation mot de passe | Deux champs pour nouveau mot de passe | ⭐⭐ |

---

## Parcours 2 : Superadmin - Gestion Plateforme (6 écrans)

### Flow: Dashboard → Liste tenants → Création → Détails

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| SA-01 | Dashboard Superadmin | KPIs en cartes, graphiques, sidebar navigation | ⭐⭐⭐ |
| SA-02 | Liste des Tenants | Tableau avec recherche, statuts colorés | ⭐⭐⭐ |
| SA-03 | Création de Tenant | Modale avec formulaire (nom, sous-domaine, contact) | ⭐⭐ |
| SA-04 | Détails du Tenant | Vue 360° avec onglets (Utilisateurs, Facturation) | ⭐⭐ |

---

## Parcours 3 : Admin_Tenant - Configuration Pressing (12 écrans)

### Flow: Dashboard → Gestion agences → Configuration catalogue → Grille tarifaire

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| AT-01 | Dashboard Admin Tenant | KPIs globaux avec filtres par site | ⭐⭐⭐ |
| AT-02 | Gestion des Agences | Liste des sites du réseau | ⭐⭐⭐ |
| AT-03 | Création d'Agence | Formulaire (nom, adresse, logo) | ⭐⭐ |
| AT-07 | Configuration Types d'Articles | Liste des types de linge avec icônes | ⭐⭐⭐ |
| AT-10 | Grille Tarifaire | Matrice Prix (Article × Service) | ⭐⭐⭐ |
| AT-11 | Configuration Mode Express | Paramètres multiplicateur et SLA | ⭐⭐ |

---

## Parcours 4 : Admin_Site - Gestion Agence (7 écrans)

### Flow: Dashboard → Gestion rayons → Vue occupation

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| AS-01 | Dashboard Admin Site | KPIs agence (commandes, CA, occupation) | ⭐⭐⭐ |
| AS-02 | Gestion des Rayons | Grille visuelle des emplacements de stockage | ⭐⭐⭐ |
| AS-05 | Vue Occupation Rayons | Carte thermique en temps réel | ⭐⭐ |

---

## Parcours 5 : User_Site - Réception Commande (9 écrans) 🔥 CRITIQUE

### Flow: Interface Fast-Scan → Recherche client → Sélection articles → Panier → Validation → Impression

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| US-01 | Interface Fast-Scan | Layout 3 colonnes (Client/Catalogue/Panier) | ⭐⭐⭐⭐⭐ |
| US-02 | Recherche Client (Omnibox) | Barre recherche temps réel sur fond bleu ciel | ⭐⭐⭐⭐⭐ |
| US-03 | Création Client Rapide | Modale minimaliste (nom, téléphone) | ⭐⭐⭐ |
| US-04 | Sélection Articles | Grille d'icônes cliquables des types d'articles | ⭐⭐⭐⭐⭐ |
| US-05 | Résumé Commande (Panier) | Liste articles avec quantités, services, prix en temps réel | ⭐⭐⭐⭐⭐ |
| US-06 | Toggle Mode Express | Interrupteur orange avec impact visuel sur prix | ⭐⭐⭐⭐ |
| US-07 | Validation Commande | Modale de confirmation avec récapitulatif | ⭐⭐⭐ |
| US-08 | Aperçu Ticket Thermique | Prévisualisation avec QR code géant | ⭐⭐⭐ |
| US-09 | Confirmation Impression | Notification succès avec numéro commande | ⭐⭐ |

---

## Parcours 6 : User_Site - Traitement Commandes (7 écrans)

### Flow: Liste commandes → Détails → Scan QR → Changement statut

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| UT-01 | Liste des Commandes | Tableau filtrable par statut, date, client | ⭐⭐⭐ |
| UT-02 | Détails de Commande | Vue complète avec historique | ⭐⭐⭐ |
| UT-03 | Scan QR Code | Interface de scan pour identifier commande | ⭐⭐ |
| UT-05 | Commandes en Cours | Vue kanban par statut | ⭐⭐⭐ |
| UT-07 | Alertes Retard | Liste commandes en retard SLA | ⭐⭐ |

---

## Parcours 7 : User_Site - Rangement et Stockage (6 écrans)

### Flow: Commandes à ranger → Scan → Sélection rayon → Confirmation

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| UR-01 | Commandes à Ranger | Liste commandes au statut READY | ⭐⭐⭐ |
| UR-02 | Sélection Rayon | Grille interactive des slots disponibles | ⭐⭐⭐ |
| UR-03 | Scan Commande | Scan QR code de la commande | ⭐⭐ |
| UR-06 | Vue Rayons Occupés | Carte des rayons avec commandes assignées | ⭐⭐ |

---

## Parcours 8 : User_Site - Livraison et Retrait (6 écrans)

### Flow: Scan QR client → Détails commande → Vérification → Paiement → Confirmation

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| UL-01 | Scan QR Code Client | Interface de scan du ticket client | ⭐⭐⭐ |
| UL-02 | Détails Commande Retrait | Informations avec localisation rayon | ⭐⭐⭐ |
| UL-03 | Vérification Articles | Checklist des articles à remettre | ⭐⭐ |
| UL-04 | Paiement | Interface de paiement (montant, mode) | ⭐⭐⭐ |
| UL-05 | Confirmation Livraison | Validation finale | ⭐⭐ |

---

## Parcours 9 : Client Mobile (11 écrans) 🔥 CRITIQUE

### Flow: Onboarding → Connexion → Dashboard → QR Code → Suivi commandes

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| CL-01 | Écran d'Accueil | Bienvenue avec logo et boutons connexion/inscription | ⭐⭐⭐ |
| CL-02 | Connexion Client | Authentification téléphone + code SMS | ⭐⭐⭐ |
| CL-04 | Dashboard Client | Aperçu commandes en cours avec cartes | ⭐⭐⭐⭐⭐ |
| CL-05 | Mon Code Unique | Grand QR code au centre pour identification | ⭐⭐⭐⭐⭐ |
| CL-06 | Liste des Commandes | Onglets "En cours" / "Historique" | ⭐⭐⭐ |
| CL-07 | Détails Commande | Informations complètes avec articles et prix | ⭐⭐⭐⭐ |
| CL-08 | Suivi Temps Réel | Timeline verticale avec étapes de traitement | ⭐⭐⭐⭐⭐ |
| CL-09 | Notifications | Centre de notifications avec alertes | ⭐⭐ |
| CL-10 | Profil Client | Informations personnelles et paramètres | ⭐⭐ |

---

## Parcours 10 : Admin_Tenant - Rapports et Analytics (6 écrans)

### Flow: Dashboard analytics → Rapports financiers → Graphiques performance

| ID | Écran | Description | Priorité |
|----|-------|-------------|----------|
| RA-01 | Dashboard Analytics | KPIs globaux avec graphiques temporels | ⭐⭐⭐ |
| RA-02 | Rapport Financier | Tableaux CA, dépenses, marges par site | ⭐⭐ |
| RA-03 | Analyse Performance | Graphiques de performance opérationnelle | ⭐⭐ |

---

## Ordre de Génération Recommandé

### Phase 1 : Fondations (Priorité ⭐⭐⭐⭐⭐)
1. **AUTH-01** - Page de connexion
2. **US-01** - Interface Fast-Scan (layout principal)
3. **US-02** - Omnibox recherche client
4. **US-04** - Grille sélection articles
5. **US-05** - Panier en temps réel
6. **US-06** - Toggle mode express
7. **CL-04** - Dashboard client mobile
8. **CL-05** - QR code client
9. **CL-08** - Timeline suivi commande

### Phase 2 : Écrans Critiques (Priorité ⭐⭐⭐)
10. **SA-01** - Dashboard Superadmin
11. **SA-02** - Liste des tenants
12. **AT-01** - Dashboard Admin Tenant
13. **AT-02** - Gestion agences
14. **AT-07** - Configuration articles
15. **AT-10** - Grille tarifaire
16. **AS-01** - Dashboard Admin Site
17. **AS-02** - Gestion rayons
18. **UT-01** - Liste commandes
19. **UT-02** - Détails commande
20. **UT-05** - Vue kanban
21. **UR-01** - Commandes à ranger
22. **UR-02** - Sélection rayon
23. **UL-01** - Scan QR retrait
24. **UL-02** - Détails retrait
25. **UL-04** - Paiement
26. **CL-01** - Accueil mobile
27. **CL-02** - Connexion mobile
28. **CL-06** - Liste commandes mobile
29. **CL-07** - Détails commande mobile

### Phase 3 : Écrans Secondaires (Priorité ⭐⭐)
30. **AUTH-02** - Mot de passe oublié
31. **AUTH-03** - Réinitialisation
32. **SA-03** - Création tenant
33. **SA-04** - Détails tenant
34. **AT-03** - Création agence
35. **AT-11** - Config express
36. **AS-05** - Carte thermique rayons
37. **US-03** - Création client rapide
38. **US-07** - Validation commande
39. **US-08** - Aperçu ticket
40. **UT-03** - Scan QR
41. **UT-07** - Alertes retard
42. **UR-03** - Scan rangement
43. **UR-06** - Vue rayons occupés
44. **UL-03** - Vérification articles
45. **UL-05** - Confirmation livraison
46. **CL-09** - Notifications
47. **CL-10** - Profil client
48. **RA-01** - Dashboard analytics

---

## Statistiques

- **Total écrans à générer:** ~48 maquettes prioritaires
- **Parcours couverts:** 10 parcours utilisateurs
- **Plateformes:** Web (desktop) + Mobile
- **Style:** Nano Banana (génération d'images haute qualité)

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

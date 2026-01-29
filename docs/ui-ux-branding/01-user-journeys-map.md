# Cartographie des Parcours Utilisateurs - CleanTrack Pro

**Auteur:** Francis AHONSU  
**Date:** 29 janvier 2026  
**Version:** 1.0

---

## Introduction

Ce document identifie et cartographie l'ensemble des parcours utilisateurs de la plateforme CleanTrack Pro, une solution SaaS multi-tenant pour la gestion professionnelle de pressings. Chaque parcours est décomposé en étapes numérotées correspondant à des écrans ou interfaces spécifiques.

---

## Rôles Utilisateurs

La plateforme supporte **5 rôles principaux** :

1. **Superadmin** - Gestionnaire de la plateforme SaaS
2. **Admin_Tenant** - Propriétaire du pressing (multi-sites)
3. **Admin_Site** - Gérant d'une agence spécifique
4. **User_Site** - Opérateur de pressing (réception, traitement, livraison)
5. **Client** - Client final du pressing

---

## Parcours Utilisateur 1 : Authentification & Accès (Tous Rôles)

**Objectif :** Permettre à tous les utilisateurs de se connecter de manière sécurisée via Keycloak

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **AUTH-01** | Page de connexion Keycloak | Interface de connexion avec email/mot de passe | Web + Mobile |
| **AUTH-02** | Mot de passe oublié | Formulaire de récupération de mot de passe | Web + Mobile |
| **AUTH-03** | Réinitialisation de mot de passe | Interface de création d'un nouveau mot de passe | Web + Mobile |
| **AUTH-04** | Changement de mot de passe | Interface pour modifier le mot de passe actuel | Web + Mobile |
| **AUTH-05** | Erreur d'authentification | Message d'erreur en cas d'échec de connexion | Web + Mobile |

**Flux :**
1. Utilisateur clique sur "Se connecter" → Redirection vers AUTH-01
2. Saisie des identifiants → Validation
3. Si oubli → AUTH-02 → AUTH-03
4. Si succès → Redirection vers dashboard approprié selon le rôle

---

## Parcours Utilisateur 2 : Superadmin - Gestion de la Plateforme

**Objectif :** Permettre au Superadmin de gérer les tenants (clients SaaS)

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **SA-01** | Dashboard Superadmin | Vue d'ensemble de tous les tenants | Web |
| **SA-02** | Liste des Tenants | Tableau avec tous les tenants actifs/inactifs | Web |
| **SA-03** | Création de Tenant | Formulaire de création (Nom, Subdomain, Contact) | Web |
| **SA-04** | Détails du Tenant | Vue détaillée d'un tenant avec statistiques | Web |
| **SA-05** | Édition du Tenant | Modification des informations du tenant | Web |
| **SA-06** | Gestion des utilisateurs Tenant | Liste et attribution des rôles Admin_Tenant | Web |

**Flux :**
1. Connexion → SA-01 (Dashboard)
2. Navigation → SA-02 (Liste)
3. Création nouveau client → SA-03
4. Consultation → SA-04 → SA-05 (Édition si nécessaire)
5. Gestion des accès → SA-06

---

## Parcours Utilisateur 3 : Admin_Tenant - Configuration du Pressing

**Objectif :** Permettre au propriétaire de configurer son réseau d'agences et ses services

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **AT-01** | Dashboard Admin Tenant | KPIs globaux (CA, Dépenses, Marge) avec filtres par site | Web |
| **AT-02** | Gestion des Agences | Liste des sites/agences du réseau | Web |
| **AT-03** | Création d'Agence | Formulaire (Nom, Adresse, Contact, Logo) | Web |
| **AT-04** | Détails de l'Agence | Informations complètes d'un site | Web |
| **AT-05** | Édition de l'Agence | Modification des paramètres du site | Web |
| **AT-06** | Gestion des Utilisateurs Site | Attribution des rôles Admin_Site et User_Site | Web |
| **AT-07** | Configuration des Types d'Articles | Liste et gestion des types de linge (Chemise, Pantalon, etc.) | Web |
| **AT-08** | Création/Édition Type d'Article | Formulaire avec nom, catégorie, icône | Web |
| **AT-09** | Configuration des Services | Gestion des services (Lavage, Repassage, Nettoyage à sec) | Web |
| **AT-10** | Grille Tarifaire | Matrice Prix × (Article Type × Service) | Web |
| **AT-11** | Configuration Mode Express | Paramètres (Multiplicateur prix, Délai SLA) | Web |
| **AT-12** | Paramètres Généraux Tenant | Branding, Logo, Coordonnées | Web |

**Flux Configuration Initiale :**
1. Connexion → AT-01 (Dashboard)
2. Création réseau → AT-02 → AT-03 (Nouvelle agence)
3. Configuration catalogue → AT-07 → AT-08 (Types d'articles)
4. Configuration services → AT-09 → AT-10 (Tarifs)
5. Configuration express → AT-11
6. Gestion équipe → AT-06

---

## Parcours Utilisateur 4 : Admin_Site - Gestion de l'Agence

**Objectif :** Permettre au gérant de gérer son agence spécifique

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **AS-01** | Dashboard Admin Site | KPIs de l'agence (Commandes, CA, Occupation rayons) | Web |
| **AS-02** | Gestion des Rayons | Grille visuelle des emplacements de stockage | Web |
| **AS-03** | Création de Rayon/Slot | Formulaire (Label ex: A-01, Capacité) | Web |
| **AS-04** | Édition de Rayon | Modification des paramètres d'un slot | Web |
| **AS-05** | Vue Occupation Rayons | Carte thermique de l'occupation en temps réel | Web |
| **AS-06** | Gestion des Dépenses | Saisie des dépenses opérationnelles du site | Web |
| **AS-07** | Rapports Site | Rapports financiers et opérationnels de l'agence | Web |

**Flux :**
1. Connexion → AS-01 (Dashboard)
2. Configuration stockage → AS-02 → AS-03 (Création slots)
3. Suivi occupation → AS-05
4. Gestion financière → AS-06 → AS-07

---

## Parcours Utilisateur 5 : User_Site - Réception de Commande

**Objectif :** Permettre à l'opérateur de créer rapidement une commande client

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **US-01** | Interface Réception "Fast-Scan" | Écran principal de prise de commande | Web |
| **US-02** | Recherche Client (Omnibox) | Barre de recherche unique (Téléphone, Nom, Email, Code) | Web |
| **US-03** | Création Client Rapide | Formulaire minimal (Nom, Téléphone) | Web |
| **US-04** | Sélection Articles | Grille d'icônes cliquables des types d'articles | Web |
| **US-05** | Résumé Commande en Cours | Panier avec articles, quantités, services, prix | Web |
| **US-06** | Toggle Mode Express | Activation/désactivation du mode express avec impact prix | Web |
| **US-07** | Validation Commande | Récapitulatif final avant impression | Web |
| **US-08** | Aperçu Ticket Thermique | Prévisualisation du ticket avant impression | Web |
| **US-09** | Confirmation Impression | Message de succès avec numéro de commande | Web |

**Flux :**
1. Ouverture → US-01 (Interface Fast-Scan)
2. Recherche client → US-02
   - Si nouveau → US-03 (Création)
   - Si existant → Sélection
3. Ajout articles → US-04 → US-05 (Mise à jour panier)
4. Option express → US-06
5. Finalisation → US-07 → US-08 → Impression → US-09

---

## Parcours Utilisateur 6 : User_Site - Traitement des Commandes

**Objectif :** Permettre à l'opérateur de suivre et mettre à jour le statut des commandes

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **UT-01** | Liste des Commandes | Tableau filtrable par statut, date, client | Web |
| **UT-02** | Détails de Commande | Vue complète d'une commande avec historique | Web |
| **UT-03** | Scan QR Code | Interface de scan pour identifier une commande | Web + Mobile |
| **UT-04** | Changement de Statut | Sélecteur de statut avec confirmation | Web + Mobile |
| **UT-05** | Commandes en Cours | Vue kanban des commandes par statut | Web |
| **UT-06** | Commandes Prêtes | Liste des commandes à ranger | Web |
| **UT-07** | Alertes Retard | Liste des commandes en retard SLA | Web |

**Flux :**
1. Navigation → UT-01 (Liste) ou UT-05 (Kanban)
2. Sélection commande → UT-02 (Détails)
3. Scan article → UT-03
4. Mise à jour statut → UT-04
5. Surveillance retards → UT-07

---

## Parcours Utilisateur 7 : User_Site - Rangement et Stockage

**Objectif :** Permettre à l'opérateur de ranger les commandes prêtes dans les rayons

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **UR-01** | Commandes à Ranger | Liste des commandes au statut READY | Web |
| **UR-02** | Sélection Rayon | Grille interactive des slots disponibles | Web |
| **UR-03** | Scan Commande | Scan QR code de la commande à ranger | Web |
| **UR-04** | Attribution Slot | Confirmation de l'attribution commande → slot | Web |
| **UR-05** | Confirmation Rangement | Message de succès avec localisation | Web |
| **UR-06** | Vue Rayons Occupés | Carte des rayons avec commandes assignées | Web |

**Flux :**
1. Accès → UR-01 (Commandes prêtes)
2. Scan commande → UR-03
3. Sélection emplacement → UR-02 → UR-04
4. Confirmation → UR-05
5. Consultation → UR-06

---

## Parcours Utilisateur 8 : User_Site - Livraison et Retrait Client

**Objectif :** Permettre à l'opérateur de gérer le retrait des commandes par les clients

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **UL-01** | Scan QR Code Client | Interface de scan du ticket client | Web |
| **UL-02** | Détails Commande Retrait | Informations complètes avec localisation rayon | Web |
| **UL-03** | Vérification Articles | Checklist des articles à remettre | Web |
| **UL-04** | Paiement | Interface de paiement (Montant, Mode) | Web |
| **UL-05** | Confirmation Livraison | Validation finale avec signature optionnelle | Web |
| **UL-06** | Reçu de Livraison | Impression du reçu de paiement/livraison | Web |

**Flux :**
1. Client présente ticket → UL-01 (Scan)
2. Affichage commande → UL-02
3. Vérification → UL-03
4. Encaissement → UL-04
5. Finalisation → UL-05 → UL-06 (Reçu)

---

## Parcours Utilisateur 9 : Client - Portail Client Mobile

**Objectif :** Permettre au client de suivre ses commandes et accéder à son code unique

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **CL-01** | Écran d'Accueil | Présentation de l'application et connexion | Mobile |
| **CL-02** | Connexion Client | Authentification (Téléphone + Code SMS ou Email) | Mobile |
| **CL-03** | Inscription Client | Création de compte client | Mobile |
| **CL-04** | Dashboard Client | Vue d'ensemble des commandes en cours | Mobile |
| **CL-05** | Mon Code Unique | Affichage du QR code personnel pour identification | Mobile |
| **CL-06** | Liste des Commandes | Historique complet des commandes | Mobile |
| **CL-07** | Détails Commande | Statut, articles, prix, date de retrait | Mobile |
| **CL-08** | Suivi en Temps Réel | Timeline du statut de la commande | Mobile |
| **CL-09** | Notifications | Centre de notifications (Commande prête, retard, etc.) | Mobile |
| **CL-10** | Profil Client | Informations personnelles et paramètres | Mobile |
| **CL-11** | Historique Paiements | Liste des transactions passées | Mobile |

**Flux :**
1. Lancement app → CL-01
2. Connexion → CL-02 (ou CL-03 si nouveau)
3. Accueil → CL-04 (Dashboard)
4. Consultation code → CL-05
5. Suivi commande → CL-06 → CL-07 → CL-08
6. Gestion profil → CL-10

---

## Parcours Utilisateur 10 : Admin_Tenant - Rapports et Analytics

**Objectif :** Permettre au propriétaire d'analyser les performances du réseau

### Écrans

| ID Écran | Nom de l'écran | Description | Plateforme |
|----------|----------------|-------------|------------|
| **RA-01** | Dashboard Analytics | KPIs globaux avec graphiques temporels | Web |
| **RA-02** | Filtre Temporel | Sélecteur de période (Jour, Semaine, Mois, Année, Personnalisé) | Web |
| **RA-03** | Comparaison Sites | Graphiques comparatifs entre agences | Web |
| **RA-04** | Rapport Financier | CA, Dépenses, Marge par période et par site | Web |
| **RA-05** | Rapport Opérationnel | Nombre de commandes, délais moyens, taux de retard | Web |
| **RA-06** | Rapport Clients | Nouveaux clients, clients récurrents, taux de rétention | Web |
| **RA-07** | Export Données | Génération de rapports PDF/Excel | Web |

**Flux :**
1. Accès → RA-01 (Dashboard)
2. Sélection période → RA-02
3. Analyse comparative → RA-03
4. Consultation rapports → RA-04, RA-05, RA-06
5. Export → RA-07

---

## Synthèse des Écrans par Plateforme

### Web (Interface Administrateur & Opérateur)
- **Authentification :** 5 écrans (AUTH-01 à AUTH-05)
- **Superadmin :** 6 écrans (SA-01 à SA-06)
- **Admin_Tenant :** 12 écrans (AT-01 à AT-12)
- **Admin_Site :** 7 écrans (AS-01 à AS-07)
- **User_Site Réception :** 9 écrans (US-01 à US-09)
- **User_Site Traitement :** 7 écrans (UT-01 à UT-07)
- **User_Site Rangement :** 6 écrans (UR-01 à UR-06)
- **User_Site Livraison :** 6 écrans (UL-01 à UL-06)
- **Rapports :** 7 écrans (RA-01 à RA-07)

**Total Web : 65 écrans uniques**

### Mobile (Application Client)
- **Authentification :** 5 écrans (AUTH-01 à AUTH-05)
- **Client :** 11 écrans (CL-01 à CL-11)

**Total Mobile : 16 écrans uniques**

---

## Écrans Partagés Web/Mobile

Les écrans d'authentification (AUTH-01 à AUTH-05) doivent être conçus en responsive pour fonctionner sur les deux plateformes avec des adaptations mineures.

---

## Prochaines Étapes

1. ✅ Cartographie complète des parcours
2. 🔄 Création des spécifications visuelles détaillées pour chaque écran
3. 🔄 Conception des templates Keycloak personnalisés
4. 🔄 Création des maquettes haute-fidélité
5. 🔄 Documentation du design system

---

**Document préparé par Francis AHONSU**  
*Directeur Artistique & UI/UX Designer - CleanTrack Pro*

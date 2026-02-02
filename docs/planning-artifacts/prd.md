# Product Requirements Document (PRD) - CleanTrack Pro

## 1. Gestion des Identités (IAM via Keycloak)
* **Structure :** Un seul Realm avec des claims `tenant_id` et `site_ids[]` dans le JWT.
* **Rôles :** * `Superadmin` : Gestion du SaaS.
    * `Admin_Tenant` : Propriétaire du pressing (gère les prix, sites, comptes).
    * `Admin_Site` : Gérant d'agence (gère les slots de rayons, dépenses locales).
    * `User_Site` : Opérateur (réception, lavage, mise en rayon).
    * `Client` : Accès au portail pour suivi et QR code de retrait.

## 2. Gestion Client & Identification
* **Fiche Client :** Unique au niveau du Tenant. Utilisable dans toutes les agences du réseau.
* **Identification Hybride :** Recherche via Omnibox (Téléphone E.164, Nom, Email ou Code Unique).
* **Code Unique :** Généré au premier enregistrement, imprimable sur carte physique ou affichable sur mobile via QR Code.

## 3. Cycle de Vie des Commandes
### Flux de Traçabilité (9 États)
1. `CREATED` : Enregistrée.
2. `COLLECTED` : Récupérée chez le client (si commande en ligne).
3. `IN_PROGRESS` : En cours de lavage/traitement.
4. `READY` : Traitement terminé.
5. `STORED` : Placé dans un rayon (Slot ID requis).
6. `DELIVERED` : Remis au client (Paiement finalisé).
7. `CANCELLED` : Annulée.
8. `LOST` : Alerte perte de linge.
9. `DELAYED` : Retard par rapport au SLA Express/Normal.

## 4. Gestion des Services & Prix
* **Catalogue :** Lavage Complet, Repassage Simple par type de linge.
* **Mode Express :** Priorise la commande en file d'attente. Délai (heures/jours) et prix configurables par le Tenant.
* **Order Items :** Une commande peut contenir plusieurs articles, chacun avec son propre type de service.

## 5. Logistique de Rangement (Slots)
* **Inventaire :** L'Admin_Site pré-crée les slots de rayons (ex: A-01, A-02).
* **Attribution :** Lors du passage à `STORED`, l'opérateur sélectionne un slot libre. Une commande peut occuper plusieurs slots.

## 6. Impression Thermique
* **Ticket Client :** QR Code unique pour retrait, liste des articles, date de remise promise.
* **Étiquettes :** Petits coupons avec QR code liés à l'item de commande.

## 7. Système d'Identité Visuelle
* **Design System :** "Blue Trust" (#1A5AD7) comme couleur primaire.
* **Typographie :** Inter font family.
* **Composants :** Badge, Card, Button standardisés avec sémantique (Express=Orange/Red, Slot Free=Green, Slot Occupied=Grey).
* **Responsive :** Sidebar et Layout adaptatif (Mobile/Desktop).

## 8. Audit & Sécurité
* **Logging :** Traçabilité automatique de toutes les opérations d'écriture (Create, Update, Delete).
* **Données :** Qui (User ID), Quoi (Endpoint), Quand (Timestamp), Détails (Payload).
* **Consultation :** Interface Superadmin pour filtrer et visualiser les logs.

## 9. Gestion des Abonnements SaaS
* **Plans :** Définition des niveaux de service (ex: Starter, Pro, Enterprise).
* **Limites :** Quotas par plan (ex: Nombre de sites, Volume de commandes).
* **Facturation :** Cycle Mensuel/Annuel.
* **Enforcement :** Blocage des actions dépassant les quotas (ex: Ajout d'un 2ème site pour plan Starter).
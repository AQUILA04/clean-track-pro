# Plan d'Implémentation Technique : Catalogue (Type d'Articles)

## Objectif
Basculer l'onglet "Types d'Articles" du Catalogue d'un mode "Mock" vers une connexion réelle à la base de données.
Inclut les fonctionnalités : Lecture (Liste), Création, Edition, Suppression.

## 1. Backend Implementation

### Entité existante
*   **ArticleType (`article-type.entity.ts`)**
    *   `id` (UUID)
    *   `tenant_id` (UUID)
    *   `label` (String) - correspond au `name` côté frontend.
    *   `category` (String)
    *   `icon` (String)
    *   `is_active` (Boolean)

### Contrôleur existant (`CatalogController`)
*   `POST /article-types` : Création (Existant)
*   `GET /article-types` : Liste (Existant)
*   `PATCH /article-types/:id` : Mise à jour (Existant)
*   **A FAIRE** : Ajouter `DELETE /article-types/:id`.

### Service existant (`CatalogService`)
*   `create`, `findAll`, `findOne`, `update` sont implémentés.
*   **A FAIRE** : Implémenter la méthode `delete(id, tenantId)`.

## 2. Frontend Implementation

### Service (`article-type.service.ts`)
*   Mettre à jour `findAll` pour mapper les champs backend (`label`) vers frontend (`name`).
*   S'assurer que `create`, `update` appellent les bonnes routes API.
*   Ajouter la méthode `delete(id)`.

### Page Catalogue (`catalogue/page.tsx`)
*   Désactiver `USE_MOCK_DATA`.
*   Remplacer les appels mockés par les appels réels via `articleTypeService`.
*   Mapper les données reçues pour l'affichage dans `ArticleTable`.

### Modale d'Ajout (`AddArticleModal.tsx`)
*   Vérifier que les données envoyées correspondent au DTO attendu par le backend.
*   Gérer l'état de chargement et les erreurs.

### Tableau des Articles (`ArticleTable.tsx`)
*   Connecter les boutons d'action "Editer" et "Supprimer".
*   "Editer" devra ouvrir une modale (potentiellement `AddArticleModal` en mode édition).
*   "Supprimer" devra afficher une confirmation puis appeler l'API de suppression.

## 3. Plan de Verification

| ID | Cas de Test | Résultat Attendu |
|----|-------------|-------------------|
| 1 | Affichage Liste | La liste affiche les articles présents en BDD. |
| 2 | Création Article | Un nouvel article s'ajoute et persiste après rechargement. |
| 3 | Edition Article | La modification du nom ou de la catégorie est sauvegardée. |
| 4 | Suppression Article | L'article disparaît de la liste et de la BDD. |
| 5 | Isolation | Un autre tenant ne voit pas ces articles. |

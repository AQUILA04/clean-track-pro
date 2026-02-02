# CleanTrack Pro

Application SaaS multi-tenant pour la gestion de pressing avec suivi en temps réel.

## 🚀 Quick Start - Setup Automatisé

Pour démarrer l'environnement complet avec une seule commande :

```bash
./setup.sh
```

Ce script automatise :
- ✅ Démarrage des services Docker (PostgreSQL, Keycloak, Redis, MailDev)
- ✅ Installation des dépendances backend et frontend
- ✅ Configuration automatique de Keycloak (realm, client, rôles, utilisateurs)
- ✅ Exécution des migrations de base de données
- ✅ Configuration de MailDev pour les emails de test

## 📋 Services Disponibles

Après l'exécution du script `setup.sh`, les services suivants sont disponibles :

| Service | URL | Credentials |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | `postgres/postgres` |
| Keycloak Admin | http://localhost:8080 | `admin/admin` |
| Redis | `localhost:6379` | - |
| MailDev UI | http://localhost:1080 | - |
| MailDev SMTP | `localhost:1025` | - |
| Backend API | http://localhost:3000 | - |
| Frontend | http://localhost:3001 | - |

## 👤 Utilisateurs de Test

Les utilisateurs suivants sont créés automatiquement :

- **Superadmin**: `superadmin` / `password123`
- **Admin Tenant**: `admin_tenant` / `password123`

## 🏃 Démarrer l'Application

### Option 1 : Démarrage Automatique (Recommandé)

```bash
./start-all.sh
```

Ce script démarre automatiquement le backend et le frontend.

### Option 2 : Démarrage Manuel

#### Backend (NestJS)

```bash
cd backend
npm run start:dev
```

Le backend démarre sur http://localhost:3000

#### Frontend (Next.js)

```bash
cd frontend
PORT=3001 npm run dev
```

Le frontend démarre sur http://localhost:3001

## 📧 Configuration Email (MailDev)

Tous les emails envoyés par l'application sont capturés par MailDev :

- **Interface Web**: http://localhost:1080
- **SMTP Server**: `localhost:1025`

Configuration dans `.env` :
```
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@cleantrack.local
MAIL_SECURE=false
```

## 🧪 Tests des User Stories

Pour tester les user stories des epics 1 à 6 :

```bash
./test-user-stories.sh
```

Ce script vérifie :
- Epic 1: Foundation & IAM
- Epic 2: Client Registry
- Epic 3: Service Configuration
- Epic 4: Order Reception
- Epic 5: Workflow Tracking
- Epic 6: Storage & Delivery

## 📁 Structure du Projet

```
clean-track-pro/
├── backend/           # API NestJS
├── frontend/          # Application Next.js
├── docs/              # Documentation complète
│   ├── planning-artifacts/
│   │   ├── epics.md
│   │   ├── prd.md
│   │   └── architecture.md
│   └── ui-ux-branding/
├── scripts/           # Scripts utilitaires
│   ├── setup-keycloak.ts
│   └── mock-print-proxy.js
├── docker-compose.yml # Services infrastructure
├── setup.sh          # Script d'initialisation automatique
└── test-user-stories.sh # Script de test des user stories
```

## 🔧 Configuration Manuelle (si nécessaire)

### Backend

Copier `.env.example` vers `.env` et ajuster les valeurs :

```bash
cd backend
cp .env.example .env
```

### Frontend

Créer `.env.local` :

```bash
cd frontend
# Le fichier .env.local est créé automatiquement par setup.sh
```

## 🗄️ Base de Données

### Migrations

Créer une nouvelle migration :

```bash
cd backend
npm run migration:generate -- src/migrations/MigrationName
```

Exécuter les migrations :

```bash
npm run migration:run
```

Annuler la dernière migration :

```bash
npm run migration:revert
```

## 🔐 Keycloak

### Configuration Automatique

Le script `setup.sh` configure automatiquement :
- Realm `cleantrack`
- Client `cleantrack-client`
- Rôles : `Superadmin`, `Admin_Tenant`, `Admin_Site`, `User_Site`
- Mappers personnalisés : `tenant_id`, `site_ids`
- Utilisateurs de test

### Configuration Manuelle

Si nécessaire, exécuter manuellement :

```bash
cd backend
npm run keycloak:setup
```

## 📖 Documentation

La documentation complète du projet se trouve dans le dossier `docs/` :

- **PRD**: `docs/planning-artifacts/prd.md`
- **Architecture**: `docs/planning-artifacts/architecture.md`
- **Epics & User Stories**: `docs/planning-artifacts/epics.md`
- **UI/UX**: `docs/ui-ux-branding/`

## 🛠️ Technologies

### Backend
- NestJS 11
- TypeORM
- PostgreSQL 16
- Keycloak (OIDC)
- Redis

### Frontend
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- NextAuth.js

### Infrastructure
- Docker & Docker Compose
- MailDev (Email testing)

## 🐛 Dépannage

### Les services Docker ne démarrent pas

```bash
docker-compose down -v
docker-compose up -d
```

### Keycloak ne répond pas

Attendre que Keycloak soit complètement démarré (peut prendre 1-2 minutes) :

```bash
curl http://localhost:8080/health/ready
```

### Erreurs de migration

Réinitialiser la base de données :

```bash
docker-compose down -v
./setup.sh
```

## 📝 Licence

UNLICENSED - Propriétaire

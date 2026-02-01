# Commandes Rapides - CleanTrack Pro

## 🚀 Démarrage Initial

### Setup complet (première fois)
```bash
./setup-final.sh
```

### Démarrer les services Docker manuellement
```bash
# PostgreSQL
sudo docker run -d --name cleantrack-postgres --network host \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cleantrack \
  postgres:16

# Redis
sudo docker run -d --name cleantrack-redis --network host redis:alpine

# MailDev
sudo docker run -d --name cleantrack-maildev --network host maildev/maildev

# Keycloak
sudo docker run -d --name cleantrack-keycloak --network host \
  -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin \
  -e KC_DB=postgres -e KC_DB_URL=jdbc:postgresql://localhost:5432/cleantrack \
  -e KC_DB_USERNAME=postgres -e KC_DB_PASSWORD=postgres \
  -e KC_HOSTNAME=localhost \
  quay.io/keycloak/keycloak:26.1 start-dev
```

## 🔄 Gestion des Services

### Vérifier l'état des conteneurs
```bash
sudo docker ps
```

### Arrêter tous les conteneurs
```bash
sudo docker stop cleantrack-postgres cleantrack-keycloak cleantrack-redis cleantrack-maildev
```

### Supprimer tous les conteneurs
```bash
sudo docker rm -f cleantrack-postgres cleantrack-keycloak cleantrack-redis cleantrack-maildev
```

### Voir les logs d'un conteneur
```bash
sudo docker logs cleantrack-postgres
sudo docker logs cleantrack-keycloak
sudo docker logs cleantrack-redis
sudo docker logs cleantrack-maildev
```

## 🖥️ Backend

### Démarrer le backend
```bash
cd backend
npm run start:dev
```

### Voir les logs du backend
```bash
tail -f /tmp/backend.log
```

### Exécuter les migrations
```bash
cd backend
npm run migration:run
```

### Générer une nouvelle migration
```bash
cd backend
npm run migration:generate -- src/migrations/MigrationName
```

### Annuler la dernière migration
```bash
cd backend
npm run migration:revert
```

## 🌐 Frontend

### Démarrer le frontend
```bash
cd frontend
npm run dev
```

### Build de production
```bash
cd frontend
npm run build
npm start
```

## 🔐 Keycloak

### Reconfigurer Keycloak
```bash
npx ts-node scripts/setup-keycloak.ts
```

### Accéder à l'admin Keycloak
- URL: http://localhost:8080
- Username: `admin`
- Password: `admin`

### Utilisateurs de test
- Superadmin: `superadmin` / `password123`
- Admin Tenant: `admin_tenant` / `password123`

## 📧 MailDev

### Accéder à l'interface MailDev
```bash
# Ouvrir dans le navigateur
http://localhost:1080
```

### Configuration SMTP dans l'application
```
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@cleantrack.local
```

## 🗄️ Base de Données

### Se connecter à PostgreSQL
```bash
sudo docker exec -it cleantrack-postgres psql -U postgres -d cleantrack
```

### Commandes SQL utiles
```sql
-- Lister les tables
\dt

-- Voir la structure d'une table
\d orders

-- Lister les tenants
SELECT * FROM tenants;

-- Lister les clients
SELECT * FROM clients;

-- Lister les commandes
SELECT * FROM orders;

-- Quitter
\q
```

### Dump de la base de données
```bash
sudo docker exec cleantrack-postgres pg_dump -U postgres cleantrack > backup.sql
```

### Restaurer la base de données
```bash
cat backup.sql | sudo docker exec -i cleantrack-postgres psql -U postgres cleantrack
```

## 🧪 Tests API

### Obtenir un token d'authentification
```bash
TOKEN=$(curl -s -X POST "http://localhost:8080/realms/cleantrack/protocol/openid-connect/token" \
  -d "client_id=cleantrack-client" \
  -d "grant_type=password" \
  -d "username=superadmin" \
  -d "password=password123" | jq -r '.access_token')

echo $TOKEN
```

### Tester un endpoint protégé
```bash
# Lister les tenants
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/tenants

# Créer un tenant
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mon Pressing","subdomain":"mon-pressing"}' \
  http://localhost:3000/tenants

# Lister les clients
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/clients

# Créer un client
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jean Dupont","phone":"+33612345678","email":"jean@example.com"}' \
  http://localhost:3000/clients
```

## 🔍 Debugging

### Vérifier que tous les services sont accessibles
```bash
# PostgreSQL
pg_isready -h localhost -p 5432 -U postgres

# Redis
redis-cli ping

# Keycloak
curl http://localhost:8080/health/ready

# MailDev
curl http://localhost:1080

# Backend
curl http://localhost:3000
```

### Vérifier les ports utilisés
```bash
sudo netstat -tlnp | grep -E '3000|5432|6379|8080|1080|1025'
```

## 📊 Monitoring

### Voir l'utilisation des ressources Docker
```bash
sudo docker stats
```

### Voir les logs en temps réel
```bash
# Backend
tail -f /tmp/backend.log

# Keycloak
sudo docker logs -f cleantrack-keycloak

# PostgreSQL
sudo docker logs -f cleantrack-postgres
```

## 🔄 Workflow de Développement

### Workflow typique
```bash
# 1. Démarrer les services Docker
./setup-final.sh

# 2. Dans un terminal, démarrer le backend
cd backend && npm run start:dev

# 3. Dans un autre terminal, démarrer le frontend
cd frontend && npm run dev

# 4. Ouvrir le navigateur
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3000 (même port, Next.js proxy)
# - Keycloak: http://localhost:8080
# - MailDev: http://localhost:1080

# 5. Développer et tester
# Les changements de code sont automatiquement rechargés (hot reload)
```

## 📝 Notes Importantes

- Le backend écoute sur le port **3000** (pas 3001 comme dans certains fichiers .env)
- Tous les services Docker utilisent `--network host` pour éviter les problèmes iptables
- Les dépendances backend nécessitent `--legacy-peer-deps` à cause de `nest-keycloak-connect`
- MailDev capture automatiquement tous les emails envoyés sur le port 1025
- Les migrations de base de données sont idempotentes (peuvent être exécutées plusieurs fois)

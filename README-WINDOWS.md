# CleanTrack Pro - Guide Windows

Guide d'installation et d'utilisation pour Windows.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

1. **Docker Desktop for Windows**
   - Télécharger : https://www.docker.com/products/docker-desktop
   - Version minimale : 4.0+
   - ⚠️ **Important** : Docker Desktop doit être démarré avant d'exécuter les scripts

2. **Node.js**
   - Télécharger : https://nodejs.org/
   - Version minimale : 22.x
   - Vérifier l'installation : `node --version`

3. **Git for Windows** (optionnel, pour cloner le projet)
   - Télécharger : https://git-scm.com/download/win

## 🚀 Installation Rapide

### Étape 1 : Cloner le Projet

Ouvrez **PowerShell** ou **Command Prompt** et exécutez :

```cmd
git clone https://github.com/AQUILA04/clean-track-pro.git
cd clean-track-pro
```

### Étape 2 : Démarrer Docker Desktop

1. Lancez **Docker Desktop**
2. Attendez que Docker soit complètement démarré (icône verte dans la barre des tâches)

### Étape 3 : Exécuter le Setup Automatique

Double-cliquez sur `setup-final.bat` ou exécutez dans le terminal :

```cmd
setup-final.bat
```

Ce script va automatiquement :
- ✅ Vérifier que Docker et Node.js sont installés
- ✅ Démarrer PostgreSQL, Keycloak, Redis et MailDev
- ✅ Installer toutes les dépendances
- ✅ Configurer Keycloak automatiquement
- ✅ Exécuter les migrations de base de données

**⏱️ Durée estimée** : 5-10 minutes (selon votre connexion internet)

### Étape 4 : Démarrer l'Application

Double-cliquez sur `start-all.bat` ou exécutez :

```cmd
start-all.bat
```

Ce script va démarrer :
- ✅ Backend sur http://localhost:3000
- ✅ Frontend sur http://localhost:3001

Deux fenêtres de terminal s'ouvriront automatiquement pour afficher les logs.

### Étape 5 : Accéder à l'Application

Ouvrez votre navigateur et accédez à :

**🌐 Frontend** : http://localhost:3001

## 🔐 Utilisateurs de Test

Utilisez ces identifiants pour vous connecter :

| Utilisateur | Mot de passe | Rôle |
|-------------|--------------|------|
| `superadmin` | `password123` | Superadmin |
| `admin_tenant` | `password123` | Admin Tenant |

## 📊 Services Disponibles

Après l'exécution de `setup-final.bat`, les services suivants sont disponibles :

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Frontend** | http://localhost:3001 | Voir utilisateurs de test |
| **Backend API** | http://localhost:3000 | - |
| **Keycloak Admin** | http://localhost:8080 | `admin` / `admin` |
| **MailDev** | http://localhost:1080 | - |
| **PostgreSQL** | `localhost:5432` | `postgres` / `postgres` |
| **Redis** | `localhost:6379` | - |

## 📧 Emails de Test

Tous les emails envoyés par l'application sont capturés par **MailDev**.

Pour voir les emails :
1. Ouvrez http://localhost:1080
2. Tous les emails (création de compte, notifications, etc.) apparaîtront ici

## 🛠️ Commandes Utiles

### Arrêter les Services

Pour arrêter le backend et le frontend, fermez simplement les fenêtres de terminal.

Pour arrêter les conteneurs Docker :

```cmd
docker stop cleantrack-postgres cleantrack-keycloak cleantrack-redis cleantrack-maildev
```

### Redémarrer les Services Docker

```cmd
docker start cleantrack-postgres cleantrack-keycloak cleantrack-redis cleantrack-maildev
```

### Voir les Logs Docker

```cmd
REM PostgreSQL
docker logs cleantrack-postgres

REM Keycloak
docker logs cleantrack-keycloak

REM Redis
docker logs cleantrack-redis

REM MailDev
docker logs cleantrack-maildev
```

### Réinitialiser Complètement

Si vous rencontrez des problèmes, vous pouvez tout réinitialiser :

```cmd
REM Arrêter et supprimer tous les conteneurs
docker rm -f cleantrack-postgres cleantrack-keycloak cleantrack-redis cleantrack-maildev

REM Supprimer les volumes (⚠️ cela supprimera toutes les données)
docker volume prune -f

REM Relancer le setup
setup-final.bat
```

## 🐛 Dépannage

### Problème : "Docker is not running"

**Solution** :
1. Ouvrez Docker Desktop
2. Attendez que l'icône devienne verte dans la barre des tâches
3. Réessayez `setup-final.bat`

### Problème : "Port 3000 or 3001 already in use"

**Solution** :
1. Vérifiez si une autre application utilise ces ports
2. Fermez les applications qui utilisent ces ports
3. Ou modifiez les ports dans les fichiers de configuration

### Problème : "npm install fails"

**Solution** :
1. Supprimez les dossiers `node_modules` :
   ```cmd
   rmdir /s /q node_modules backend\node_modules frontend\node_modules
   ```
2. Supprimez les fichiers de lock :
   ```cmd
   del package-lock.json backend\package-lock.json frontend\package-lock.json
   ```
3. Réexécutez `setup-final.bat`

### Problème : "Keycloak ne démarre pas"

**Solution** :
1. Keycloak peut prendre 1-2 minutes pour démarrer
2. Vérifiez les logs : `docker logs cleantrack-keycloak`
3. Si nécessaire, redémarrez le conteneur :
   ```cmd
   docker restart cleantrack-keycloak
   ```

### Problème : "Cannot connect to database"

**Solution** :
1. Vérifiez que PostgreSQL est démarré : `docker ps`
2. Redémarrez PostgreSQL :
   ```cmd
   docker restart cleantrack-postgres
   ```
3. Attendez 10 secondes et réessayez

## 📖 Documentation Complète

Pour plus d'informations, consultez :

- **README.md** - Documentation générale du projet
- **RAPPORT_FINAL.md** - Rapport complet de configuration
- **COMMANDES_RAPIDES.md** - Référence des commandes

## 💡 Conseils

### Développement

Pour un développement efficace :

1. **Gardez Docker Desktop ouvert** pendant le développement
2. **Utilisez deux terminaux** : un pour le backend, un pour le frontend
3. **Consultez MailDev** pour voir les emails de test
4. **Utilisez Keycloak Admin** pour gérer les utilisateurs et rôles

### Performance

Pour améliorer les performances :

1. **Allouez plus de mémoire à Docker Desktop** :
   - Docker Desktop → Settings → Resources → Memory
   - Recommandé : 4 GB minimum

2. **Désactivez l'antivirus** pour les dossiers du projet (peut ralentir npm install)

3. **Utilisez WSL2** si disponible :
   - Docker Desktop → Settings → General → Use WSL 2 based engine

## 🆘 Support

Si vous rencontrez des problèmes non résolus par ce guide :

1. Vérifiez les logs dans les terminaux
2. Consultez les logs Docker : `docker logs <container-name>`
3. Créez une issue sur GitHub avec :
   - Description du problème
   - Messages d'erreur
   - Version de Windows, Docker et Node.js

## 🎉 C'est Tout !

Vous êtes maintenant prêt à utiliser CleanTrack Pro sur Windows !

**Commandes essentielles** :
- `setup-final.bat` - Configuration initiale (une seule fois)
- `start-all.bat` - Démarrer backend + frontend
- http://localhost:3001 - Accéder à l'application

Bon développement ! 🚀

# 🚀 Déploiement Vercel + Render - Guide Complet

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Utilisateurs Internet                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
   ┌────▼───────────┐                    ┌─────▼──────────┐
   │  Vercel CDN     │                    │ Render Backend  │
   │ (Frontend)      │                    │  (API + Node.js)│
   │ React + PWA     │◄──────────────────►│                │
   └────────────────┘                    └─────┬──────────┘
                                                │
                                         ┌──────▼──────────┐
                                         │  Render MySQL   │
                                         │   Database      │
                                         └─────────────────┘
```

## Phase 1 : Préparation Locale (10 minutes)

### 1.1 Vérifier l'installation

```bash
# Vérifier les packages requis
npm ls | grep mysql2
npm ls | grep dotenv
npm ls | grep express
npm ls | grep cors
```

### 1.2 Créer le fichier `.env` local

```env
# Base de données Render (ou MySQL local pour test)
DATABASE_URL=mysql://admin:password@host:port/todo_app

# Ou alternativement (pour développement local)
MYSQL_HOST=127.0.0.1
MYSQL_USER=root
MYSQL_PASSWORD=130305Timo
MYSQL_DATABASE=todo_app
MYSQL_PORT=3306

# Authentification
JWT_SECRET=your_jwt_secret_key_here_change_this
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Environnement
NODE_ENV=development
PORT=4000
```

### 1.3 Tester localement

```bash
# Démarrer le backend (version Render)
node server/index-render.js

# Vérifier la connexion
curl http://localhost:4000/health
# Réponse: {"status":"ok","timestamp":"2025-01-15T..."}
```

## Phase 2 : Configuration Render (15 minutes)

### 2.1 Créer un compte Render

1. Aller sur [https://render.com](https://render.com)
2. S'enregistrer avec GitHub (recommandé)
3. Créer une nouvelle organisation ou utiliser l'existante

### 2.2 Créer la base de données MySQL

1. Tableau de bord Render → **New +** → **MySQL**
2. Configuration :
   - **Name**: `todo-list-pro-db`
   - **Database Name**: `todo_app`
   - **User**: `admin`
   - **Region**: `Frankfurt` (ou plus proche)
   - **Tier**: `Free`
3. Créer et attendre 2-3 min
4. Copier la **DATABASE_URL** (format: `mysql://admin:pass@host:3306/todo_app`)

### 2.3 Créer le service Node.js

1. Tableau de bord → **New +** → **Web Service**
2. Connecter votre repo GitHub
3. Configuration :
   - **Name**: `todo-list-pro-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index-render.js`
   - **Instance Type**: `Free`
   - **Region**: `Frankfurt`
4. **Environment Variables** → Ajouter :
   ```
   DATABASE_URL = mysql://admin:password@your-render-host:3306/todo_app
   JWT_SECRET = your_jwt_secret_key_here
   ADMIN_USERNAME = admin
   ADMIN_PASSWORD = your_admin_password
   NODE_ENV = production
   ```
5. Déployer

### 2.4 Vérifier la connexion

```bash
# Attendre 3-5 min que Render construise l'app
# Puis tester:
curl https://todo-list-pro-api.onrender.com/health

# Réponse attendue:
# {"status":"ok","timestamp":"2025-01-15T..."}
```

## Phase 3 : Configuration Vercel (10 minutes)

### 3.1 Mettre à jour `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "public": false,
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "destination": "https://todo-list-pro-api.onrender.com/api/$1",
      "headers": {
        "User-Agent": "FromVercel"
      }
    },
    {
      "src": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "VITE_API_URL": "https://todo-list-pro-api.onrender.com"
  }
}
```

### 3.2 Créer fichier de proxy API

Créer `vercel-api-proxy.js` à la racine du projet:

```javascript
export default function handler(req, res) {
  const renderBackend = process.env.RENDER_BACKEND_URL || 'https://todo-list-pro-api.onrender.com';
  const path = req.url.replace(/^\/api/, '');
  
  fetch(`${renderBackend}/api${path}`, {
    method: req.method,
    headers: {
      ...req.headers,
      'Authorization': req.headers.authorization || ''
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  })
    .then(r => r.json())
    .then(data => res.json(data))
    .catch(e => res.status(500).json({ error: e.message }));
}
```

### 3.3 Importer le projet dans Vercel

1. Aller sur [https://vercel.com](https://vercel.com)
2. **Import Project** → Sélectionner le repo GitHub
3. Configuration :
   - **Framework Preset**: `Vite`
   - **Build Command**: `cd client && npm run build`
   - **Output Directory**: `client/dist`
   - **Environment Variables** :
     ```
     VITE_API_URL=https://todo-list-pro-api.onrender.com
     RENDER_BACKEND_URL=https://todo-list-pro-api.onrender.com
     ```
4. Déployer

## Phase 4 : Tests (5 minutes)

### 4.1 Tester le login

```bash
FRONTEND_URL="https://your-project.vercel.app"

# Test login
curl -X POST "$FRONTEND_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Réponse attendue:
# {"token":"eyJhbGciOiJIUzI1NiIs..."}
```

### 4.2 Tester depuis le navigateur

1. Ouvrir `https://your-project.vercel.app`
2. Login avec `admin / admin123`
3. Vérifier que le dashboard charge
4. Créer une tâche → Vérifier dans Render MySQL

### 4.3 Vérifier les logs Render

```
Render Dashboard → todo-list-pro-api → Logs
```

Chercher :
- `✅ Connexion à MySQL: ...`
- `✅ Tables initialisées`
- `✅ Admin créé`

## Dépannage

### Problème: "403 Forbidden" depuis Vercel → Render

**Cause**: CORS bloqué  
**Solution**: Ajouter headers dans Render

```javascript
// Dans server/index-render.js
app.use(cors({
  origin: 'https://your-project.vercel.app',
  credentials: true
}));
```

### Problème: "Can't reach database"

**Cause**: DATABASE_URL invalide  
**Solution**: 
1. Render Dashboard → todo-list-pro-db → Connexions
2. Copier le lien MySQL (format `mysql://...`)
3. Vérifier dans "Environment Variables" qu'il est correct

### Problème: "Free instance sleeping"

**Solution**: Render hibernates free tier après inactivité. Les requêtes réveillent l'app (10-15 sec).

## Optimisations

### Ajouter un cron job pour réveiller Render

Créer `wake-render.js`:

```javascript
const https = require('https');

setInterval(() => {
  https.get('https://todo-list-pro-api.onrender.com/health', (res) => {
    console.log(`[${new Date().toISOString()}] Health check: ${res.statusCode}`);
  });
}, 600000); // 10 minutes
```

### Utiliser Redis pour le cache (optionnel)

Voir [https://render.com/docs/redis](https://render.com/docs/redis)

## Flux de déploiement complet

```bash
# 1. Push vers GitHub
git add .
git commit -m "Vercel+Render stack ready"
git push origin main

# 2. Render redéploie automatiquement

# 3. Vérifier:
curl https://todo-list-pro-api.onrender.com/health

# 4. Vercel redéploie automatiquement

# 5. Tester:
open https://your-project.vercel.app
```

## Variables d'environnement à définir

### Sur Render (Dashboard → Settings)

```
DATABASE_URL=mysql://admin:password@host:3306/todo_app
JWT_SECRET=your_random_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
NODE_ENV=production
```

### Sur Vercel (Project Settings → Environment Variables)

```
VITE_API_URL=https://todo-list-pro-api.onrender.com
RENDER_BACKEND_URL=https://todo-list-pro-api.onrender.com
```

## Ressources

- [Documentation Render](https://render.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
- [MySQL sur Render](https://render.com/docs/mysql)
- [Environment Variables sur Render](https://render.com/docs/environment-variables)
- [Environment Variables sur Vercel](https://vercel.com/docs/projects/environment-variables)

---

**Durée totale estimée**: 40 minutes  
**Coût estimé**: Gratuit (tier free)

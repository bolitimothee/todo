# 📡 Guide d'Intégration API Vercel ↔ Render

## Architecture API

```
Frontend (Vercel)
      ↓
Vercel Proxy (/api/...)
      ↓
Render Backend (Node.js Express)
      ↓
Render MySQL Database
```

## Configuration rapide

### 1. URL de base

```javascript
// Dans le frontend (React)
const API_URL = process.env.VITE_API_URL || 'https://your-render-backend.onrender.com';

// Utilisation
const login = async (username, password) => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
};
```

### 2. Endpoints disponibles

#### Authentification
```
POST   /api/login              - Connexion
GET    /api/me                 - Récupérer l'utilisateur actuel
```

#### Administration
```
POST   /api/admin/create-user  - Créer un utilisateur
GET    /api/admin/users        - Lister les utilisateurs
PATCH  /api/admin/user/:id     - Modifier un utilisateur
DELETE /api/admin/user/:id     - Supprimer un utilisateur

GET    /api/companies          - Lister les sociétés
POST   /api/companies          - Créer une société
PUT    /api/companies/:id      - Modifier une société
DELETE /api/companies/:id      - Supprimer une société
```

#### Tâches
```
GET    /api/tasks              - Lister les tâches
POST   /api/tasks              - Créer une tâche
PATCH  /api/tasks/:id/status   - Modifier le statut
DELETE /api/tasks/:id          - Supprimer une tâche
GET    /api/tasks/history      - Historique des tâches supprimées
```

#### Incidents
```
GET    /api/incidents          - Lister les incidents actifs
POST   /api/incidents          - Créer un incident
PATCH  /api/incidents/:id/resolve - Marquer comme résolu
GET    /api/incidents/resolved - Historique des incidents résolus
```

#### Santé
```
GET    /health                 - Vérifier le statut du serveur
```

### 3. Format des requêtes

```javascript
// Authentification requise
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`  // Token du login
};

// Exemple: Créer une tâche
const createTask = async (title, teamName, token) => {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title,
      team_name: teamName
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
};
```

### 4. Codes de réponse

```
200 OK              - Succès
201 Created         - Créé
400 Bad Request     - Paramètres invalides
401 Unauthorized    - Token manquant
403 Forbidden       - Accès refusé (rôle insuffisant)
404 Not Found       - Ressource non trouvée
500 Server Error    - Erreur serveur
```

### 5. Gestion des erreurs

```javascript
const handleApiError = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    
    switch (response.status) {
      case 401:
        // Token expiré → redirection login
        localStorage.removeItem('token');
        window.location.href = '/login';
        break;
      case 403:
        // Accès refusé
        console.error('Accès refusé:', error.error);
        break;
      case 404:
        // Non trouvé
        console.error('Non trouvé:', error.error);
        break;
      default:
        console.error('Erreur:', error.error);
    }
  }
  return response.json();
};
```

## Variables d'environnement

### Vercel (.env.production)
```env
VITE_API_URL=https://your-render-backend.onrender.com
VITE_APP_NAME=TO DO LIST PRO
```

### Render (.env)
```env
DATABASE_URL=mysql://admin:password@host:3306/todo_app
JWT_SECRET=your_secure_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
NODE_ENV=production
PORT=4000
```

## Tests de l'API

### Avec curl
```bash
# Health check
curl https://your-render-backend.onrender.com/health

# Login
curl -X POST https://your-render-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Utiliser le token pour les requêtes protégées
TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl https://your-render-backend.onrender.com/api/me \
  -H "Authorization: Bearer $TOKEN"
```

### Avec Node.js
```javascript
// test-api.js
const API_URL = 'https://your-render-backend.onrender.com';

async function test() {
  // 1. Health check
  console.log('Testing /health...');
  let res = await fetch(`${API_URL}/health`);
  console.log(await res.json());
  
  // 2. Login
  console.log('\nTesting /login...');
  res = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  const { token } = await res.json();
  console.log('Token:', token.substring(0, 20) + '...');
  
  // 3. Get user info
  console.log('\nTesting /me...');
  res = await fetch(`${API_URL}/api/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(await res.json());
}

test().catch(console.error);
```

## Optimisations

### 1. Cache des requêtes

```javascript
const apiCache = new Map();

async function fetchWithCache(url, options = {}, cacheTime = 5 * 60 * 1000) {
  const key = `${url}:${JSON.stringify(options)}`;
  
  if (apiCache.has(key)) {
    const { data, timestamp } = apiCache.get(key);
    if (Date.now() - timestamp < cacheTime) {
      return data;
    }
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (response.ok) {
    apiCache.set(key, { data, timestamp: Date.now() });
  }
  
  return data;
}
```

### 2. Réessai automatique

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 3. Compression des données

```javascript
// Sur Render backend
app.use(compression());

// Dans client/vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom']
        }
      }
    }
  }
};
```

## Dépannage

### L'API retourne 404

**Cause**: L'endpoint n'existe pas ou est mal orthographié  
**Solution**: Vérifier server/index-render.js pour la liste complète

### L'API retourne 403 Forbidden

**Cause**: Rôle insuffisant  
**Vérifier**:
- Vous êtes admin pour les routes /api/admin/*
- Le token est valide
- L'utilisateur n'est pas expiré

### L'API retourne 500 Server Error

**Vérifier**:
1. Les logs Render: `Render Dashboard → Logs`
2. La base de données est connectée
3. Les variables d'environnement sont définies

### Lenteur de l'API depuis Vercel

**Causes possibles**:
- Première requête réveille Render (10-15 sec)
- Pas de keep-alive entre Vercel et Render
- Base de données sur plan free

**Solutions**:
- Ajouter keep-alive dans Vercel: `headers: { 'Connection': 'keep-alive' }`
- Faire des requêtes périodiques pour réveiller Render
- Passer au plan payant sur Render

## Exemples complets

### Exemple 1: Authentification

```javascript
export async function login(username, password) {
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) throw new Error('Login failed');
  const { token } = await response.json();
  localStorage.setItem('token', token);
  return token;
}

export function getToken() {
  return localStorage.getItem('token');
}

export const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
};
```

### Exemple 2: Gestion des tâches

```javascript
export async function getTasks() {
  const response = await fetch(`${API_URL}/api/tasks`, { headers });
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export async function createTask(title, teamName) {
  const response = await fetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, team_name: teamName })
  });
  if (!response.ok) throw new Error('Failed to create task');
  return response.json();
}

export async function updateTaskStatus(id, status) {
  const response = await fetch(`${API_URL}/api/tasks/${id}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update task');
  return response.json();
}

export async function deleteTask(id) {
  const response = await fetch(`${API_URL}/api/tasks/${id}`, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) throw new Error('Failed to delete task');
  return response.json();
}
```

---

**Mise à jour**: Janvier 2025  
**Version**: 1.0  
**Compatibilité**: Vercel + Render MySQL

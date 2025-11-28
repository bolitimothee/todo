# Déploiement TO DO LIST PRO sur Vercel

## 📋 Prérequis

1. **Compte Vercel** : https://vercel.com
2. **Base de données MySQL** : 
   - PlanetScale (gratuit jusqu'à certaines limites) : https://planetscale.com
   - AWS RDS
   - DigitalOcean MySQL
   - Ou toute autre base MySQL compatible
3. **Git** configuré et repo poussé sur GitHub

## 🚀 Étapes de déploiement

### Étape 1 : Préparer la base de données

1. Créer une base MySQL externes (ex: PlanetScale)
2. Exécuter le script SQL pour créer les tables (voir `server/database.js`)
3. Noter les identifiants de connexion

### Étape 2 : Connecter le repo à Vercel

```bash
# Push le code sur GitHub
git add .
git commit -m "Préparer pour déploiement Vercel"
git push origin main

# Aller sur https://vercel.com/import
# Importer le repo GitHub
# Sélectionner le framework : "Other"
```

### Étape 3 : Configurer les variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables, ajouter :

```
MYSQL_HOST=your-mysql-host.planetscale.com
MYSQL_USER=your-user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=todopro

JWT_SECRET=un-secret-tres-long-et-securise

ADMIN_USERNAME=admin
ADMIN_PASSWORD=votre-mot-de-passe-admin

VITE_API_URL=https://votre-domaine.vercel.app
```

### Étape 4 : Déployer

```bash
# Option 1 : Via Git push
git push origin main
# → Vercel redéploiera automatiquement

# Option 2 : Via Vercel CLI
npm install -g vercel
vercel deploy --prod
```

### Étape 5 : Initialiser la base de données

Après le premier déploiement, visiter votre app :
```
https://votre-domaine.vercel.app/api/login
```

Cela initialisera automatiquement les tables MySQL et créera l'utilisateur admin.

## 📁 Structure du projet pour Vercel

```
.
├── api/
│   └── index.js              # Backend serverless (Node.js)
├── client/
│   ├── src/                  # Code React
│   ├── dist/                 # Build Vite (généré au deploy)
│   ├── public/               # Assets statiques
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── database.js           # Configuration MySQL
│   └── migrateFromJson.js    # Migration de data.json
├── vercel.json               # Configuration Vercel
├── .env.example              # Template d'env vars
└── package.json
```

## 🔧 Configuration expliquée

### vercel.json

```json
{
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"      // Backend serverless
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "client/dist"  // Build frontend
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"     // Routes /api → backend
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"   // Autres routes → frontend
    }
  ]
}
```

## 🔐 Sécurité

1. **Secrets JWT** : Générer un secret fort
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Mot de passe admin** : Changer le mot de passe par défaut

3. **CORS** : Déjà configuré pour accepter les requêtes du domaine Vercel

4. **SSL** : Vercel fournit HTTPS automatiquement

## 📊 Monitoring et logs

```bash
# Voir les logs en direct
vercel logs --tail

# Voir les builds
vercel list
```

## 🐛 Troubleshooting

### "Module not found: @vercel/node"
→ Vercel installe automatiquement. Si le problème persiste, redéployer.

### "ECONNREFUSED: Cannot connect to MySQL"
→ Vérifier les identifiants MySQL dans Environment Variables
→ Vérifier que la DB accepte les connexions externes

### "API routes retournent 404"
→ Vérifier que `vercel.json` est à la racine du repo
→ Faire un redéploiement : `vercel deploy --prod`

### "Frontend charge mais API ne répond pas"
→ En production, le proxy Vite n'existe plus
→ Les requêtes `/api` sont routées via `vercel.json`
→ Vérifier que les URLs des requêtes `/api/*` sont correctes

## 📈 Limites Vercel (tier gratuit)

- **Compute**: 100 appels/jour (serverless)
- **Build time**: 45 min
- **Storage**: Base de données externe requise

Pour augmenter les limites, passer à un plan payant.

## 🎯 Prochaines étapes

1. Configurer un domaine personnalisé
2. Mettre en place HTTPS/SSL (automatique)
3. Ajouter des monitors Vercel
4. Configurer des webhooks GitHub

## 📞 Support

- Docs Vercel : https://vercel.com/docs
- PlanetScale docs : https://docs.planetscale.com
- Issues/Discussions : Sur le repo GitHub

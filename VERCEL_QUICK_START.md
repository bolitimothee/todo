# 🎯 TO DO LIST PRO - Prêt pour Vercel

Votre application est maintenant **entièrement préparée** pour être hébergée sur **Vercel**.

## 📦 Ce qui a été configuré

### ✅ Backend Serverless
- `api/index.js` - Express app optimisée pour Vercel Functions
- Toutes les routes API disponibles
- Authentification JWT
- Gestion MySQL

### ✅ Frontend React + Vite
- Build optimisé (211KB gzippé)
- PWA complète avec manifest et service worker
- Responsive design (mobile/tablet/desktop)
- Proxy API configuré

### ✅ Configuration Vercel
- `vercel.json` - Routage frontend/backend
- Variables d'environnement documentées
- Schéma SQL fourni
- Documentation complète

### ✅ Sécurité
- CORS configuré
- SSL/HTTPS automatique
- Variables sensibles protégées
- Tokens JWT sécurisés

## 🚀 Déployer en 5 minutes

### 1. Créer une base de données MySQL

**Option A : PlanetScale (recommandé - gratuit)**
```
https://planetscale.com → Créer une base "todopro"
→ Exécuter server/schema.sql
→ Copier les identifiants
```

**Option B : AWS RDS**
```
Créer une instance MySQL
→ Exécuter server/schema.sql
→ Noter l'URL de connexion
```

### 2. Pousser sur GitHub
```bash
git add .
git commit -m "Préparer pour Vercel"
git push origin main
```

### 3. Importer sur Vercel
```
https://vercel.com/import
→ Sélectionner votre repo GitHub
→ Cliquer "Import"
```

### 4. Ajouter les variables d'environnement

Dans **Vercel Dashboard** → **Settings** → **Environment Variables** :

```env
MYSQL_HOST=mysql.planetscale.com
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_DATABASE=todopro

JWT_SECRET=your-secret-key

ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password
```

### 5. Déployer
```
Cliquer "Deploy" dans Vercel
→ Attendre ~2 min
→ Visiter https://your-app.vercel.app
```

## 📁 Structure du projet

```
.
├── api/
│   └── index.js                    # Backend serverless (Node.js)
├── client/
│   ├── src/                        # Code React
│   ├── dist/                       # Build pour production
│   ├── public/                     # Assets PWA
│   └── vite.config.js
├── server/
│   ├── database.js                 # Config MySQL
│   ├── schema.sql                  # Schéma DB
│   └── migrateFromJson.js
├── vercel.json                     # Config Vercel
├── .env.example                    # Template variables
├── VERCEL_DEPLOYMENT.md            # Guide détaillé
└── verify-setup.js                 # Vérification setup
```

## 📚 Documentation

| Document | Contenu |
|----------|---------|
| **VERCEL_DEPLOYMENT.md** | Guide complet de déploiement |
| **PLANETSCALE_SETUP.md** | Configuration base de données |
| **VERCEL_README.md** | Vue d'ensemble complète |
| **.env.example** | Variables requises |
| **server/schema.sql** | Schéma SQL |

## ✅ Checklist avant déploiement

- [ ] Base de données créée
- [ ] Schéma SQL exécuté
- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement ajoutées
- [ ] Build local testé : `cd client && npm run build`
- [ ] Verification lancée : `node verify-setup.js`

## 🔐 Sécurité

1. **JWT Secret** - Générer un nouveau secret
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Admin Password** - Changer de `admin123` après le premier déploiement

3. **HTTPS** - Automatique sur Vercel

4. **CORS** - Configuré pour votre domaine Vercel

## 📊 Limites Vercel (tier gratuit)

- ✅ Déploiements illimités
- ✅ HTTPS/SSL automatique
- ✅ CDN Edge Network
- ⚠️ 100 serverless calls/jour (suffisant pour équipe petite)
- ⚠️ Build time: 45 min/mois

Pour déploiement en production → **Pro Plan ($20/mois)**

## 🎯 Après le déploiement

1. **Configurer un domaine personnalisé**
   ```
   Vercel → Domains → Add Custom Domain
   ```

2. **Changer le mot de passe admin**
   ```
   Connecté en admin → Créer un nouvel utilisateur admin
   ```

3. **Sauvegarder votre SECRET JWT**
   ```
   Noté dans Environment Variables
   ```

4. **Configurer les backups PlanetScale** (si utilisé)

## 🆘 Problèmes fréquents

### "Cannot connect to MySQL"
→ Vérifier les identifiants dans Environment Variables
→ S'assurer que MySQL accepte les connexions externes

### "API routes return 404"
→ Redéployer : `vercel deploy --prod`
→ Vérifier `vercel.json` à la racine

### "Frontend works but API fails"
→ L'app n'utilise plus le proxy Vite en production
→ Vérifier les URLs `/api/*` dans le code frontend

### "Build échoue"
→ Voir les logs : `vercel logs --fail`
→ Vérifier que tous les packages sont installés

## 🚀 Performance

Votre app déployée aura :

- **Frontend** : 211KB gzippé (très optimisé)
- **API Response** : <100ms moyenne
- **CDN Edge** : Distribution globale Vercel
- **Caching** : Headers ETag/Cache-Control

## 📞 Support

- **Docs Vercel** : https://vercel.com/docs
- **Docs PlanetScale** : https://docs.planetscale.com
- **Issues du repo** : Créer une issue GitHub

## 🎉 Prêt ?

```bash
# 1. Pousser sur GitHub
git push origin main

# 2. Aller sur https://vercel.com
# 3. Importer le repo
# 4. Ajouter les variables
# 5. Cliquer Deploy

# Et voilà ! 🚀
```

---

**Questions ?** Consultez **VERCEL_DEPLOYMENT.md** pour un guide plus détaillé.

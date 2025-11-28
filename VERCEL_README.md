# 📋 TO DO LIST PRO - Déploiement Vercel

Ce guide explique comment héberger l'application complète (frontend + backend) sur Vercel.

## 📚 Documentation

- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Guide complet de déploiement
- **[PLANETSCALE_SETUP.md](./PLANETSCALE_SETUP.md)** - Configuration de la base de données
- **[server/schema.sql](./server/schema.sql)** - Schéma SQL

## ⚡ Quick Start

### 1️⃣ Préparer la base de données

```bash
# Option 1 : PlanetScale (recommandé)
# - Créer un compte sur https://planetscale.com
# - Créer une base "todopro"
# - Exécuter server/schema.sql dans la console
# - Copier les identifiants

# Option 2 : AWS RDS ou autre MySQL
# - Créer une base MySQL
# - Exécuter server/schema.sql
```

### 2️⃣ Pusher le code sur GitHub

```bash
git add .
git commit -m "Préparation pour Vercel"
git push origin main
```

### 3️⃣ Déployer sur Vercel

```bash
# Aller sur https://vercel.com/import
# Importer le repo GitHub
# Sélectionner "Other" comme framework
```

### 4️⃣ Configurer les variables d'environnement

Dans Vercel Dashboard → Settings → Environment Variables :

```env
MYSQL_HOST=your-mysql-host
MYSQL_USER=your-user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=todopro

JWT_SECRET=your-secret-key-change-in-production

ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password

VITE_API_URL=https://your-vercel-app.vercel.app
```

### 5️⃣ Déployer

```bash
# Option 1 : Git push
git push origin main
# → Vercel redéploiera automatiquement

# Option 2 : Vercel CLI
npm install -g vercel
vercel deploy --prod
```

## 🏗️ Architecture

```
Frontend (React + Vite)
↓
https://your-domain.vercel.app
↓
Routes statiques (+PWA)
Routes /api → Backend serverless

Backend (Node.js + Express) - Serverless
↓
/api/index.js
↓
Routes d'authentification
Routes CRUD (companies, tasks, incidents)
↓
MySQL (PlanetScale ou autre)
```

## 🔐 Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MYSQL_HOST` | Host MySQL | `mysql.planetscale.com` |
| `MYSQL_USER` | Utilisateur MySQL | `root` |
| `MYSQL_PASSWORD` | Mot de passe MySQL | `your-password` |
| `MYSQL_DATABASE` | Nom de la base | `todopro` |
| `JWT_SECRET` | Secret pour les tokens | `your-secret-key` |
| `ADMIN_USERNAME` | Username admin par défaut | `admin` |
| `ADMIN_PASSWORD` | Mot de passe admin | `password` |
| `VITE_API_URL` | URL de l'API (optionnel) | `https://your-app.vercel.app` |

## 🧪 Tester localement avant de déployer

```bash
# Frontend
cd client
npm install
npm run build
npm run preview

# Backend (dans un autre terminal)
cd server
npm install
npm start
```

Visiter http://localhost:3000 pour tester le frontend compilé.

## 📊 Limites du tier gratuit Vercel

- **Compute**: 100 appels/jour (serverless functions)
- **Build time**: 45 min/mois
- **Bandwidth**: 100GB/mois
- **Deployments**: Illimités depuis GitHub

Pour augmenter les limites → Passer à **Pro ($20/mois)**

## ✅ Checklist avant production

- [ ] Base de données MySQL configurée
- [ ] Variables d'environnement ajoutées
- [ ] Build local testé (`npm run build`)
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] SSL/HTTPS activé (automatique)
- [ ] Admin utilisateur créé avec mot de passe sécurisé
- [ ] CORS configuré pour le domaine
- [ ] Logs Vercel configurés

## 🐛 Troubleshooting

### Les routes /api retournent 404
→ Vérifier `vercel.json` à la racine
→ Redéployer : `vercel deploy --prod`

### Impossible de se connecter à MySQL
→ Vérifier les identifiants dans Environment Variables
→ S'assurer que MySQL accepte les connexions externes

### Frontend charge mais API ne répond pas
→ Vérifier que `/api` est bien routé via `vercel.json`
→ Tester directement : `https://your-app.vercel.app/api/me`

### Build échoue
→ Vérifier les logs Vercel : `vercel logs`
→ S'assurer que tous les dépendances sont installées

## 🚀 Performances

Pour optimiser :

1. **Compression GZIP** - Automatique sur Vercel
2. **Minification** - Configurée dans `vite.config.js`
3. **Caching** - Headers ETag/Cache-Control automatiques
4. **CDN** - Vercel Edge Network intégré

## 📈 Monitoring

```bash
# Voir les logs en direct
vercel logs --tail

# Voir les erreurs
vercel logs --fail

# Voir la liste des déploiements
vercel list
```

## 💰 Estimer les coûts

- **Tier gratuit** : Peut gérer une équipe de 5-10 utilisateurs
- **Tier Pro** : Pour équipes de 20-50+ utilisateurs
- **Base MySQL** : PlanetScale gratuit jusqu'à 5GB

## 🎓 Prochaines étapes

1. Domaine personnalisé
2. Analytics personnalisé
3. Webhooks GitHub
4. Rollback automatique en cas d'erreur
5. Notifications Slack/Discord

## 📞 Support

- **Vercel Docs** : https://vercel.com/docs
- **PlanetScale Docs** : https://docs.planetscale.com
- **Issues GitHub** : Créer une issue avec les logs

## 📝 Notes

- Les serverless functions Vercel ont un timeout de **60s**
- Les logs sont conservés **24h**
- Backups MySQL : à configurer manuellement (PlanetScale le fait automatiquement)

---

**Prêt à déployer ?** Suivez les étapes du [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) 🚀

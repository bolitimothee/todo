# 🚀 Commandes courantes - Cheat Sheet

## 🚀 Démarrage

### Frontend (Vercel - dev local)
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

### Backend (Render - dev local)
```bash
cd server
npm install
node index-render.js
# → http://localhost:4000
```

### Full stack (terminal split)
```bash
# Terminal 1
cd client && npm run dev

# Terminal 2
cd server && npm install && node index-render.js
```

---

## 🔧 Vérification

### Vérifier config Render
```bash
node verify-vercel-render.js
```

### Vérifier config Vercel (ancien)
```bash
node verify-setup.js
```

### Tester backend local
```bash
node test-render-backend.js
```

---

## 🌐 API Requests

### Health check
```bash
curl http://localhost:4000/health
```

### Login
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get user (avec token)
```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."
curl http://localhost:4000/api/me \
  -H "Authorization: Bearer $TOKEN"
```

### Get tasks
```bash
curl http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

### Create task
```bash
curl -X POST http://localhost:4000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My task","team_name":"Team A"}'
```

---

## 📦 Build

### Frontend build
```bash
cd client
npm run build
# → client/dist/
```

### Backend - pas de build (Node.js)
```bash
# C'est du JavaScript direct, pas besoin de build
# Juste: npm install
cd server
npm install
```

---

## 🗄️ Base de données

### MySQL local (dev)
```bash
# Créer la database
mysql -u root -p -e "CREATE DATABASE todo_app;"

# Importer le schema
mysql -u root -p todo_app < server/schema.sql

# Voir les tables
mysql -u root -p -e "USE todo_app; SHOW TABLES;"
```

### MySQL Render (prod)
```bash
# Connection string est dans le Dashboard
mysql -h your-render-host -u admin -p todo_app
```

---

## 📝 Fichiers d'env

### Copier template
```bash
# Pour server
cp .env.example server/.env

# Éditer avec vos credentials
nano server/.env
```

### Format Render
```env
DATABASE_URL=mysql://admin:PASSWORD@hostname:3306/todo_app
JWT_SECRET=your-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
NODE_ENV=production
```

### Format local
```env
MYSQL_HOST=127.0.0.1
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=todo_app
MYSQL_PORT=3306
JWT_SECRET=your-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
NODE_ENV=development
```

---

## 🚀 Déploiement

### 1️⃣ Push vers GitHub
```bash
git add .
git commit -m "Ready for Vercel+Render"
git push origin main
```

### 2️⃣ Déployer sur Render
```bash
# Manuel (via Dashboard)
# ou
# Auto (si GitHub connecté)
```

### 3️⃣ Déployer sur Vercel
```bash
# Manuel (via Dashboard)
# ou
# Auto (si GitHub connecté)
```

---

## 🧹 Nettoyage

### Supprimer node_modules
```bash
# Frontend
cd client && rm -r node_modules

# Backend
cd server && rm -r node_modules
```

### Réinstaller from scratch
```bash
# Frontend
cd client && rm -r node_modules && npm install

# Backend
cd server && rm -r node_modules && npm install
```

### Nettoyer les logs
```bash
# Supprimer tous les .log
find . -name "*.log" -delete
```

---

## 🐛 Debugging

### Voir les logs Vercel
```bash
# CLI Vercel
vercel logs
```

### Voir les logs Render
```bash
# Via Dashboard → Service → Logs
# Ou CLI si connecté
```

### MySQL debug
```bash
# Test connection
mysql -h your-host -u root -p

# Check tables
SHOW TABLES;
DESC users;
SELECT COUNT(*) FROM users;
```

### Express debug
```bash
# Dans server/index-render.js, ajouter:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

---

## 📊 Monitoring

### Vérifier l'uptime Render
```bash
# Health check chaque 10 min
for i in {1..12}; do
  curl https://your-render-app.onrender.com/health
  sleep 600
done
```

### Voir les stats Vercel
```bash
# Dashboard → Analytics
```

### MySQL stats
```bash
# Connexion MySQL
SHOW STATUS LIKE '%';
SHOW VARIABLES LIKE 'max_connections';
```

---

## 🔐 Secrets et credentials

### Voir les secrets Render
```bash
# Via Dashboard → Environment
```

### Voir les secrets Vercel
```bash
# Via Dashboard → Settings → Environment Variables
```

### Ne JAMAIS pusher
```bash
# Ces fichiers sont .gitignore'd:
.env              ← LOCAL credentials
server/.env       ← LOCAL MySQL password
node_modules/     ← Dependencies
dist/            ← Build output
```

---

## 🆘 Troubleshooting rapide

### Erreur: "Cannot find module"
```bash
# Solution: réinstaller
npm install
```

### Erreur: "ECONNREFUSED" (base de données)
```bash
# Vérifier MySQL est running
# Vérifier DATABASE_URL or MYSQL_HOST
# Vérifier password
```

### Erreur: "PORT already in use"
```bash
# Trouver qui utilise le port
lsof -i :4000

# Tuer le process
kill -9 <PID>

# Ou utiliser un autre port
PORT=5000 node server/index-render.js
```

### Erreur: "403 Forbidden" depuis API
```bash
# Vérifier role de l'utilisateur
# Vérifier token n'est pas expiré
# Admin routes nécessitent role: 'admin'
```

### Frontend blanc (rien n'affiche)
```bash
# Vérifier npm run build
# Vérifier dist/ existe
# Vérifier index.html est en place
```

---

## 🔄 Workflows courants

### Ajouter un nouvel endpoint
```bash
# 1. Éditer server/index-render.js
# 2. Ajouter app.post('/api/new-endpoint', ...)
# 3. Test local: curl http://localhost:4000/api/new-endpoint
# 4. Commit et push
# 5. Render redéploie auto
```

### Fixer une variable d'env
```bash
# 1. Render Dashboard → Service → Environment
# 2. Modifier la variable
# 3. Sauvegarder
# 4. Service redémarre auto
```

### Réinitialiser la base de données
```bash
# 1. Supprimer la database Render
# 2. Créer nouvelle database
# 3. DATABASE_URL mettra à jour
# 4. Service redémarre
# 5. Tables créées auto
# 6. Admin créé auto
```

### Déployer une correction
```bash
git add .
git commit -m "Fix: description"
git push origin main
# Vercel + Render redéploient auto
```

### Rollback à version précédente
```bash
# Vercel: Dashboard → Deployments → Cliquer version
# Render: Dashboard → Deploys → Cliquer version
```

---

## 📱 Tests depuis le téléphone

### Accédez via IP locale
```bash
# Sur votre machine, trouver IP:
ipconfig getifaddr en0  # Mac
ipconfig              # Windows

# Depuis le téléphone (même WiFi):
http://192.168.1.100:3000  # Frontend
http://192.168.1.100:4000  # Backend
```

### Ou accédez en production
```bash
# Une fois déployé:
https://your-app.vercel.app
https://your-backend.onrender.com
```

---

## 🎯 Checklists rapides

### Avant de déployer
- [ ] `npm install` dans server/ ET client/
- [ ] `npm run build` en client/
- [ ] `node verify-vercel-render.js` → 8/8
- [ ] `git status` → rien en staging
- [ ] `.env` created et completé
- [ ] Variables d'env dans Render/Vercel Dashboard

### Après déploiement
- [ ] Health check passe
- [ ] Login fonctionne
- [ ] Créer tâche fonctionne
- [ ] Vérifier dans MySQL
- [ ] Logs Render ne montrent pas d'erreurs
- [ ] Responsive design OK

### Pour la production
- [ ] JWT_SECRET est long et aléatoire
- [ ] ADMIN_PASSWORD est fort
- [ ] DATABASE_URL ne contient pas le password
- [ ] Cronjob réveille Render chaque 10 min
- [ ] Backups MySQL configurés
- [ ] Monitoring activé

---

## 🔗 Ressources rapides

```bash
# Ouvrir docs
open https://render.com/docs
open https://vercel.com/docs
open https://nodejs.org/docs

# Ouvrir dashboards
open https://render.com
open https://vercel.com

# Vérifier status
curl https://status.render.com
curl https://www.vercel-status.com
```

---

## 📞 Commandes avancées

### Backup MySQL
```bash
mysqldump -h host -u admin -p todo_app > backup.sql
```

### Restore MySQL
```bash
mysql -h host -u admin -p todo_app < backup.sql
```

### SSH sur Render (si disponible)
```bash
render ssh todo-list-api
```

### Logs en temps réel
```bash
# Sur le service Render
tail -f /var/log/app.log
```

---

**Dernière mise à jour**: Janvier 2025  
**Compatibilité**: Node.js 18+, MySQL 8.0+  
**Format**: Bash (PowerShell compatible)

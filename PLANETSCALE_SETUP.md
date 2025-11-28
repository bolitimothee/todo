# Configuration PlanetScale pour Vercel

## 🔧 Créer une base PlanetScale

### Étape 1 : S'inscrire
- Aller sur https://planetscale.com
- S'inscrire avec GitHub

### Étape 2 : Créer une base
1. Cliquer sur "Create a new database"
2. Nommer la base : `todopro`
3. Régions recommandées : US East (proche de Vercel)
4. Cliquer "Create database"

### Étape 3 : Exécuter le schéma SQL
1. Aller dans l'onglet "Console"
2. Copier le contenu de `server/schema.sql`
3. Coller et exécuter dans la console

### Étape 4 : Récupérer les identifiants de connexion
1. Aller dans "Branches"
2. Sélectionner "main"
3. Cliquer sur "Connect"
4. Choisir "Node.js"
5. Copier la CONNECTION STRING

La chaîne ressemblera à :
```
mysql://user:password@host/database?ssl={"rejectUnauthorized":true}
```

### Étape 5 : Ajouter à Vercel
Dans Vercel Environment Variables, ajouter :
```
MYSQL_HOST=host (extraire de la connection string)
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_DATABASE=database
```

## ✅ Avantages PlanetScale

- ✅ Gratuit (jusqu'à 5GB)
- ✅ MySQL 8.0 compatible
- ✅ SSL/TLS par défaut
- ✅ Backups automatiques
- ✅ Déjà intégré à Vercel

## 🔐 Sécurité PlanetScale

- Chaque branche a ses propres identifiants
- Activer les "Webhooks" pour les déploiements
- Utiliser les "Deploy requests" pour les migrations

## 📊 Monitoring

Dans PlanetScale Dashboard :
- Voir l'utilisation CPU/RAM
- Consulter les logs de requêtes
- Analyser les performances

## 💡 Alternative : AWS RDS

Si vous préférez AWS :
```
MYSQL_HOST=your-rds-instance.amazonaws.com
MYSQL_USER=admin
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=todopro
```

Assurez-vous que le RDS accepte les connexions externes depuis Vercel IPs.

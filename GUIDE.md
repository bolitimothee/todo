# GUIDE de lancement rapide et script pour une courte vidéo de démonstration

## Lancement local (pas à pas)
1. Ouvrir un terminal et lancer le backend :
```powershell
cd server; npm install
# Option A: Utiliser PostgreSQL (recommandé)
# - Configurez la variable d'environnement DATABASE_URL ou PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT
setx DATABASE_URL "postgres://user:pass@localhost:5432/todo_app"
node index.js

# Option B: Utiliser MySQL (héritage)
# - Configurez MYSQL_HOST/ MYSQL_USER / MYSQL_PASSWORD / MYSQL_DATABASE si nécessaire
# - Le comportement par défaut reste compatible avec MySQL si ces variables sont définies
```
Le serveur démarre sur `http://localhost:4000`.

2. Ouvrir un autre terminal et lancer le frontend :
```bash
cd client
npm install
npm run dev
```
Ouvrir l'URL indiquée par Vite (souvent `http://localhost:5173`).

3. Se connecter avec l'admin :
- username: `admin`
- password: `admin123`
(Changer le mot de passe dans `server/.env` ensuite)

4. Créer une société, un manager et une équipe via l'interface Admin.
5. Se connecter avec le manager (ou créer un compte équipe) et tester la création et le suivi des tâches.

## Script bref pour enregistrer une courte vidéo de démonstration (1.5 - 3 minutes)
- Introduction (10-15s) : "Bonjour — voici TO DO LIST PRO, prototype de gestion des tâches."
- Montrer la connexion en admin (10s).
- Créer une société et un manager (20-30s).
- Se déconnecter, se reconnecter en manager, créer une tâche pour l'équipe (20-30s).
- Se connecter en équipe, marquer la tâche "en cours" puis "effectuée" et signaler un incident (30s).
- Conclure (10s) : "C'est un prototype. Toutes les étapes et le code sont dans le repo. Pour déployer, pensez à sécuriser les secrets."

- Backend : Node.js + Express, compatible MySQL et PostgreSQL (via `mysql2` et `pg`)
- Frontend : React + Vite + react-router-dom
- Auth : JWT (vérification côté serveur). Le client décode le token pour la redirection uniquement.


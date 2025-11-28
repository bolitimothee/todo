# TO DO LIST PRO - Version pédagogique FR (version44)

Ce projet est un prototype **simple et commenté en français** pour apprendre et utiliser
une application de gestion de tâches (Admin / Manager / Équipe).

IMPORTANT : ce projet est un prototype pédagogique. Avant toute utilisation réelle, applique
les bonnes pratiques de sécurité (changer JWT_SECRET, utiliser HTTPS, mot de passe fort, etc.).

---

## Contenu du ZIP
- `server/` : backend Node.js (Express) avec SQLite (better-sqlite3)
  - `index.js` : serveur et routes (commenté en français)
  - `package.json` : dépendances
  - `.env` : variables d'environnement (admin par défaut)
- `client/` : frontend React (Vite)
  - `src/` : composants React commentés en français (Login, Admin, Manager, Team)
  - `package.json` : dépendances frontend

---

## Accès administrateur par défaut
- **username:** `admin`
- **password:** `admin123`
(Changer dans `server/.env` avant de déployer)

---

## Lancer le projet en local (pas à pas)
### 1) Lancer le backend
```bash
cd server
npm install
# Puis lancer :
node index.js
# ou en dev avec nodemon :
# npx nodemon index.js
```
Le serveur écoute par défaut sur `http://localhost:4000`. Il créera automatiquement `data.db` (SQLite).

### 2) Lancer le frontend
```bash
cd client
npm install
npm run dev
```
Ouvre l'URL indiquée par Vite (généralement `http://localhost:5173`).

---

## Fonctionnement par rôle (résumé simple)
- **Admin** : crée des sociétés, crée/supprime des utilisateurs (managers/team). Gère la validité des comptes.
- **Manager** : créé des tâches pour une société et (optionnellement) pour une équipe. Voit la liste des tâches.
- **Équipe** : voit les tâches assignées et met à jour leur statut. Peut signaler des incidents.

---

## Pour aller plus loin (suggestions)
- Ajouter un routage (React Router) et redirections automatiques selon le rôle
- Ajouter une page d'édition d'utilisateur (changer mot de passe / validité)
- Ajouter des tests automatiques et des validations côté serveur
- Dockeriser l'application pour faciliter le déploiement
- Remplacer SQLite par Postgres ou MySQL pour production

---

Si tu veux, je peux :
- Ajouter le routage et la redirection automatique selon le rôle, ou
- Dockeriser le projet, ou
- Ajouter une interface d'édition des utilisateurs.

Dis-moi la prochaine étape souhaitée.


## Nouvelles fonctionnalités ajoutées
- Edition d'un utilisateur par l'admin (changer mot de passe et date de validité) via une interface dédiée.
- Routage avec React Router et redirections automatiques selon le rôle après connexion.
- GUIDE.md inclus : pas-à-pas de lancement et script pour une courte vidéo de démonstration.

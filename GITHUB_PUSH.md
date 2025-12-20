# 📤 Pousser ton code sur GitHub

## Étapes pour pousser sur GitHub

### 1️⃣ Créer un repo sur GitHub

1. Aller sur https://github.com/new
2. Remplir les champs :
   - **Repository name** : `to-do-list-pro-fr` (ou un autre nom)
   - **Description** : `TO DO LIST PRO - Application de gestion de tâches - Prêt pour Vercel`
   - **Public** ou **Private** : À ton choix
   - Ne pas initialiser avec README, .gitignore, ou license
3. Cliquer **"Create repository"**

### 2️⃣ Connecter ton repo local à GitHub

Copier et exécuter cette commande dans PowerShell :

```powershell
cd "c:\Users\Boli\Desktop\TO_DO_LIST_PRO_FR_version44"
git remote add origin https://github.com/VOTRE_USERNAME/to-do-list-pro-fr.git
git branch -M main
git push -u origin main
```

**Remplace `VOTRE_USERNAME` par ton username GitHub !**

### 3️⃣ Authentifier avec GitHub

Quand Git demande ton mot de passe :
- Utiliser un **Personal Access Token** (PAT) au lieu de ton mot de passe
- Créer un PAT : https://github.com/settings/tokens/new
  - Cocher : `repo`, `workflow`, `write:packages`
  - Copier le token
  - L'utiliser comme mot de passe quand Git le demande

OU utiliser **GitHub CLI** :
```powershell
# Installer GitHub CLI
choco install gh

# Authentifier
gh auth login

# Pousser avec GH CLI
gh repo create to-do-list-pro-fr --source=. --remote=origin --push
```

### 4️⃣ Vérifier le push

Aller sur https://github.com/VOTRE_USERNAME/to-do-list-pro-fr

Tu devrais voir :
- ✅ Tous les fichiers poussés
- ✅ Commit initial visible
- ✅ 50 fichiers, 10k+ lignes

## ✅ Après le push

Ton repo est prêt pour Vercel !

```
1. Aller sur https://vercel.com/import
2. Sélectionner "Import Git Repository"
3. Autoriser Vercel à accéder à GitHub
4. Sélectionner le repo "to-do-list-pro-fr"
5. Configurer les variables d'environnement
6. Cliquer "Deploy"
```

## 🔑 Variables d'environnement pour Vercel

Après import sur Vercel, ajouter dans **Settings → Environment Variables** :

```
MYSQL_HOST=your-mysql-host.com
MYSQL_USER=your-user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=todopro

JWT_SECRET=your-secret-key

ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password

VITE_API_URL=https://your-app.vercel.app
```

## 🐛 Troubleshooting

### "fatal: not a git repository"
→ Tu es dans le bon dossier ? `cd "c:\Users\Boli\Desktop\TO_DO_LIST_PRO_FR_version44"`

### "permission denied (publickey)"
→ Utiliser un Personal Access Token au lieu du mot de passe

### "The remote origin already exists"
→ `git remote remove origin` puis réessayer

### Push bloqué
→ Vérifier que le repo GitHub est vide (pas d'initialisation)
→ Ou utiliser `git push -u origin main --force`

## 💡 Commandes utiles

```powershell
# Voir le status
git status

# Voir le remote
git remote -v

# Faire un commit supplémentaire
git add .
git commit -m "Description du changement"
git push

# Voir l'historique
git log --oneline
```

---

**Prêt ?** Crée le repo GitHub et exécute les commandes ci-dessus ! 🚀

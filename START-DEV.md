# TO_DO_LIST_PRO - Guide de Démarrage

## Démarrage rapide

Il y a 3 façons de lancer le serveur de développement:

### Option 1: Démarrage simplifié (recommandé pour déboguer)
```bash
cd client
npm run dev
```
Lance Vite normalement (adresses visibles dans la console, mais ports peut-être bloqués).

### Option 2: Démarrage avec automatisation du pare-feu (Windows)

**Méthode A - Via script batch (plus simple):**
1. Double-cliquez sur `client/start-dev-firewall.bat`
   - Le script demande l'élévation admin
   - Les ports 3000 et 4000 sont ouverts automatiquement
   - Vite démarre ensuite

**Méthode B - Via npm (depuis PowerShell):**
```powershell
cd client
npm run dev:firewall
```

### Option 3: Ouverture manuelle du pare-feu
Si vous préférez contrôler manuellement:
```powershell
# En tant qu'administrateur:
powershell -ExecutionPolicy Bypass -File "scripts/open-firewall.ps1"
```
Puis lancez Vite normalement:
```bash
npm run dev
```

---

## Accès depuis autres appareils

Une fois le serveur lancé, vous verrez:
```
Local:   http://localhost:3000/
Network: http://172.20.10.X:3000/
```

### Pour accéder depuis téléphone/tablette:
1. **Connectez l'appareil à la même Wi-Fi** que votre ordinateur
2. **Ouvrez un navigateur** sur cet appareil
3. **Entrez l'adresse réseau** (ex: `http://172.20.10.6:3000/`)
4. ✅ L'application doit maintenant être accessible

### Si cela ne fonctionne pas:
- ✓ Vérifiez que les 2 appareils sont sur le même réseau Wi-Fi
- ✓ Assurez-vous que les ports 3000 et 4000 sont ouverts (utilisez le script batch ou PowerShell)
- ✓ Vérifiez votre pare-feu antivirus personnel (pas seulement Windows Firewall)

---

## Architecture du démarrage

```
start-dev-firewall.bat
  ├─ Demande élévation admin
  ├─ Exécute: open-firewall.ps1
  │   ├─ Crée règle: TO_DO_LIST_PRO_3000 (Frontend)
  │   └─ Crée règle: TO_DO_LIST_PRO_4000 (Backend)
  └─ Lance: npm run dev
      └─ Vite démarre sur http://0.0.0.0:3000
```

---

## Notes techniques

- **Ports configurés**: 
  - 3000: Vite Frontend Dev Server
  - 4000: Backend API Node.js
- **Plateforme**: Scripts Windows PowerShell/Batch (adaptables pour Mac/Linux)
- **Admin requis**: Oui, pour créer les règles pare-feu
- **Idempotent**: Le script vérifie si les règles existent avant de les créer

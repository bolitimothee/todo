#!/bin/bash
# Script pour tester localement le build Vercel

echo "🔨 Construction du frontend..."
cd client
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du build frontend"
  exit 1
fi

echo "✅ Frontend build réussi"

echo ""
echo "🚀 Tests locaux"
echo "1. Vérifier que api/index.js existe"
ls -la ../api/index.js

echo ""
echo "2. Vérifier la structure du projet"
echo "api/:"
ls -la ../api/
echo ""
echo "client/dist/:"
ls -la dist/ | head -10

echo ""
echo "✅ Build préparé pour Vercel"
echo ""
echo "Prochaines étapes:"
echo "1. Commit et push sur GitHub"
echo "2. Connecter le repo à Vercel"
echo "3. Ajouter les variables d'environnement"
echo "4. Vercel redéploiera automatiquement"

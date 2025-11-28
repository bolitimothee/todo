/**
 * Test pour vérifier que l'app est prête pour Vercel
 * Exécuter : node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Vercel...\n');

const checks = [
  {
    name: 'Fichier vercel.json existe',
    file: 'vercel.json',
    required: true
  },
  {
    name: 'Backend serverless (api/index.js)',
    file: 'api/index.js',
    required: true
  },
  {
    name: 'Frontend package.json',
    file: 'client/package.json',
    required: true
  },
  {
    name: 'Schema SQL',
    file: 'server/schema.sql',
    required: true
  },
  {
    name: 'Configuration .env.example',
    file: '.env.example',
    required: false
  },
  {
    name: 'Documentation VERCEL_DEPLOYMENT.md',
    file: 'VERCEL_DEPLOYMENT.md',
    required: false
  }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
  const filePath = path.join(__dirname, check.file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`✅ ${check.name}`);
    passed++;
  } else {
    const status = check.required ? '❌' : '⚠️';
    console.log(`${status} ${check.name} - ${check.file} non trouvé`);
    if (check.required) failed++;
  }
});

console.log(`\n📊 Résultat: ${passed}/${checks.length} vérifications réussies`);

if (failed === 0) {
  console.log('\n✅ Tout est prêt pour Vercel!');
  console.log('\nProchaines étapes:');
  console.log('1. git add .');
  console.log('2. git commit -m "Préparer pour Vercel"');
  console.log('3. git push origin main');
  console.log('4. Aller sur https://vercel.com/import');
  console.log('5. Importer le repo GitHub');
  console.log('6. Ajouter les variables d\'environnement');
  console.log('7. Cliquer "Deploy"');
} else {
  console.log(`\n❌ ${failed} fichier(s) manquant(s). Veuillez corriger.`);
  process.exit(1);
}

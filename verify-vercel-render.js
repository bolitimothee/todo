#!/usr/bin/env node

/**
 * Vérificateur de compatibilité Vercel+Render
 * Usage: node verify-vercel-render.js
 */

const fs = require('fs');
const path = require('path');

const checks = [];

console.log('\n🔍 Vérification Vercel + Render Stack\n');

// 1. Vérifier render.yaml
const renderYamlExists = fs.existsSync(path.join(__dirname, 'render.yaml'));
checks.push({
  name: 'render.yaml exists',
  status: renderYamlExists,
  path: 'render.yaml'
});

// 2. Vérifier server/index-render.js
const indexRenderExists = fs.existsSync(path.join(__dirname, 'server', 'index-render.js'));
checks.push({
  name: 'server/index-render.js exists',
  status: indexRenderExists,
  path: 'server/index-render.js'
});

// 3. Vérifier vercel.json mise à jour
const vercelJsonPath = path.join(__dirname, 'vercel.json');
const vercelExists = fs.existsSync(vercelJsonPath);
let hasApiProxy = false;
if (vercelExists) {
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  hasApiProxy = vercelJson.routes && vercelJson.routes.some(r => r.src === '/api/(.*)');
}
checks.push({
  name: 'vercel.json has /api routes',
  status: hasApiProxy,
  path: 'vercel.json'
});

// 4. Vérifier package.json dependencies
const packageJsonPath = path.join(__dirname, 'server', 'package.json');
let hasRequiredDeps = false;
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  hasRequiredDeps = deps.mysql2 && deps.express && deps.cors && deps.bcryptjs && deps.jsonwebtoken;
}
checks.push({
  name: 'Required npm packages installed',
  status: hasRequiredDeps,
  path: 'server/package.json'
});

// 5. Vérifier .env.example
const envExampleExists = fs.existsSync(path.join(__dirname, '.env.example'));
checks.push({
  name: '.env.example exists',
  status: envExampleExists,
  path: '.env.example'
});

// 6. Vérifier documentation
const docExists = fs.existsSync(path.join(__dirname, 'VERCEL_RENDER_DEPLOYMENT.md'));
checks.push({
  name: 'VERCEL_RENDER_DEPLOYMENT.md exists',
  status: docExists,
  path: 'VERCEL_RENDER_DEPLOYMENT.md'
});

// 7. Vérifier que frontend build existe
const distExists = fs.existsSync(path.join(__dirname, 'client', 'dist'));
checks.push({
  name: 'client/dist built',
  status: distExists,
  path: 'client/dist'
});

// 8. Vérifier Git
const gitExists = fs.existsSync(path.join(__dirname, '.git'));
checks.push({
  name: 'Git repository initialized',
  status: gitExists,
  path: '.git'
});

// Afficher les résultats
console.log('┌─────────────────────────────────────────────────────┐');
checks.forEach((check, i) => {
  const status = check.status ? '✅' : '❌';
  const num = i + 1;
  console.log(`│ ${num}. ${status} ${check.name.padEnd(40)} │`);
  console.log(`│    📁 ${check.path.padEnd(45)} │`);
});
console.log('└─────────────────────────────────────────────────────┘');

const allPass = checks.every(c => c.status);
const passCount = checks.filter(c => c.status).length;

console.log(`\n📊 Résultats: ${passCount}/${checks.length} vérifications passées\n`);

if (allPass) {
  console.log('✅ Tous les fichiers sont prêts pour Vercel + Render!\n');
  console.log('📝 Prochaines étapes:');
  console.log('  1. Créer un compte Render: https://render.com');
  console.log('  2. Créer une base de données MySQL sur Render');
  console.log('  3. Créer un service Web Node.js sur Render');
  console.log('  4. Importer le projet dans Vercel: https://vercel.com');
  console.log('  5. Configurer les variables d\'environnement');
  console.log('  6. Consulter VERCEL_RENDER_DEPLOYMENT.md pour le guide complet\n');
} else {
  console.log('⚠️  Fichiers manquants ou incomplets!\n');
  const missing = checks.filter(c => !c.status);
  missing.forEach(m => {
    console.log(`❌ ${m.path}`);
  });
  console.log('\n💡 Astuce: Assurez-vous que tous les fichiers existent et sont correctement configurés.\n');
}

process.exit(allPass ? 0 : 1);

#!/usr/bin/env node

/**
 * 🎯 CHECKLIST DÉPLOIEMENT VERCEL + RENDER
 * 
 * Exécutez cette checklist pour valider votre déploiement
 * Usage: node DEPLOYMENT_CHECKLIST.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║  🎯 CHECKLIST DÉPLOIEMENT VERCEL + RENDER                      ║');
console.log('║                                                                ║');
console.log('║  Complétez chaque étape pour déployer avec succès              ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Sections de checklist
const sections = [
  {
    title: '🔍 VÉRIFICATION DES FICHIERS',
    items: [
      { name: 'server/index-render.js existe', check: () => fs.existsSync('server/index-render.js') },
      { name: 'render.yaml existe', check: () => fs.existsSync('render.yaml') },
      { name: '.env.example existe', check: () => fs.existsSync('.env.example') },
      { name: 'server/package.json existe', check: () => fs.existsSync('server/package.json') },
      { name: 'client/dist existe (built)', check: () => fs.existsSync('client/dist') },
    ]
  },
  {
    title: '📚 DOCUMENTATION PRÉSENTE',
    items: [
      { name: 'RENDER_QUICK_START.md', check: () => fs.existsSync('RENDER_QUICK_START.md') },
      { name: 'VERCEL_RENDER_DEPLOYMENT.md', check: () => fs.existsSync('VERCEL_RENDER_DEPLOYMENT.md') },
      { name: 'DOCUMENTATION_INDEX.md', check: () => fs.existsSync('DOCUMENTATION_INDEX.md') },
      { name: 'API_INTEGRATION.md', check: () => fs.existsSync('API_INTEGRATION.md') },
      { name: 'MIGRATION_GUIDE.md', check: () => fs.existsSync('MIGRATION_GUIDE.md') },
    ]
  },
  {
    title: '🔧 CONFIGURATION',
    items: [
      { name: 'Git repo initialized (.git)', check: () => fs.existsSync('.git') },
      { name: 'vercel.json existe', check: () => fs.existsSync('vercel.json') },
      { name: 'vercel-render.json existe (alt)', check: () => fs.existsSync('vercel-render.json') },
      { name: '.gitignore configured', check: () => fs.existsSync('.gitignore') },
    ]
  },
];

let totalChecks = 0;
let totalPassed = 0;

sections.forEach((section, idx) => {
  console.log(`\n${section.title}`);
  console.log('─'.repeat(65));
  
  section.items.forEach(item => {
    totalChecks++;
    const passed = item.check();
    totalPassed += passed ? 1 : 0;
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const padding = ' '.repeat(Math.max(1, 50 - item.name.length));
    console.log(`  ${item.name}${padding}${status}`);
  });
});

console.log('\n');
console.log('═'.repeat(65));

// Résultat global
const allPass = totalPassed === totalChecks;
console.log(`\n📊 RÉSULTATS: ${totalPassed}/${totalChecks} vérifications passées\n`);

if (allPass) {
  console.log('🎉 EXCELLENT! Tous les fichiers sont en place.\n');
  
  console.log('📝 PROCHAINES ÉTAPES:\n');
  
  console.log('ÉTAPE 1 - LOCAL TEST (5 min)');
  console.log('  $ npm install');
  console.log('  $ cd server && npm install');
  console.log('  $ node test-render-backend.js\n');
  
  console.log('ÉTAPE 2 - RENDER SETUP (10 min)');
  console.log('  1. Créer compte: https://render.com');
  console.log('  2. Créer MySQL database');
  console.log('  3. Créer Web Service Node.js');
  console.log('  4. Lire: RENDER_QUICK_START.md\n');
  
  console.log('ÉTAPE 3 - VERCEL SETUP (5 min)');
  console.log('  1. Connecter GitHub sur Vercel');
  console.log('  2. Ajouter VITE_API_URL env var');
  console.log('  3. Redéployer\n');
  
  console.log('ÉTAPE 4 - TEST (5 min)');
  console.log('  1. curl https://your-render-app/health');
  console.log('  2. Login sur app');
  console.log('  3. Créer tâche test');
  console.log('  4. Vérifier dans MySQL\n');
  
  console.log('📖 DOCUMENTATION:\n');
  console.log('  Quick Start (5 min):');
  console.log('    → RENDER_QUICK_START.md\n');
  
  console.log('  Guide complet (40 min):');
  console.log('    → VERCEL_RENDER_DEPLOYMENT.md\n');
  
  console.log('  Navigation (tous les docs):');
  console.log('    → DOCUMENTATION_INDEX.md\n');
  
} else {
  console.log('⚠️  FICHIERS MANQUANTS:\n');
  
  sections.forEach(section => {
    section.items.forEach(item => {
      if (!item.check()) {
        console.log(`  ❌ ${item.name}`);
      }
    });
  });
  
  console.log('\n💡 SOLUTIONS:\n');
  console.log('  1. Vérifier que vous êtes dans le bon répertoire');
  console.log('  2. Vérifier que npm install a été fait');
  console.log('  3. Vérifier que npm run build (client) a été fait\n');
}

console.log('═'.repeat(65));
console.log('');

// Afficher le temps estimé
if (allPass) {
  console.log('⏱️  TEMPS ESTIMÉ JUSQU\'À PRODUCTION:\n');
  console.log('  Local test:      5 min');
  console.log('  Render setup:    10 min');
  console.log('  Vercel setup:    5 min');
  console.log('  Testing:         5 min');
  console.log('  ───────────────────');
  console.log('  TOTAL:           25 min ✅\n');
}

console.log('💼 RESSOURCES:\n');
console.log('  Render:  https://render.com');
console.log('  Vercel:  https://vercel.com');
console.log('  GitHub:  https://github.com\n');

console.log('📞 BESOIN D\'AIDE?\n');
console.log('  Voir: VERCEL_RENDER_DEPLOYMENT.md → Troubleshooting\n');

process.exit(allPass ? 0 : 1);

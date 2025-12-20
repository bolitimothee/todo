#!/usr/bin/env node

/**
 * Test du backend Render localement
 * Usage: node test-render-backend.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

// Vérifier les variables d'environnement
console.log('\n📋 Variables d\'environnement:\n');

const requiredVars = [
  'JWT_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'NODE_ENV'
];

const dbVars = [
  { key: 'DATABASE_URL', type: 'Render' },
  { key: 'MYSQL_HOST', type: 'Local' },
  { key: 'MYSQL_USER', type: 'Local' },
  { key: 'MYSQL_PASSWORD', type: 'Local' },
  { key: 'MYSQL_DATABASE', type: 'Local' }
];

console.log('✓ Variables requises:');
requiredVars.forEach(v => {
  const val = process.env[v] ? '✅' : '❌';
  console.log(`  ${val} ${v}`);
});

console.log('\n✓ Variables de base de données (une option):');
const hasDatabase = process.env.DATABASE_URL;
const hasLocalDb = process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD;

if (hasDatabase) {
  console.log('  ✅ DATABASE_URL (Render)');
} else if (hasLocalDb) {
  console.log('  ✅ MYSQL_* variables (Local)');
} else {
  console.log('  ❌ Aucune base de données configurée');
}

console.log('\n📝 Configuration détectée:\n');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`  Port: ${process.env.PORT || 4000}`);

if (hasDatabase) {
  const url = process.env.DATABASE_URL;
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    console.log(`  Base de données: ${match[3]}:${match[4]}`);
    console.log(`  Utilisateur: ${match[1]}`);
    console.log(`  Database: ${match[5]}`);
  }
}

if (hasLocalDb) {
  console.log(`  Base de données: ${process.env.MYSQL_HOST || 'localhost'}`);
  console.log(`  Utilisateur: ${process.env.MYSQL_USER}`);
  console.log(`  Database: ${process.env.MYSQL_DATABASE}`);
}

console.log('\n🚀 Démarrage du serveur...\n');

// Démarrer le serveur
try {
  require('./server/index-render.js');
  
  console.log('\n✅ Serveur démarré avec succès!');
  console.log('\nTests:');
  console.log('  • Health check: curl http://localhost:4000/health');
  console.log('  • Login: curl -X POST http://localhost:4000/api/login \\');
  console.log('           -H "Content-Type: application/json" \\');
  console.log('           -d \'{"username":"admin","password":"admin123"}\'');
  console.log('\n✋ Appuyez sur Ctrl+C pour arrêter\n');
} catch (error) {
  console.error('\n❌ Erreur au démarrage:', error.message);
  console.error('\nVérifiez:');
  console.error('  1. Les variables d\'environnement dans server/.env');
  console.error('  2. Que MySQL est en cours d\'exécution');
  console.error('  3. Les logs pour plus de détails\n');
  process.exit(1);
}

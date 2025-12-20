#!/usr/bin/env node

/**
 * Script de démarrage pour TO_DO_LIST_PRO
 * Ouvre les ports pare-feu et démarre le serveur Vite
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

console.log('\n🚀 TO_DO_LIST_PRO - Initialisation du serveur de développement\n');

// Étape 1: Ouvrir le pare-feu (Windows uniquement)
if (os.platform() === 'win32') {
    console.log('🔧 Configuration du pare-feu Windows...\n');
    
    const firewallScriptPath = path.join(__dirname, '..', 'scripts', 'open-firewall.ps1');
    
    // Vérifier si le script existe
    if (fs.existsSync(firewallScriptPath)) {
        const pwsh = spawn('powershell.exe', [
            '-ExecutionPolicy', 'Bypass',
            '-File', firewallScriptPath
        ], {
            stdio: 'inherit',
            shell: true
        });
        
        pwsh.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ Pare-feu configuré\n');
            } else {
                console.log('\n⚠️  Le pare-feu nécessite peut-être une élévation manuellement\n');
            }
            // Continuer vers l'étape 2
            startViteServer();
        });
        
        pwsh.on('error', (err) => {
            console.log('\n⚠️  Impossible de configurer le pare-feu automatiquement');
            console.log('Continuons sans cette configuration...\n');
            startViteServer();
        });
    } else {
        console.log('⚠️  Script pare-feu non trouvé, continuons sans configuration\n');
        startViteServer();
    }
} else {
    // Sur Mac/Linux, démarrer directement
    startViteServer();
}

// Étape 2: Démarrer Vite
function startViteServer() {
    console.log('🔥 Démarrage du serveur Vite...\n');
    
    const vite = spawn('npx', ['vite'], {
        stdio: 'inherit',
        cwd: __dirname
    });
    
    vite.on('error', (err) => {
        console.error('Erreur lors du lancement de Vite:', err);
        process.exit(1);
    });
    
    vite.on('close', (code) => {
        process.exit(code);
    });
    
    // Gérer les signaux d'interruption
    process.on('SIGINT', () => {
        vite.kill();
    });
    
    process.on('SIGTERM', () => {
        vite.kill();
    });
}

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'

// Récupère toutes les adresses IP disponibles (IPv4, non-locales)
function getNetworkAddresses() {
  const interfaces = os.networkInterfaces()
  const addresses = []

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address)
      }
    }
  }

  return addresses
}

// Plugin pour afficher les infos réseau au démarrage du serveur
function displayNetworkInfo() {
  let shown = false

  return {
    name: 'display-network-info',
    apply: 'serve',
    // Utilise l'événement configResolved pour attendre le démarrage
    configResolved(config) {
      // Délai pour laisser Vite finir ses logs de démarrage
      setImmediate(() => {
        if (!shown) {
          shown = true
          const networkAddrs = getNetworkAddresses()
          const port = 3000

          console.log('\n' + '='.repeat(78))
          console.log('🚀 TO_DO_LIST_PRO - Adresses de connexion pour tiers appareils:')
          console.log('='.repeat(78))
          
          if (networkAddrs.length > 0) {
            console.log(`\n📱 Accès local:     http://localhost:${port}/`)
            console.log(`\n🌐 Accès réseau (LAN):`)
            networkAddrs.forEach(addr => {
              console.log(`   ➜ http://${addr}:${port}/`)
            })
          } else {
            console.log(`\n📱 Local:   http://localhost:${port}/`)
          }

          console.log(`\n💡 COMMENT ACCÉDER DEPUIS UN AUTRE APPAREIL:`)
          console.log(`   1️⃣  Connectez votre téléphone/tablette à la même Wi-Fi`)
          if (networkAddrs.length > 0) {
            console.log(`   2️⃣  Ouvrez un navigateur et entrez l'une des adresses réseau ci-dessus`)
          } else {
            console.log(`   2️⃣  Ouvrez un navigateur et entrez l'adresse IP de votre PC:${port}`)
          }
          console.log(`   3️⃣  Si cela ne fonctionne pas:`)
          console.log(`       • Vérifiez que les 2 appareils sont sur le même réseau Wi-Fi`)
          console.log(`       • Ouvrez les ports 3000 et 4000 sur le pare-feu Windows`)
          console.log(`       • Utilisez un tunnel (localtunnel ou ngrok) si en réseau fermé`)
          
          console.log(`\n⚙️  Raccourcis Vite:`)
          console.log(`   • 'h' + Entrée : afficher l'aide complète`)
          console.log(`   • 'c' + Entrée : nettoyer la console`)
          console.log(`   • 'q' + Entrée : arrêter le serveur`)
          console.log('='.repeat(78) + '\n')
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), displayNetworkInfo()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})
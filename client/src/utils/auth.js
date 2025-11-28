// Petit utilitaire pour décoder le payload d'un JWT (sans vérification) côté client.
// Ceci est uniquement pour l'UI (pour redirection basique). La sécurité doit être faite côté serveur.
/**
 * utils/auth.js
 * Petites fonctions utilitaires pour l'authentification côté client.
 * - parseJwt : décode le payload d'un token JWT (utilisé pour récupérer le rôle/username)
 */

export function parseJwt(token){
  if(!token) return null;
  try{
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g,'+').replace(/_/g,'/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  }catch(e){
    return null;
  }
}

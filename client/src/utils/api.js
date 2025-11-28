/**
 * Utilitaire pour les appels API
 * Utilise le proxy Vite pour toutes les requêtes
 */

const API_BASE = '/api';

export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Erreur API ${endpoint}:`, error.message);
    throw error;
  }
}

export async function apiGet(endpoint, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiCall(endpoint, { method: 'GET', headers });
}

export async function apiPost(endpoint, body, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiCall(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
}

export async function apiPut(endpoint, body, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiCall(endpoint, { method: 'PUT', headers, body: JSON.stringify(body) });
}

export async function apiDelete(endpoint, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiCall(endpoint, { method: 'DELETE', headers });
}

export async function apiPatch(endpoint, body, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiCall(endpoint, { method: 'PATCH', headers, body: JSON.stringify(body) });
}

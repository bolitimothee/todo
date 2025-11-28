/**
 * Login.jsx - formulaire de connexion
 * Après connexion, on stocke le token et on redirige selon le rôle (via parseJwt)
 */

import React, {useState} from 'react';
// navigation handled by App after onLogin -> set token; avoid useNavigate here
import { parseJwt } from '../utils/auth';
import { API_BASE_URL } from '../config';
import { FaUser, FaLock, FaSignInAlt, FaExclamationCircle } from 'react-icons/fa';
import '../styles/Login.css';

export default function Login({onLogin, initialMessage = ''}){
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [msg,setMsg] = useState(initialMessage || '');
  // la redirection est effectuée par `App` après onLogin (évite d'utiliser useNavigate hors d'un Router)
  

  async function submit(e){
    e.preventDefault();
    try{
      const res = await fetch(`${API_BASE_URL}/login`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({username,password})
      });
      const data = await res.json();
      if(res.ok){
        // transmet le token au parent (App) qui gèrera la redirection
        onLogin(data.token);
      } else {
        setMsg(data.error || 'Erreur lors de la connexion');
      }
    }catch(e){
      setMsg('Impossible de contacter le serveur (vérifie que le backend est lancé)');
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">TO DO LIST PRO</h1>
          <p className="login-subtitle">Connectez-vous avec les identifiants fournis par votre administrateur</p>
        </div>
        
        <form onSubmit={submit} className="login-form">
          <div className="input-group">
            <div className="input-wrapper">
              <input
                type="text"
                className={`input ${username ? 'success' : ''}`}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
                required
                autoFocus
              />
              <FaUser className="input-icon" />
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <input
                type="password"
                className={`input ${password ? 'success' : ''}`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
              />
              <FaLock className="input-icon" />
            </div>
          </div>
          
          <button type="submit" className="login-button">
            <FaSignInAlt />
            <span>Se connecter</span>
          </button>
          
          {msg && (
            <div className="validation-message error">
              <FaExclamationCircle />
              <span>{msg}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

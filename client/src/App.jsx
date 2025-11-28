/**
 * App.jsx - Version Responsive Complète
 * Routeur principal optimisé pour mobile, tablette et desktop
 * - Après connexion, redirection selon le rôle (admin/manager/team)
 * - Interface adaptative avec détection de la taille d'écran
 * - Menu mobile hamburger pour petits écrans
 */

import React, {useState, useEffect} from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FaSignOutAlt, FaTasks, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import ManagerDashboard from './components/ManagerDashboard'
import TeamDashboard from './components/TeamDashboard'
import { parseJwt } from './utils/auth'
import './styles/global.css'

function AppRoutes({token, onLogout}){
  const payload = parseJwt(token);
  const role = payload?.role;
  console.log('[AppRoutes] Token role:', role);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect role={role} />} />
        <Route path="/admin" element={role === 'admin' ? <AdminDashboard token={token} /> : <Navigate to="/" />} />
        <Route path="/manager" element={role === 'manager' ? <ManagerDashboard token={token} /> : <Navigate to="/" />} />
        <Route path="/team" element={role === 'team' ? <TeamDashboard token={token} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function HomeRedirect({role}){
  if(role === 'admin') return <Navigate to="/admin" />
  if(role === 'manager') return <Navigate to="/manager" />
  if(role === 'team') return <Navigate to="/team" />
  return <div className="unknown-role">Rôle inconnu — affiche le menu principal</div>
}

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loginMessage, setLoginMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Détection du redimensionnement pour l'affichage responsive
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Fermer le menu si on passe en mode desktop
      if (!mobile) setIsMenuOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Vérifier la validité du token
  useEffect(()=>{
    async function checkToken(){
      if(!token) return;
      try{
        const res = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + token } });
        if(res.ok){
          setLoginMessage('');
          return;
        } else {
          const data = await res.json();
          if(res.status === 403 && data && (data.error || '').toLowerCase().includes('expir')){
            localStorage.removeItem('token');
            setToken(null);
            setLoginMessage("Accès expirés contactez l'administrateur");
          }
        }
      }catch(e){
        // Ignore les erreurs réseau
      }
    }
    checkToken();
    const id = setInterval(checkToken, 60000);
    return () => clearInterval(id);
  },[token]);

  // Intercepter les réponses fetch pour gérer les expirations
  useEffect(()=>{
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      try{
        if(res && res.status === 403){
          const data = await res.clone().json().catch(()=>null);
          if(data && (data.error || '').toLowerCase().includes('expir')){
            localStorage.removeItem('token');
            setToken(null);
            setLoginMessage("Accès expirés contactez l'administrateur");
          }
        }
      }catch(e){/* ignore */}
      return res;
    };
    return () => { window.fetch = originalFetch };
  },[]);

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsMenuOpen(false);
  };

  if(!token) return <Login onLogin={(t)=>{setToken(t); localStorage.setItem('token', t);}} initialMessage={loginMessage} />

  const userPayload = parseJwt(token);
  const username = userPayload?.username || 'Utilisateur';

  return (
    <div className="app-wrapper">
      <header className="main-header">
        <div className="header-content">
          <div className="header-left">
            <FaTasks className="app-logo" />
            <h1 className="app-title">TO DO LIST PRO</h1>
          </div>

          {isMobile ? (
            <>
              {/* Bouton hamburger pour mobile */}
              <button 
                className="hamburger-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu"
              >
                {isMenuOpen ? <FaTimes /> : <FaBars />}
              </button>

              {/* Menu mobile en overlay */}
              {isMenuOpen && (
                <>
                  <div 
                    className="mobile-overlay" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="mobile-menu">
                    <div className="mobile-menu-header">
                      <div className="user-info-mobile">
                        <FaUserCircle />
                        <span>{username}</span>
                      </div>
                    </div>
                    <button 
                      className="button logout-button-mobile" 
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            /* Menu desktop */
            <div className="header-right">
              <div className="user-info">
                <FaUserCircle />
                <span>{username}</span>
              </div>
              <button 
                className="button secondary" 
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                <span className="button-text">Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-container">
        <AppRoutes token={token} onLogout={handleLogout} />
      </main>
    </div>
  )
}
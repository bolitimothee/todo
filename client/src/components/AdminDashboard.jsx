/**
 * AdminDashboard.jsx - Version Responsive
 *
 * Interface optimisée pour tous les écrans :
 * - Créer un utilisateur (manager ou team)
 * - Lister les utilisateurs existants
 * - Supprimer un utilisateur
 * - Créer une société
 * - Gestion de la corbeille
 */

import React, {useEffect, useState} from 'react';
import EditUser from './EditUser';
import '../styles/AdminDashboard.css';

export default function AdminDashboard({token}) {
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [form, setForm] = useState({username:'', password:'', role:'manager', company_id:'', team_name:'', valid_until:''});
  const [restoreForm, setRestoreForm] = useState({ userId: '', valid_until: '' });
  const [companyForm, setCompanyForm] = useState({
    name: '',
    numTeams: 1,
    teams: [''],
    numManagers: 1,
    showForm: false
  });
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [editingCompanyForm, setEditingCompanyForm] = useState({name:'', numTeams:1, teams: [''], numManagers:1});
  const [msg, setMsg] = useState('');
  const [companyMsg, setCompanyMsg] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  // Détection du redimensionnement pour l'affichage mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Au chargement du composant, récupérer sociétés & utilisateurs
  useEffect(()=>{ 
    fetchCompanies(); 
    fetchUsers(); 
    fetchDeletedUsers();
    
    // Vérifier périodiquement les utilisateurs expirés
    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/check-expired-users', {
          headers: { Authorization: 'Bearer ' + token }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.expiredUsers.length > 0) {
            setRefreshFlag(f => f + 1);
          }
        }
      } catch(e) {
        console.error('Erreur lors de la vérification des utilisateurs expirés:', e);
      }
    }, 30000); // Vérifier toutes les 30 secondes

    return () => clearInterval(checkInterval);
  },[refreshFlag, token]);

  // Récupère la liste des utilisateurs supprimés (corbeille)
  async function fetchDeletedUsers() {
    try {
      const res = await fetch('/api/trash', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if(res.ok) setDeletedUsers(await res.json());
    } catch(e) {
      console.error('Erreur lors de la récupération des utilisateurs supprimés:', e);
    }
  }

  // Restaurer un utilisateur depuis la corbeille
  async function restoreUser(userId) {
    if (!restoreForm.valid_until) {
      setMsg('La date de validité est requise pour la restauration');
      return;
    }
    try {
      const res = await fetch(`/api/trash/${userId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ valid_until: toSqlDateTime(restoreForm.valid_until) })
      });
      if (res.ok) {
        setMsg('Utilisateur restauré avec succès');
        setRefreshFlag(f => f + 1);
        setRestoreForm({ userId: '', valid_until: '' });
      } else {
        const data = await res.json();
        setMsg(data.error || 'Erreur lors de la restauration');
      }
    } catch(e) {
      setMsg('Erreur réseau');
    }
  }

  // Supprimer définitivement un utilisateur
  async function deleteUserPermanently(userId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) {
      return;
    }
    try {
      const res = await fetch(`/api/trash/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      if (res.ok) {
        setMsg('Utilisateur supprimé définitivement');
        setRefreshFlag(f => f + 1);
      } else {
        const data = await res.json();
        setMsg(data.error || 'Erreur lors de la suppression');
      }
    } catch(e) {
      setMsg('Erreur réseau');
    }
  }

  // Récupère la liste des sociétés (admin)
  async function fetchCompanies(){
    try{
      const res = await fetch('/api/companies',{headers:{Authorization:'Bearer '+token}});
      if(res.ok) setCompanies(await res.json());
    }catch(e){ console.error(e) }
  }

  // Récupère la liste des utilisateurs (admin)
  async function fetchUsers(){
    try{
      const res = await fetch('/api/admin/users',{headers:{Authorization:'Bearer '+token}});
      if(res.ok) setUsers(await res.json());
    }catch(e){ console.error(e) }
  }

  // Convertit une valeur d'entrée type datetime-local en format SQL DATETIME
  function toSqlDateTime(input){
    if(!input) return null;
    // input: 'YYYY-MM-DDTHH:MM' ou 'YYYY-MM-DDTHH:MM:SS'
    try{
      const replaced = input.replace('T',' ');
      // ajouter les secondes si manquantes
      if(replaced.length === 16) return replaced + ':00';
      if(replaced.length === 19) return replaced;
      // fallback
      const d = new Date(input);
      if(isNaN(d.getTime())) return null;
      return d.toISOString().slice(0,19).replace('T',' ');
    }catch(e){ return null; }
  }

  // Création d'un utilisateur via l'API
  async function submit(e){
    e.preventDefault();
    setMsg('');
    
    // Vérification des limites de la société
    if(form.company_id) {
      const company = companies.find(c => c.id === form.company_id);
      if(company) {
        const companyUsers = users.filter(u => u.company_id === form.company_id);
        const managersCount = companyUsers.filter(u => u.role === 'manager').length;
        const teamsCount = new Set(companyUsers.filter(u => u.role === 'team').map(u => u.team_name)).size;
        
        if(form.role === 'manager' && managersCount >= company.numManagers) {
          setMsg(`Erreur : Le nombre maximum de managers (${company.numManagers}) pour cette société est atteint`);
          return;
        }
        
        if(form.role === 'team' && teamsCount >= company.numTeams && !companyUsers.some(u => u.team_name === form.team_name)) {
          setMsg(`Erreur : Le nombre maximum d'équipes (${company.numTeams}) pour cette société est atteint`);
          return;
        }
      }
    }
    
    try{
      // Préparer le payload en formatant valid_until pour MySQL
      const payload = {
        ...form,
        valid_until: form.valid_until ? toSqlDateTime(form.valid_until) : null
      };

      const res = await fetch('/api/admin/create-user',{
        method:'POST',
        headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(res.ok){
        setMsg('Utilisateur créé');
        setForm({username:'', password:'', role:'manager', company_id:'', team_name:'', valid_until:''});
        fetchUsers();
      } else {
        setMsg(data.error || 'Erreur');
      }
    }catch(e){
      setMsg('Erreur réseau');
    }
  }

  // Supprimer un utilisateur
  async function triggerRefresh(){ setRefreshFlag(f=>f+1); }

  async function deleteUser(id){
    if(!confirm('Confirmer suppression ?')) return;
    await fetch('/api/admin/user/'+id,{method:'DELETE', headers:{Authorization:'Bearer '+token}});
    fetchUsers();
    fetchDeletedUsers();
  }

  // Créer une société avec toutes ses données
  async function createCompany(e){
    e.preventDefault();
    setCompanyMsg('');
    try {
      const companyData = {
        name: companyForm.name,
        numTeams: parseInt(companyForm.numTeams),
        teams: companyForm.teams.filter(t => t.trim() !== ''),
        numManagers: parseInt(companyForm.numManagers)
      };
      
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyData)
      });
      
      const data = await res.json();
      if(res.ok) {
        setCompanyMsg('Société créée avec succès');
        setCompanyForm({
          name: '',
          numTeams: 1,
          teams: [''],
          numManagers: 1,
          showForm: false
        });
        fetchCompanies();
      } else {
        setCompanyMsg(data.error || 'Erreur lors de la création');
      }
    } catch(e) {
      setCompanyMsg('Erreur réseau');
    }
  }

  // Gérer les équipes de la société
  function handleTeamChange(index, value) {
    const newTeams = [...companyForm.teams];
    newTeams[index] = value;
    setCompanyForm({...companyForm, teams: newTeams});
  }

  function updateTeamsCount(count) {
    const newCount = parseInt(count);
    const currentTeams = [...companyForm.teams];
    
    if (newCount > currentTeams.length) {
      while (currentTeams.length < newCount) {
        currentTeams.push('');
      }
    } else {
      while (currentTeams.length > newCount) {
        currentTeams.pop();
      }
    }
    
    setCompanyForm({
      ...companyForm,
      numTeams: newCount,
      teams: currentTeams
    });
  }

  // Démarrer l'édition d'une société
  function startEditCompany(company){
    setEditingCompanyId(company.id);
    setEditingCompanyForm({
      name: company.name || '',
      numTeams: company.numTeams || 1,
      teams: company.teams ? [...company.teams] : [''],
      numManagers: company.numManagers || 1
    });
  }

  function handleEditTeamChange(index, value){
    const newTeams = [...editingCompanyForm.teams];
    newTeams[index] = value;
    setEditingCompanyForm({...editingCompanyForm, teams: newTeams});
  }

  function updateEditTeamsCount(count){
    const newCount = parseInt(count);
    const current = [...editingCompanyForm.teams];
    if(newCount > current.length){ while(current.length < newCount) current.push(''); }
    else { while(current.length > newCount) current.pop(); }
    setEditingCompanyForm({...editingCompanyForm, numTeams: newCount, teams: current});
  }

  async function submitEditCompany(e){
    e.preventDefault();
    setCompanyMsg('');
    try{
      const res = await fetch('/api/companies/'+editingCompanyId,{
        method:'PUT',
        headers:{'Content-Type':'application/json', Authorization:'Bearer '+token},
        body: JSON.stringify(editingCompanyForm)
      });
      const data = await res.json();
      if(res.ok){
        setCompanyMsg('Société mise à jour');
        setEditingCompanyId(null);
        fetchCompanies();
      } else {
        setCompanyMsg(data.error || 'Erreur mise à jour');
      }
    }catch(e){ setCompanyMsg('Erreur réseau'); }
  }

  // Supprimer une société (client)
  async function deleteCompany(id){
    if(!confirm('Confirmer suppression de la société et de ses utilisateurs ?')) return;
    try{
      const res = await fetch('/api/companies/'+id, {method:'DELETE', headers:{Authorization:'Bearer '+token}});
      const data = await res.json();
      if(res.ok){
        setCompanyMsg('Société supprimée');
        fetchCompanies();
        fetchUsers();
      } else {
        setCompanyMsg(data.error || 'Erreur suppression');
      }
    }catch(e){ setCompanyMsg('Erreur réseau'); }
  }

  // Formater la date pour l'affichage responsive
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    
    if (isMobile) {
      // Format court pour mobile
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } else {
      // Format complet pour desktop
      return date.toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 className="admin-title">Administration</h2>
      </div>

      {/* Section Gestion des sociétés */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Gestion des sociétés</h3>
          {!companyForm.showForm && (
            <button className="button" onClick={() => setCompanyForm({...companyForm, showForm: true})}>
              {isMobile ? '+ Société' : 'Nouvelle société'}
            </button>
          )}
        </div>

        {companyForm.showForm && (
          <form onSubmit={createCompany} className="form">
            <input 
              className="input" 
              placeholder="Nom de la société" 
              value={companyForm.name} 
              onChange={e => setCompanyForm({...companyForm, name: e.target.value})} 
              required 
            />

            <div className="flex">
              <div className="form-col">
                <label className="muted">Nombre d'équipes</label>
                <input 
                  className="input" 
                  type="number" 
                  min="1" 
                  value={companyForm.numTeams} 
                  onChange={e => updateTeamsCount(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-col">
                <label className="muted">Managers autorisés</label>
                <input 
                  className="input" 
                  type="number" 
                  min="1" 
                  value={companyForm.numManagers} 
                  onChange={e => setCompanyForm({...companyForm, numManagers: e.target.value})} 
                  required 
                />
              </div>
            </div>

            {companyForm.teams.map((team, idx) => (
              <input 
                key={idx} 
                className="input" 
                placeholder={`Nom de l'équipe ${idx + 1}`} 
                value={team} 
                onChange={e => handleTeamChange(idx, e.target.value)} 
                required 
              />
            ))}

            <div className="flex">
              <button type="submit" className="button">Créer</button>
              <button 
                type="button" 
                className="button secondary" 
                onClick={() => setCompanyForm({...companyForm, showForm: false})}
              >
                Annuler
              </button>
            </div>

            {companyMsg && (
              <div className={`message ${companyMsg.includes('succès') ? 'success' : 'error'}`}>
                {companyMsg}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Section Créer un utilisateur */}
      <div className="card">
        <h3 className="card-title">Créer un utilisateur</h3>
        <form onSubmit={submit} className="form">
          <input 
            className="input" 
            placeholder="Nom d'utilisateur" 
            value={form.username} 
            onChange={e=>setForm({...form,username:e.target.value})} 
            required
          />
          <input 
            className="input" 
            type="password"
            placeholder="Mot de passe" 
            value={form.password} 
            onChange={e=>setForm({...form,password:e.target.value})} 
            required
          />
          <select 
            className="select" 
            value={form.role} 
            onChange={e=>setForm({...form,role:e.target.value})}
          >
            <option value="manager">Manager</option>
            <option value="team">Equipe</option>
          </select>
          <select 
            className="select" 
            value={form.company_id} 
            onChange={e=>setForm({...form,company_id:e.target.value, team_name:''})}
          >
            <option value="">-- Sélectionner société (requis) --</option>
            {companies.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {form.role === 'team' && form.company_id && (
            <select 
              className="select" 
              value={form.team_name} 
              onChange={e=>setForm({...form,team_name:e.target.value})}
            >
              <option value="">-- Sélectionner équipe --</option>
              {companies.find(c => c.id === form.company_id)?.teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          )}
          <label className="muted">Validité du compte (date & heure)</label>
          <div className="flex">
            <input 
              className="input" 
              type="date" 
              value={form.valid_until.split('T')[0] || ''}
              onChange={e => {
                const date = e.target.value;
                const time = form.valid_until.split('T')[1] || '00:00';
                setForm({...form, valid_until: date ? `${date}T${time}` : ''});
              }}
              placeholder="Date"
            />
            <input 
              className="input" 
              type="time" 
              value={form.valid_until.split('T')[1] || ''}
              onChange={e => {
                const date = form.valid_until.split('T')[0] || '';
                const time = e.target.value;
                setForm({...form, valid_until: date ? `${date}T${time}` : ''});
              }}
              placeholder="Heure"
            />
          </div>
          <button type="submit" className="button">Créer l'utilisateur</button>
          {msg && <div className={`message ${msg.includes('créé') ? 'success' : 'error'}`}>{msg}</div>}
        </form>
      </div>

      <div className="section-divider"></div>
      
      {/* Liste des sociétés et utilisateurs */}
      <h3 className="section-title">Utilisateurs existants</h3>
      {companies.map(company => (
        <div key={company.id} className="card mb-4">
          <div className="card-header">
            <h4 className="card-title">Société : {company.name}</h4>
            <div className="flex">
              <button className="button" onClick={() => startEditCompany(company)}>
                {isMobile ? '✏️' : 'Modifier'}
              </button>
              <button className="button danger" onClick={() => deleteCompany(company.id)}>
                {isMobile ? '🗑️' : 'Supprimer'}
              </button>
            </div>
          </div>

          {editingCompanyId === company.id ? (
            <form onSubmit={submitEditCompany} className="form">
              <input 
                className="input" 
                placeholder="Nom de la société" 
                value={editingCompanyForm.name} 
                onChange={e=>setEditingCompanyForm({...editingCompanyForm, name: e.target.value})} 
                required 
              />
              <div className="flex">
                <div className="form-col">
                  <label className="muted">Nombre d'équipes</label>
                  <input 
                    className="input" 
                    type="number" 
                    min="1" 
                    value={editingCompanyForm.numTeams} 
                    onChange={e=>updateEditTeamsCount(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-col">
                  <label className="muted">Managers autorisés</label>
                  <input 
                    className="input" 
                    type="number" 
                    min="1" 
                    value={editingCompanyForm.numManagers} 
                    onChange={e=>setEditingCompanyForm({...editingCompanyForm, numManagers: e.target.value})} 
                    required 
                  />
                </div>
              </div>
              {editingCompanyForm.teams.map((team, idx) => (
                <input 
                  key={idx} 
                  className="input" 
                  placeholder={`Nom de l'équipe ${idx + 1}`} 
                  value={team} 
                  onChange={e=>handleEditTeamChange(idx, e.target.value)} 
                  required 
                />
              ))}
              <div className="flex">
                <button type="submit" className="button">Enregistrer</button>
                <button 
                  type="button" 
                  className="button secondary" 
                  onClick={()=>setEditingCompanyId(null)}
                >
                  Annuler
                </button>
              </div>
              {companyMsg && (
                <div className={`message ${companyMsg.includes('succès') ? 'success' : 'error'}`}>
                  {companyMsg}
                </div>
              )}
            </form>
          ) : (
            <div className="company-info">
              <div><strong>Équipes : </strong>{company.teams?.join(', ') || 'Aucune équipe'}</div>
              <div><strong>Managers max : </strong>{company.numManagers}</div>
            </div>
          )}

          <div style={{overflowX: 'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Role</th>
                  {!isMobile && <th>Equipe</th>}
                  <th>Validité</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => u.company_id === company.id)
                  .map(u => (
                    <React.Fragment key={u.id}>
                      <tr>
                        <td>{u.username}</td>
                        <td>{u.role}</td>
                        {!isMobile && <td>{u.team_name || '-'}</td>}
                        <td>{formatDate(u.valid_until)}</td>
                        <td>
                          <button 
                            className="button danger" 
                            onClick={()=>deleteUser(u.id)}
                          >
                            {isMobile ? '🗑️' : 'Supprimer'}
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={isMobile ? "4" : "5"}>
                          <EditUser token={token} user={u} onSaved={triggerRefresh} />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Administrateurs système */}
      <div className="section">
        <h3 className="section-title">Administrateurs système</h3>
        <div style={{overflowX: 'auto'}}>
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u => !u.company_id)
                .map(u => (
                  <React.Fragment key={u.id}>
                    <tr>
                      <td>{u.username}</td>
                      <td>{u.role}</td>
                      <td>
                        <button 
                          className="button danger" 
                          onClick={()=>deleteUser(u.id)}
                        >
                          {isMobile ? '🗑️' : 'Supprimer'}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3">
                        <EditUser token={token} user={u} onSaved={triggerRefresh} />
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Corbeille */}
      <div className="section trash-section">
        <h3 className="section-title">
          <span>Corbeille</span>
          {deletedUsers.length > 0 && (
            <span className="badge">{deletedUsers.length}</span>
          )}
        </h3>
        <div className="trash-container">
          <div style={{overflowX: 'auto'}}>
            <table className="trash-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  {!isMobile && <th>Société</th>}
                  {!isMobile && <th>Équipe</th>}
                  {!isMobile && <th>Date suppression</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    {!isMobile && (
                      <td>{companies.find(c => c.id === user.company_id)?.name || '-'}</td>
                    )}
                    {!isMobile && <td>{user.team_name || '-'}</td>}
                    {!isMobile && (
                      <td>{new Date(user.deletedAt).toLocaleString('fr-FR')}</td>
                    )}
                    <td className="trash-actions">
                      {user.id === restoreForm.userId ? (
                        <div className="restore-form">
                          <div className="flex">
                            <input
                              type="date"
                              value={restoreForm.valid_until.split('T')[0] || ''}
                              onChange={e => {
                                const date = e.target.value;
                                const time = restoreForm.valid_until.split('T')[1] || '00:00';
                                setRestoreForm({...restoreForm, valid_until: date ? `${date}T${time}` : ''});
                              }}
                              required
                              min={new Date().toISOString().slice(0, 10)}
                            />
                            <input
                              type="time"
                              value={restoreForm.valid_until.split('T')[1] || ''}
                              onChange={e => {
                                const date = restoreForm.valid_until.split('T')[0] || '';
                                const time = e.target.value;
                                setRestoreForm({...restoreForm, valid_until: date ? `${date}T${time}` : ''});
                              }}
                            />
                          </div>
                          <button onClick={() => restoreUser(user.id)} className="button">
                            ✓
                          </button>
                          <button 
                            onClick={() => setRestoreForm({userId: '', valid_until: ''})} 
                            className="button secondary"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => setRestoreForm({userId: user.id, valid_until: ''})} 
                            className="button"
                          >
                            {isMobile ? '↺' : 'Restaurer'}
                          </button>
                          <button 
                            onClick={() => deleteUserPermanently(user.id)} 
                            className="button danger"
                          >
                            {isMobile ? '✕' : 'Supprimer définitivement'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {deletedUsers.length === 0 && (
            <div className="empty-trash">
              Aucun utilisateur dans la corbeille
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

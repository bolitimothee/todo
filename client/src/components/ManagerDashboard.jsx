/**
 * ManagerDashboard.jsx
 *
 * Interface pour un manager :
 * - Créer des tâches pour une société et (optionnellement) pour une équipe
 * - Voir la liste des tâches de la société
 *
 * Explication :
 * - Un manager doit être rattaché à une company_id (défini par l'admin)
 * - Lorsqu'une tâche est créée, on définit : title, priority, team_name (facultatif)
 */
/**
 * ManagerDashboard.jsx
 * Interface pour un manager :
 * - Créer des tâches pour une société et (optionnellement) pour une équipe
 * - Voir la liste des tâches de la société
 */

import React, {useState, useEffect} from 'react';
import { FaInbox, FaHistory, FaTasks, FaUsers, FaBell, FaSyncAlt, FaPlus, FaDownload } from 'react-icons/fa';
import { MdPriorityHigh } from 'react-icons/md';
import '../styles/ManagerDashboard.css';

export default function ManagerDashboard({token}){
    // Fonction pour télécharger l'historique résolu sous forme de texte
    function downloadResolvedHistory(){
      if(!resolvedHistory || Object.keys(resolvedHistory).length === 0){ alert('Aucun historique résolu à télécharger'); return; }
      let lines = [];
        for(const team in resolvedHistory){
        lines.push(`=== Équipe : ${team} ===`);
        resolvedHistory[team].forEach(inc => {
          const title = getTaskTitleFromRef(inc);
          lines.push(`Tâche : ${title} | Message : ${inc.message || '-'} | Signalé le : ${inc.created_at ? new Date(inc.created_at).toLocaleString() : '-'} | Résolu le : ${inc.resolved_at ? new Date(inc.resolved_at).toLocaleString() : '-'}`);
        });
        lines.push('');
      }
      const blob = new Blob([lines.join('\n')], {type: 'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historique_signalements_resolus_${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  const [company, setCompany] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({title:'',priority:'faisables',team_name:''});
  const [resolvedHistory, setResolvedHistory] = useState({});

  async function resolveIncident(id){
    if(!window.confirm('Marquer ce signalement comme résolu ?')) return;
    try{
      const res = await fetch('/api/incidents/' + id + '/resolve', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token }
      });
      if(res.ok){
        fetchIncidents();
        fetchResolvedHistory();
      }else{
        const data = await res.json();
        alert(data.error || 'Erreur lors de la résolution');
      }
    }catch(e){
      alert('Erreur réseau');
    }
  }

  async function fetchResolvedHistory(){
    try{
      const res = await fetch('/api/incidents/resolved', {headers:{Authorization:'Bearer '+token}});
      if(res.ok) setResolvedHistory(await res.json());
    }catch(e){ console.error(e); }
  }
  useEffect(()=>{
    fetchMyCompany();
    fetchTasks();
  },[]);

  async function fetchMyCompany(){
    try{
      const res = await fetch('/api/my-company',{headers:{Authorization:'Bearer '+token}});
      if(res.ok) setCompany(await res.json());
    }catch(e){ console.error(e) }
  }

  async function fetchTasks(){
    try{
      const res = await fetch('/api/tasks',{headers:{Authorization:'Bearer '+token}});
      if(res.ok) setTasks(await res.json());
    }catch(e){ console.error(e) }
  }

  async function fetchIncidents(){
    try{
      const res = await fetch('/api/incidents',{headers:{Authorization:'Bearer '+token}});
      if(res.ok) setIncidents(await res.json());
    }catch(e){ console.error(e) }
  }

  async function fetchHistory(){
    try{
      const res = await fetch('/api/tasks/history',{headers:{Authorization:'Bearer '+token}});
      if(res.ok) setHistory(await res.json());
    }catch(e){ console.error(e) }
  }

  // Retourne l'intitulé (title) d'une tâche liée à un incident / entrée d'historique
  function getTaskTitleFromRef(ref) {
    if (!ref) return '-';
    // ref peut être un incident/resolved item ou un id
    // Si c'est un objet avec task_title
    if (typeof ref === 'object') {
      if (ref.task_title) return ref.task_title;
      if (ref.title) return ref.title; // parfois l'objet d'historique contient title
      if (ref.task && typeof ref.task === 'object' && ref.task.title) return ref.task.title;
      const id = ref.task_id || ref.taskId || ref.task?.id || ref.task_id;
      if (id) {
        const found = tasks.find(t => String(t.id) === String(id));
        if (found) return found.title;
        return String(id);
      }
      return '-';
    }
    // si ref est une primitive (id)
    const found = tasks.find(t => String(t.id) === String(ref));
    if (found) return found.title;
    return String(ref || '-');
  }

  async function deleteTask(id){
    if(!confirm('Confirmer suppression de cette tâche ?')) return;
    try{
      const res = await fetch('/api/tasks/'+id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
      if(res.ok){
        fetchTasks();
        fetchIncidents();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur suppression tâche');
      }
    }catch(e){
      console.error(e);
      alert('Erreur réseau');
    }
  }

  function downloadHistory(){
    if(!history || history.length === 0){ alert('Aucun historique à télécharger'); return; }
    const lines = history.map(h => {
      const date = h.updated_at ? new Date(h.updated_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}) : (h.created_at ? new Date(h.created_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}) : '-');
      return `[${date}] ${h.title} | ${h.status} | ${h.team_name || '-'}${h.note ? ' | Note: '+h.note : ''}`;
    }).join('\n');
    const blob = new Blob([lines], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function createTask(e){
    e.preventDefault();
    if(!company){ alert('Société introuvable'); return; }
    const payload = { ...form, company_id: company.id, team_name: form.team_name || null };
    await fetch('/api/tasks',{ method:'POST', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    setForm({title:'',priority:'faisables',team_name:''});
    fetchTasks();
    fetchIncidents();
  }

  const shownTasks = tasks
    .filter(t => {
      if (selectedTeam && t.team_name !== selectedTeam) return false;
      if (selectedPriority && t.priority !== selectedPriority) return false;
      return true;
    });

  return (
    <div className="manager-page">
      <div className="manager-container">
        <div className="manager-header">
          <h2 className="manager-title"><FaUsers /> Tableau de bord Manager</h2>
        </div>

        <div className="section">
          {company ? (
            <>
              <div className="mb-4"><strong>Société :</strong> {company.name}</div>
              <div className="flex items-center" style={{gap: '8px', flexWrap: 'wrap'}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <label className="muted">Filtrer par équipe : </label>
                  <select className="select" value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)}>
                    <option value="">-- Toutes les équipes --</option>
                    {company.teams?.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <label className="muted">Filtrer par priorité : </label>
                  <select className="select" value={selectedPriority} onChange={e=>setSelectedPriority(e.target.value)}>
                    <option value="">-- Toutes les priorités --</option>
                    <option value="urgentes">urgentes</option>
                    <option value="très importantes">très importantes</option>
                    <option value="prioritaires">prioritaires</option>
                    <option value="faisables">faisables</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div>Chargement société...</div>
          )}
        </div>

        <div className="flex">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FaInbox /> Signalements
                <span className="badge">{incidents.length}</span>
              </h3>
              <button onClick={fetchIncidents} className="button secondary">
                <FaSyncAlt /> Rafraîchir
              </button>
            </div>
            <div>
              {incidents.length === 0 ? <div className="muted">Aucun signalement</div> : (
                <ul className="incidents-list">
                  {incidents.map(i => (
                    <li key={i.id} className="incident-item">
                      <div className="incident-meta">
                        <FaBell className="incident-icon" />
                        <div style={{display:'flex', flexDirection:'column'}}>
                          <strong> Tâche : {getTaskTitleFromRef(i)}</strong>
                          <span className="incident-time">{new Date(i.created_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false})}</span>
                        </div>
                      </div>
                      <div className="muted">{i.message} {i.team_name ? <em>— équipe : {i.team_name}</em> : null}</div>
                      {!i.resolved_at && (
                        <button className="button success" style={{marginTop:'8px'}} onClick={()=>resolveIncident(i.id)}>Résolu</button>
                      )}
                      {i.resolved_at && (
                        <div className="muted" style={{fontSize:'12px'}}>Résolu le {new Date(i.resolved_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false})}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card card-narrow">
            <div className="card-header">
              <h3 className="card-title"><FaHistory /> Historique des signalements résolus</h3>
              <div className="actions">
                <button onClick={fetchResolvedHistory} className="button secondary"><FaSyncAlt /> Rafraîchir</button>
                <button onClick={downloadResolvedHistory} className="button secondary" title="Télécharger l'historique résolu" aria-label="Télécharger l'historique résolu"><FaDownload /></button>
              </div>
            </div>
            <div className="scroll-area">
              {(!resolvedHistory || Object.keys(resolvedHistory).length === 0) ? <div className="muted">Aucun signalement résolu</div> : (
                Object.entries(resolvedHistory).map(([team, incidents]) => (
                    <div key={team} style={{marginBottom:'16px'}}>
                    <h4 style={{marginBottom:'8px'}}>Équipe : {team}</h4>
                    <div className="table-wrapper">
                      <table className="table">
                      <thead>
                        <tr>
                          <th>Tâche</th>
                          <th>Message</th>
                          <th>Date signalement</th>
                          <th>Date résolution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents.map(inc => (
                          <tr key={inc.id}>
                            <td>{getTaskTitleFromRef(inc)}</td>
                            <td>{inc.message || '-'}</td>
                            <td>{inc.created_at ? new Date(inc.created_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}) : '-'}</td>
                            <td>{inc.resolved_at ? new Date(inc.resolved_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card card-narrow">
            <div className="card-header">
              <h3 className="card-title"><FaHistory /> Historique des tâches</h3>
              <div className="actions">
                <button onClick={()=>{ setShowHistory(s=>!s); if(!showHistory) fetchHistory(); }} className="button secondary">
                  <span>{showHistory ? 'Fermer' : 'Afficher'}</span>
                </button>
                <button onClick={fetchHistory} className="button secondary">
                  <FaSyncAlt /> <span>Rafraîchir</span>
                </button>
                <button onClick={downloadHistory} className="button secondary" title="Télécharger l'historique" aria-label="Télécharger l'historique">
                  <FaDownload />
                </button>
              </div>
            </div>
            {showHistory && (
              <div className="scroll-area">
                {history.length === 0 ? <div className="muted">Aucun historique</div> : (
                  Object.entries(
                    history.reduce((acc, h) => {
                      const team = h.team_name || 'Générale';
                      if (!acc[team]) acc[team] = [];
                      acc[team].push(h);
                      return acc;
                    }, {})
                  ).map(([team, items]) => (
                      <div key={team} style={{marginBottom:'16px'}}>
                      <h4 style={{marginBottom:'8px'}}>Équipe : {team}</h4>
                      <div className="table-wrapper">
                        <table className="table">
                        <thead>
                          <tr>
                            <th className="th">Tâche</th>
                            <th className="th">Status</th>
                            <th className="th">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(h => (
                            <tr key={h.id}>
                              <td className="td">{h.title}</td>
                              <td className="td">{h.status}</td>
                              <td className="td">{h.updated_at ? new Date(h.updated_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}) : (h.created_at ? new Date(h.created_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}) : '-')}</td>
                            </tr>
                          ))}
                        </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h3 className="card-title"><FaTasks /> Nouvelle tâche</h3>
          <form onSubmit={createTask} className="form">
            <input className="input" placeholder="Titre de la tâche" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
            <select className="select" value={form.team_name} onChange={e=>setForm({...form,team_name:e.target.value})}>
              <option value="">-- Aucune équipe / Générale --</option>
              {(company?.teams || []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="select" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
              <option>urgentes</option>
              <option>très importantes</option>
              <option>prioritaires</option>
              <option>faisables</option>
            </select>
            <button type="submit" className="button"><FaPlus /> <span>Créer la tâche</span></button>
          </form>
        </div>

        <div className="section">
          <div className="card-header">
            <h3 className="card-title"><FaTasks /> Tâches en cours {selectedTeam ? ` - ${selectedTeam}` : ''}</h3>
            <button onClick={fetchTasks} className="button secondary"><FaSyncAlt /> Rafraîchir</button>
          </div>
          <div className="table-wrapper">
            <table className="table">
            <thead>
              <tr>
                <th className="th">Titre</th>
                <th className="th">Equipe</th>
                <th className="th">Date</th>
                <th className="th">Priorité</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shownTasks.map(t => (
                <tr key={t.id}>
                  <td className="td">{t.title}</td>
                  <td className="td">{t.team_name || '-'}</td>
                  <td className="td">{t.created_at ? new Date(t.created_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}) : '-'}</td>
                  <td className="td">
                    <div className="priority-indicator">
                      <MdPriorityHigh className={
                        t.priority === 'urgentes' ? 'priority-urgent' :
                        t.priority === 'très importantes' ? 'priority-important' :
                        'priority-normal'
                      } />
                      {t.priority}
                    </div>
                  </td>
                  <td className="td">{t.status}</td>
                  <td className="td"><button className="button danger" onClick={()=>deleteTask(t.id)}>Supprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
 

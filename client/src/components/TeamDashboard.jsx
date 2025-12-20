/**
 * TeamDashboard.jsx
 *
 * Interface pour les équipes :
 * - Voir les tâches assignées à leur société / équipe
 * - Mettre à jour le statut : en cours / effectuée / en attente / incident
 * - Signaler un incident qui sera enregistré côté serveur
 *
 * Note pédagogique : pour un débutant, l'important est de comprendre
 * comment on appelle une API (fetch) et comment on met à jour l'UI après.
 */

import React, {useState, useEffect} from 'react';
import { FaTasks, FaPlay, FaCheck, FaPause, FaExclamationTriangle } from 'react-icons/fa';
import { MdPriorityHigh } from 'react-icons/md';
import '../styles/TeamDashboard.css';

export default function TeamDashboard({token}){
  const [tasks,setTasks] = useState([]);
  useEffect(()=>{ fetchTasks() },[]);

  async function fetchTasks(){
    // Récupère les tâches assignées à l'équipe (ou à la société)
    try{
      const res = await fetch('/api/tasks',{headers:{Authorization:'Bearer '+token}});
      if(res.ok) setTasks(await res.json());
    }catch(e){ console.error(e) }
  }

  async function updateStatus(id,status){
    // Met à jour le statut d'une tâche (optionnellement avec une note pour les incidents)
    const note = status === 'incident' ? prompt('Décrivez l\'incident (note)') : null;
    await fetch('/api/tasks/'+id+'/status',{
      method:'PATCH',
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify({status, note})
    });
    fetchTasks();
  }

  return (
    <div className="team-container fade-in">
      <div className="team-header">
        <h2 className="team-title">
          <FaTasks className="team-icon" />
          Tableau de bord Équipe
        </h2>
        <div>
          <button className="button secondary" onClick={fetchTasks}>
            <FaTasks /> Rafraîchir
          </button>
        </div>
      </div>
      
      <div className="section">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <FaTasks className="empty-icon" />
            <p>Aucune tâche en attente</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Equipe</th>
                <th>Priorité</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>
                    <div className="team-badge">
                      {t.team_name || 'Générale'}
                    </div>
                  </td>
                  <td>
                    <div className={`priority-badge ${
                      t.priority === 'urgentes' ? 'urgent' :
                      t.priority === 'très importantes' ? 'important' :
                      'normal'
                    }`}>
                      <MdPriorityHigh />
                      {t.priority}
                    </div>
                  </td>
                  <td>
                    <div className={`status-badge ${t.status.replace(' ', '-')}`}>
                      {t.status}
                    </div>
                  </td>
                  <td>{t.created_at ? new Date(t.created_at).toLocaleString(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}) : '-'}</td>
                  <td>
                    <div className="task-buttons">
                      <button 
                        className="task-button in-progress"
                        onClick={() => updateStatus(t.id, 'en cours')}
                      >
                        <FaPlay /> En cours
                      </button>
                      <button 
                        className="task-button completed"
                        onClick={() => updateStatus(t.id, 'effectuée')}
                      >
                        <FaCheck /> Effectuée
                      </button>
                      <button 
                        className="task-button waiting"
                        onClick={() => updateStatus(t.id, 'en attente')}
                      >
                        <FaPause /> En attente
                      </button>
                      <button 
                        className="task-button incident"
                        onClick={() => updateStatus(t.id, 'incident')}
                      >
                        <FaExclamationTriangle /> Incident
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

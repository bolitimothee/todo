/**
 * EditUser.jsx
 * Permet à l'admin de modifier un utilisateur : changer mot de passe et date de validité.
 *
 * Utilisation : <EditUser token={token} user={user} onSaved={refreshList} />
 */

import React, {useState} from 'react';

export default function EditUser({token, user, onSaved}) {
  const [password,setPassword] = useState('');
  // convert server ISO (or stored string) to a local datetime string suitable for datetime-local input
  function toLocalInput(v){
    if(!v) return '';
    try{
      const d = new Date(v);
      const tz = d.getTimezoneOffset();
      const local = new Date(d.getTime() - tz * 60000);
      return local.toISOString().slice(0,16);
    }catch(e){ return v; }
  }

  const [validUntil,setValidUntil] = useState(user.valid_until ? toLocalInput(user.valid_until) : '');
  const [msg,setMsg] = useState('');

  async function save(){
    setMsg('');
    try{
      // formater validUntil vers SQL DATETIME ou null
      const formattedValid = validUntil ? (validUntil.replace('T',' ') + (validUntil.length === 16 ? ':00' : '')) : null;
      const res = await fetch('/api/admin/user/' + user.id, {
        method: 'PATCH',
        headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + token},
        body: JSON.stringify({ password: password || undefined, valid_until: formattedValid })
      });
      if(res.ok){
        setMsg('Modifié');
        if(onSaved) onSaved();
      } else {
        const d = await res.json();
        setMsg(d.error || 'Erreur');
      }
    }catch(e){ setMsg('Erreur réseau'); }
  }

  return (
    <div className="card mt-2">
      <div><strong>{user.username}</strong> — {user.role}</div>
      <div className="flex mt-2">
        <input className="input" placeholder="Nouveau mot de passe (laisser vide = inchangé)" value={password} onChange={e=>setPassword(e.target.value)} />
        <input 
          className="input" 
          type="date" 
          value={validUntil.split('T')[0] || ''} 
          onChange={e => {
            const date = e.target.value;
            const time = validUntil.split('T')[1] || '00:00';
            setValidUntil(date ? `${date}T${time}` : '');
          }} 
        />
        <input 
          className="input" 
          type="time" 
          value={validUntil.split('T')[1] || ''} 
          onChange={e => {
            const date = validUntil.split('T')[0] || '';
            const time = e.target.value;
            setValidUntil(date ? `${date}T${time}` : '');
          }} 
        />
        <button className="button secondary" onClick={save}>Enregistrer</button>
      </div>
  {msg && <div className="message success mt-2">{msg}</div>}
    </div>
  )
}

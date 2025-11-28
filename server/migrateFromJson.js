const fs = require('fs');
const path = require('path');

function formatDatetime(isoString){
  if(!isoString) return null;
  try{
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}:${s}`;
  }catch(e){
    return null;
  }
}

async function migrate(pool){
  const dataPath = path.resolve(__dirname, 'data.json');
  if(!fs.existsSync(dataPath)){
    console.log('Aucun fichier data.json trouvé pour migration');
    return;
  }

  try{
    // check if users table already has rows
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM users');
    if(rows && rows[0] && rows[0].cnt > 0){
      console.log('Migration skipped: la table users contient déjà des données');
      return;
    }

    const raw = fs.readFileSync(dataPath,'utf8');
    const json = JSON.parse(raw);

    // migrate companies
    if(Array.isArray(json.companies)){
      for(const c of json.companies){
        const teamsJson = JSON.stringify(c.teams || []);
        await pool.execute(
          'INSERT INTO companies (id, name, numTeams, teams, numManagers, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.numTeams || 0, teamsJson, parseInt(c.numManagers) || 1, formatDatetime(c.updated_at) || new Date()]
        );
      }
    }

    // migrate users
    if(Array.isArray(json.users)){
      for(const u of json.users){
        await pool.execute(
          'INSERT INTO users (id, username, password, role, company_id, team_name, valid_until, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.username, u.password, u.role, u.company_id || null, u.team_name || null, formatDatetime(u.valid_until), formatDatetime(u.created_at)]
        );
      }
    }

    // migrate deletedUsers
    if(Array.isArray(json.deletedUsers)){
      for(const u of json.deletedUsers){
        await pool.execute(
          'INSERT INTO deleted_users (id, username, password, role, company_id, team_name, valid_until, created_at, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [u.id, u.username, u.password, u.role, u.company_id || null, u.team_name || null, formatDatetime(u.valid_until), formatDatetime(u.created_at), formatDatetime(u.deletedAt)]
        );
      }
    }

    // migrate tasks
    if(Array.isArray(json.tasks)){
      for(const t of json.tasks){
        await pool.execute(
          'INSERT INTO tasks (id, title, description, priority, status, company_id, team_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [t.id, t.title, t.description || '', t.priority || '', t.status || '', t.company_id || null, t.team_name || null, formatDatetime(t.created_at), formatDatetime(t.updated_at)]
        );
      }
    }

    // migrate incidents
    if(Array.isArray(json.incidents)){
      for(const i of json.incidents){
        await pool.execute(
          'INSERT INTO incidents (id, task_id, task_title, company_id, team_name, message, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [i.id, i.task_id || null, i.task_title || null, i.company_id || null, i.team_name || null, i.message || null, formatDatetime(i.created_at), formatDatetime(i.resolved_at)]
        );
      }
    }

    console.log('Migration depuis data.json terminée');
  }catch(e){
    console.error('Erreur pendant la migration:', e.message);
  }
}

module.exports = { migrate };

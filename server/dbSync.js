const database = require('./database');
require('dotenv').config();

let pool = null;

async function init(){
  // ensure database is initialized first
  pool = database.getPool();

  try{
    if(process.env.DATABASE_URL || process.env.PGHOST){
      // Postgres
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS app_data (
          id INT PRIMARY KEY,
          data JSONB,
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `);

      const [rows] = await pool.execute('SELECT id FROM app_data WHERE id = ?');
      if(!rows || rows.length === 0) {
        await pool.execute('INSERT INTO app_data (id, data) VALUES (1, ?)', [JSON.stringify({})]);
      }
    } else {
      // MySQL
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_data (
          id INT PRIMARY KEY,
          data JSON,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      const [rows] = await pool.query('SELECT id FROM app_data WHERE id = 1');
      if(rows.length === 0){
        await pool.query('INSERT INTO app_data (id, data) VALUES (1, JSON_OBJECT())');
      }
    }
    console.log('DB sync table ready');
  }catch(e){
    console.error('dbSync init error:', e.message);
  }
}

async function saveDb(dbObj){
  if(!pool) return;
  try{
    const json = JSON.stringify(dbObj);
    if(process.env.DATABASE_URL || process.env.PGHOST){
      await pool.execute('UPDATE app_data SET data = ? WHERE id = 1', [json]);
    } else {
      await pool.query('UPDATE app_data SET data = ? WHERE id = 1', [json]);
    }
  }catch(e){ console.error('dbSync save error:', e.message); }
}

async function loadDb(){
  if(!pool) return null;
  try{
    let rows;
    if(process.env.DATABASE_URL || process.env.PGHOST){
      [rows] = await pool.execute('SELECT data FROM app_data WHERE id = ?');
      if(rows && rows.length > 0){
        const data = rows[0].data;
        if(typeof data === 'object') return data;
        try{ return JSON.parse(data); }catch(e){ return null; }
      }
    } else {
      [rows] = await pool.query('SELECT data FROM app_data WHERE id = 1');
      if(rows && rows.length > 0){
        const data = rows[0].data;
        if(typeof data === 'object') return data;
        try{ return JSON.parse(data); }catch(e){ return null; }
      }
    }
    return null;
  }catch(e){ console.error('dbSync load error:', e.message); return null; }
}

module.exports = { init, saveDb, loadDb };

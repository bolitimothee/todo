const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function init() {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'todo_app';
  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306;

  try {
    pool = mysql.createPool({ host, user, password, database, port, waitForConnections: true, connectionLimit: 10 });

    // create table if not exists
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS app_data (
        id INT PRIMARY KEY,
        data JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.query(createTableSql);

    // ensure a row exists
    const [rows] = await pool.query('SELECT id FROM app_data WHERE id = 1');
    if (rows.length === 0) {
      await pool.query('INSERT INTO app_data (id, data) VALUES (1, JSON_OBJECT())');
    }

    console.log('MySQL sync initialized:', host, database);
  } catch (e) {
    console.error('MySQL init error:', e.message);
    pool = null;
  }
}

async function saveDb(dbObj){
  if(!pool) return;
  try{
    const json = JSON.stringify(dbObj);
    await pool.query('UPDATE app_data SET data = ? WHERE id = 1', [json]);
  }catch(e){
    console.error('MySQL save error:', e.message);
  }
}

async function loadDb(){
  if(!pool) return null;
  try{
    const [rows] = await pool.query('SELECT data FROM app_data WHERE id = 1');
    if(rows && rows.length > 0){
      const data = rows[0].data;
      if(typeof data === 'object') return data;
      try{ return JSON.parse(data); }catch(e){ return null; }
    }
    return null;
  }catch(e){
    console.error('MySQL load error:', e.message);
    return null;
  }
}

module.exports = { init, saveDb, loadDb };

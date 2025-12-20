/*
  Database abstraction supporting MySQL (mysql2) and PostgreSQL (pg)
  - If env var DATABASE_URL or PGHOST is present, use Postgres
  - Else fallback to MySQL (existing behavior)
*/
require('dotenv').config();

let impl = null; // will hold implementation: { init, getPool }

function convertQuestionMarksToDollar(sql){
  let idx = 0;
  return sql.replace(/\?/g, () => {
    idx += 1;
    return '$' + idx;
  });
}

// Postgres implementation
async function initPostgres(){
  const { Pool } = require('pg');
  const connectionString = process.env.DATABASE_URL || null;

  const pool = new Pool(connectionString ? { connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false } : {
    host: process.env.PGHOST || '127.0.0.1',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'todo_app',
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
    max: 10
  });

  // create tables if not exists (Postgres syntax)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(20),
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      valid_until TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS deleted_users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255),
      password VARCHAR(255),
      role VARCHAR(20),
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      valid_until TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ,
      deletedAt TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255),
      numTeams INT DEFAULT 0,
      teams JSONB,
      numManagers INT DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      title TEXT,
      description TEXT,
      priority VARCHAR(50),
      status VARCHAR(50),
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      created_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id VARCHAR(36) PRIMARY KEY,
      task_id VARCHAR(36),
      task_title TEXT,
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      message TEXT,
      created_at TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ
    );
  `);

  // wrapper to provide .execute(sql, params) similar to mysql2
  function execute(sql, params){
    const converted = convertQuestionMarksToDollar(sql);
    return pool.query(converted, params).then(res => [res.rows, res.fields || null]);
  }

  return { init: async () => {}, getPool: () => ({ execute }), rawPool: pool };
}

// MySQL implementation (existing code preserved)
async function initMySql(){
  const mysql = require('mysql2/promise');
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'todo_app';
  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306;

  // create a temporary connection to create database if it doesn't exist
  const tmp = await mysql.createConnection({ host, user, password, port });
  await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tmp.end();

  const pool = mysql.createPool({ host, user, password, database, port, waitForConnections: true, connectionLimit: 10 });

  // create tables if not exists (MySQL syntax)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(20),
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      valid_until DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS deleted_users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255),
      password VARCHAR(255),
      role VARCHAR(20),
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      valid_until DATETIME NULL,
      created_at DATETIME,
      deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255),
      numTeams INT DEFAULT 0,
      teams JSON,
      numManagers INT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      title TEXT,
      description TEXT,
      priority VARCHAR(50),
      status VARCHAR(50),
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      created_at DATETIME,
      updated_at DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS incidents (
      id VARCHAR(36) PRIMARY KEY,
      task_id VARCHAR(36),
      task_title TEXT,
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      message TEXT,
      created_at DATETIME,
      resolved_at DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // return wrapper with execute
  return { init: async () => {}, getPool: () => pool };
}

async function init(){
  if (process.env.DATABASE_URL || process.env.PGHOST) {
    impl = await initPostgres();
    console.log('Postgres initialized');
  } else {
    impl = await initMySql();
    console.log('MySQL initialized');
  }
}

function getPool(){
  if(!impl) throw new Error('Database not initialized');
  return impl.getPool();
}

module.exports = { init, getPool };

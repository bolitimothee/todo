const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function init(){
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'todo_app';
  const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306;

  // create a temporary connection to create database if it doesn't exist
  const tmp = await mysql.createConnection({ host, user, password, port });
  await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tmp.end();

  pool = mysql.createPool({ host, user, password, database, port, waitForConnections: true, connectionLimit: 10 });

  // create tables if not exists
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

}

function getPool(){
  return pool;
}

module.exports = { init, getPool };

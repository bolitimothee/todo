/**
 * Backend Node.js pour Render
 * Adapté pour fonctionner avec Render MySQL + Vercel Frontend
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

console.warn('⚠️  Warning: server/index-render.js is MySQL-specific and deprecated. Prefer `node server/index.js` which supports Postgres (DATABASE_URL).');

// Configuration MySQL
let pool = null;

async function parseConnectionUrl(url) {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      user: urlObj.username,
      password: decodeURIComponent(urlObj.password),
      database: urlObj.pathname.slice(1),
      port: urlObj.port ? parseInt(urlObj.port) : 3306
    };
  } catch (e) {
    console.error('❌ DATABASE_URL invalide:', e.message);
    return null;
  }
}

async function initDB() {
  let config;
  
  if (process.env.DATABASE_URL) {
    console.log('📡 Utilisant DATABASE_URL (Render)...');
    config = await parseConnectionUrl(process.env.DATABASE_URL);
    if (!config) throw new Error('DATABASE_URL invalide');
  } else {
    config = {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'todo_app',
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306
    };
  }

  console.log(`✅ Connexion à MySQL: ${config.host}/${config.database}`);

  pool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0
  });

  // Créer les tables
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      role VARCHAR(20),
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      valid_until DATETIME NULL,
      deleted_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    
    `CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255),
      numTeams INT DEFAULT 0,
      teams JSON,
      numManagers INT DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    
    `CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      title TEXT,
      status VARCHAR(50),
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      deleted_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    
    `CREATE TABLE IF NOT EXISTS incidents (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255),
      description TEXT,
      company_id VARCHAR(36),
      team_name VARCHAR(255),
      resolved_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  for (const table of tables) {
    await pool.execute(table);
  }

  console.log('✅ Tables initialisées');
  
  // Créer l'admin par défaut
  await createAdminUser();
}

async function createAdminUser() {
  try {
    const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [process.env.ADMIN_USERNAME || 'admin']);
    if (users.length > 0) {
      console.log('✅ Admin existe déjà');
      return;
    }
    
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    
    await pool.execute(
      'INSERT INTO users (id, username, password, role, valid_until) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), process.env.ADMIN_USERNAME || 'admin', hashedPassword, 'admin', validUntil]
    );
    console.log('✅ Admin créé');
  } catch (e) {
    console.error('Erreur création admin:', e.message);
  }
}

// Middleware d'authentification
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token invalide ou expiré' });
  }
}

// Routes d'authentification
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];
    
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Identifiants invalides' });
    
    if (user.valid_until && new Date(user.valid_until) < new Date()) {
      return res.status(403).json({ error: 'Accès expiré' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, username, role, company_id, valid_until FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    
    if (user.valid_until && new Date(user.valid_until) < new Date()) {
      return res.status(403).json({ error: 'Accès expiré' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes admin
app.post('/api/admin/create-user', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    
    const { username, password, role, company_id, team_name, valid_until } = req.body;
    const [existing] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    
    if (existing.length > 0) return res.status(400).json({ error: 'Utilisateur existe déjà' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    
    await pool.execute(
      'INSERT INTO users (id, username, password, role, company_id, team_name, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, username, hashedPassword, role, company_id || null, team_name || null, valid_until || null]
    );
    
    res.json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const [users] = await pool.execute('SELECT id, username, role, company_id, team_name, valid_until FROM users WHERE deleted_at IS NULL');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/user/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { password, valid_until } = req.body;
    
    let updates = [], values = [];
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (valid_until !== undefined) {
      updates.push('valid_until = ?');
      values.push(valid_until || null);
    }
    
    if (updates.length === 0) return res.status(400).json({ error: 'Aucune mise à jour' });
    
    values.push(req.params.id);
    await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/user/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    await pool.execute('UPDATE users SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes companies
app.get('/api/companies', authMiddleware, async (req, res) => {
  try {
    const [companies] = await pool.execute('SELECT * FROM companies ORDER BY name');
    const parsed = companies.map(c => ({...c, teams: typeof c.teams === 'string' ? JSON.parse(c.teams) : c.teams}));
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/companies', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { name, numTeams, teams, numManagers } = req.body;
    const id = uuidv4();
    
    await pool.execute(
      'INSERT INTO companies (id, name, numTeams, teams, numManagers) VALUES (?, ?, ?, ?, ?)',
      [id, name, numTeams, JSON.stringify(teams || []), numManagers]
    );
    res.json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    const { name, numTeams, teams, numManagers } = req.body;
    
    await pool.execute(
      'UPDATE companies SET name = ?, numTeams = ?, teams = ?, numManagers = ? WHERE id = ?',
      [name, numTeams, JSON.stringify(teams || []), numManagers, req.params.id]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accès refusé' });
    await pool.execute('DELETE FROM companies WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes tasks
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT * FROM tasks WHERE deleted_at IS NULL';
    const params = [];
    
    if (req.user.role === 'manager') {
      query += ' AND company_id = ?';
      params.push(req.user.company_id);
    } else if (req.user.role === 'team') {
      query += ' AND team_name = ? AND company_id = ?';
      params.push(req.user.team_name, req.user.company_id);
    }
    
    query += ' ORDER BY created_at DESC';
    const [tasks] = await pool.execute(query, params);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, team_name } = req.body;
    const id = uuidv4();
    
    await pool.execute(
      'INSERT INTO tasks (id, title, status, team_name, company_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [id, title, 'pending', team_name, req.user.company_id]
    );
    res.json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/tasks/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    await pool.execute('UPDATE tasks SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/history', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT * FROM tasks WHERE deleted_at IS NOT NULL';
    const params = [];
    
    if (req.user.role === 'manager') {
      query += ' AND company_id = ?';
      params.push(req.user.company_id);
    } else if (req.user.role === 'team') {
      query += ' AND team_name = ? AND company_id = ?';
      params.push(req.user.team_name, req.user.company_id);
    }
    
    query += ' ORDER BY deleted_at DESC';
    const [tasks] = await pool.execute(query, params);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes incidents
app.get('/api/incidents', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT * FROM incidents WHERE resolved_at IS NULL';
    const params = [];
    
    if (req.user.role === 'manager') {
      query += ' AND company_id = ?';
      params.push(req.user.company_id);
    } else if (req.user.role === 'team') {
      query += ' AND team_name = ? AND company_id = ?';
      params.push(req.user.team_name, req.user.company_id);
    }
    
    query += ' ORDER BY created_at DESC';
    const [incidents] = await pool.execute(query, params);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/incidents', authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    const id = uuidv4();
    
    await pool.execute(
      'INSERT INTO incidents (id, title, description, team_name, company_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [id, title, description, req.user.team_name, req.user.company_id]
    );
    res.json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/incidents/:id/resolve', authMiddleware, async (req, res) => {
  try {
    await pool.execute('UPDATE incidents SET resolved_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/incidents/resolved', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT * FROM incidents WHERE resolved_at IS NOT NULL';
    const params = [];
    
    if (req.user.role === 'manager') {
      query += ' AND company_id = ?';
      params.push(req.user.company_id);
    } else if (req.user.role === 'team') {
      query += ' AND team_name = ? AND company_id = ?';
      params.push(req.user.team_name, req.user.company_id);
    }
    
    query += ' ORDER BY resolved_at DESC';
    const [incidents] = await pool.execute(query, params);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check pour Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrer
const PORT = process.env.PORT || 4000;
async function start() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend démarré sur port ${PORT}`);
  });
}

start().catch(e => {
  console.error('❌ Erreur démarrage:', e.message);
  process.exit(1);
});

module.exports = app;

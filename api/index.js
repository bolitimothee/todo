/**
 * TO DO LIST PRO - Backend Serverless pour Vercel
 * Ce fichier exporte l'app Express pour fonctionner avec Vercel
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const database = require('../server/database');
require('dotenv').config();

// Initialisation de l'application
const app = express();
app.use(cors());
app.use(express.json());

// Variables d'environnement
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'please_change_me_in_production';

let pool;
let dbInitialized = false;

// Initialiser la DB une seule fois
async function initDB() {
  if (dbInitialized) return;
  try {
    await database.init();
    pool = database.getPool();
    console.log('✅ Base de données MySQL initialisée');
    const migrateUtil = require('../server/migrateFromJson');
    await migrateUtil.migrate(pool);
    await createAdminUser();
    dbInitialized = true;
  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error);
    throw error;
  }
}

// Helpers MySQL
async function getUserByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE username = ?',
    [username]
  );
  return rows[0];
}

async function createAdminUser() {
  try {
    const admin = await getUserByUsername(ADMIN_USERNAME);
    if (admin) {
      console.log('✅ Utilisateur admin existe déjà');
      return;
    }
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const id = uuidv4();
    // valid_until = 1 an dans le futur
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    await pool.execute(
      'INSERT INTO users (id, username, password, role, valid_until) VALUES (?, ?, ?, ?, ?)',
      [id, ADMIN_USERNAME, hashedPassword, 'admin', validUntil]
    );
    console.log('✅ Utilisateur admin mis à jour/créé');
  } catch (error) {
    console.error('Erreur création admin:', error);
  }
}

// Middleware d'authentification
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token invalide ou expiré' });
  }
}

// Routes d'authentification
app.post('/api/login', async (req, res) => {
  try {
    await initDB();
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    // Vérifier la date d'expiration
    if (user.valid_until) {
      const expiryDate = new Date(user.valid_until);
      if (expiryDate < new Date()) {
        return res.status(403).json({ error: 'Accès expiré - contactez l\'administrateur' });
      }
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, company_id: user.company_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    await initDB();
    const user = await getUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }
    if (user.valid_until) {
      const expiryDate = new Date(user.valid_until);
      if (expiryDate < new Date()) {
        return res.status(403).json({ error: 'Accès expiré' });
      }
    }
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
      valid_until: user.valid_until
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes admin
app.post('/api/admin/create-user', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { username, password, role, company_id, team_name, valid_until } = req.body;
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'L\'utilisateur existe déjà' });
    }
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
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const [users] = await pool.execute('SELECT id, username, role, company_id, team_name, valid_until FROM users WHERE deleted_at IS NULL ORDER BY username');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/admin/user/:id', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { password, valid_until } = req.body;
    let updateQuery = 'UPDATE users SET ';
    const updates = [];
    const values = [];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (valid_until !== undefined) {
      updates.push('valid_until = ?');
      values.push(valid_until || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune mise à jour fournie' });
    }

    updateQuery += updates.join(', ') + ' WHERE id = ?';
    values.push(req.params.id);

    await pool.execute(updateQuery, values);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/user/:id', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    await pool.execute('UPDATE users SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes companies
app.get('/api/companies', authMiddleware, async (req, res) => {
  try {
    await initDB();
    const [companies] = await pool.execute('SELECT * FROM companies ORDER BY name');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/companies', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { name, numTeams, teams, numManagers } = req.body;
    const id = uuidv4();
    const teamsJson = JSON.stringify(teams || []);
    await pool.execute(
      'INSERT INTO companies (id, name, numTeams, teams, numManagers) VALUES (?, ?, ?, ?, ?)',
      [id, name, numTeams, teamsJson, numManagers]
    );
    res.json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { name, numTeams, teams, numManagers } = req.body;
    const teamsJson = JSON.stringify(teams || []);
    await pool.execute(
      'UPDATE companies SET name = ?, numTeams = ?, teams = ?, numManagers = ? WHERE id = ?',
      [name, numTeams, teamsJson, numManagers, req.params.id]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    await pool.execute('DELETE FROM companies WHERE id = ?', [req.params.id]);
    await pool.execute('UPDATE users SET deleted_at = NOW() WHERE company_id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes tasks
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    await initDB();
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
    await initDB();
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
    await initDB();
    const { status } = req.body;
    await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    await initDB();
    await pool.execute('UPDATE tasks SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/history', authMiddleware, async (req, res) => {
  try {
    await initDB();
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
    await initDB();
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
    await initDB();
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
    await initDB();
    const [incidents] = await pool.execute('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    if (incidents.length === 0) {
      return res.status(404).json({ error: 'Signalement introuvable' });
    }
    const incident = incidents[0];
    if (incident.resolved_at) {
      return res.status(400).json({ error: 'Déjà résolu' });
    }
    await pool.execute('UPDATE incidents SET resolved_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/incidents/resolved', authMiddleware, async (req, res) => {
  try {
    await initDB();
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

// Routes trash
app.get('/api/trash', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const [users] = await pool.execute('SELECT id, username, role, company_id, team_name, deletedAt FROM users WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/trash/:id/restore', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const { valid_until } = req.body;
    await pool.execute('UPDATE users SET deleted_at = NULL, valid_until = ? WHERE id = ?', [valid_until || null, req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/trash/:id', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route check expired users
app.get('/api/check-expired-users', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    const now = new Date();
    const [expiredUsers] = await pool.execute('SELECT id, username FROM users WHERE valid_until < ? AND deleted_at IS NULL', [now]);
    res.json({ expiredUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route my-company
app.get('/api/my-company', authMiddleware, async (req, res) => {
  try {
    await initDB();
    if (!req.user.company_id) {
      return res.status(404).json({ error: 'Pas de société assignée' });
    }
    const [companies] = await pool.execute('SELECT * FROM companies WHERE id = ?', [req.user.company_id]);
    if (companies.length === 0) {
      return res.status(404).json({ error: 'Société introuvable' });
    }
    res.json(companies[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Exporter pour Vercel
module.exports = app;

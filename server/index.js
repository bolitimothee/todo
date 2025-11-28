/**
 * TO DO LIST PRO - Backend avec MySQL
 */

// Import des modules nécessaires
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const database = require('./database');
require('dotenv').config();

// Initialisation de l'application
const app = express();
app.use(cors());
app.use(express.json());

// Initialisation de la base de données
let pool;
const migrateUtil = require('./migrateFromJson');

const dbInitPromise = database.init().then(async () => {
    pool = database.getPool();
    console.log('✅ Base de données MySQL initialisée');
    // migrer depuis data.json si besoin
    try{
      await migrateUtil.migrate(pool);
    }catch(e){ console.error('Erreur migration :', e.message); }
    // créer l'admin après initialisation
    await createAdminUser();
}).catch(error => {
    console.error('❌ Erreur initialisation DB:', error);
    process.exit(1);
});

// Variables d'environnement
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'please_change_me_in_production';

// Helpers MySQL
async function getUserByUsername(username) {
    const [rows] = await pool.execute(
        'SELECT * FROM users WHERE username = ?', 
        [username]
    );
    return rows[0];
}

async function getUserById(id) {
    const [rows] = await pool.execute(
        'SELECT * FROM users WHERE id = ?', 
        [id]
    );
    return rows[0];
}

async function createAdminUser() {
    try {
        const existingAdmin = await getUserByUsername(ADMIN_USERNAME);
        const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 8);
        
        if (!existingAdmin) {
            await pool.execute(
                `INSERT INTO users (id, username, password, role, company_id, team_name, valid_until) 
                 VALUES (?, ?, ?, 'admin', NULL, NULL, NULL)`,
                [uuidv4(), ADMIN_USERNAME, hashedPassword]
            );
            console.log('✅ Utilisateur admin créé');
        } else {
            await pool.execute(
                'UPDATE users SET password = ?, role = "admin", company_id = NULL, team_name = NULL, valid_until = NULL WHERE username = ?',
                [hashedPassword, ADMIN_USERNAME]
            );
            console.log('✅ Utilisateur admin mis à jour');
        }
    } catch (error) {
        console.error('❌ Erreur création admin:', error);
    }
}

// Middleware d'authentification
async function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token provided' });
    
    const token = auth.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;

        // Vérifier la validité de l'utilisateur
        const userRecord = await getUserById(payload.id);
        if (!userRecord) {
            // Vérifier si l'utilisateur est dans la corbeille
            const [deletedRows] = await pool.execute(
                'SELECT * FROM deleted_users WHERE id = ?', 
                [payload.id]
            );
            if (deletedRows.length > 0) {
                return res.status(403).json({ error: 'Accès expiré, contactez l\'administrateur' });
            }
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }

        // Vérifier l'expiration
        if (userRecord.valid_until && userRecord.role !== 'admin') {
            const now = new Date();
            const validUntil = new Date(userRecord.valid_until);
            if (now > validUntil) {
                // Déplacer vers la corbeille
                await pool.execute(
                    `INSERT INTO deleted_users (id, username, password, role, company_id, team_name, valid_until, created_at) 
                     SELECT id, username, password, role, company_id, team_name, valid_until, created_at 
                     FROM users WHERE id = ?`,
                    [userRecord.id]
                );
                await pool.execute('DELETE FROM users WHERE id = ?', [userRecord.id]);
                console.log(`User ${userRecord.username} déplacé vers la corbeille`);
                return res.status(403).json({ error: 'Accès expiré, contactez l\'administrateur' });
            }
        }
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// === ROUTES ===

// Route de test
app.get('/api/health', async (req, res) => {
    try {
        const [result] = await pool.execute('SELECT 1 as test');
        res.json({ status: 'OK', database: 'Connected', test: result[0].test });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
});

// Route de login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }

    try {
        const user = await getUserByUsername(username);
        if (!user) return res.status(401).json({ error: 'Identifiants invalides' });
        
        const ok = bcrypt.compareSync(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                company_id: user.company_id, 
                team_name: user.team_name 
            }, 
            JWT_SECRET, 
            { expiresIn: '8h' }
        );
        
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/me
app.get('/api/me', authMiddleware, (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    res.json({
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        company_id: req.user.company_id,
        team_name: req.user.team_name
    });
});

// Route pour créer un utilisateur (admin)
app.post('/api/admin/create-user', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { username, password, role, company_id, team_name, valid_until } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }

    try {
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Utilisateur existe déjà' });
        }

        // Validation des limites de la société
        if (company_id) {
            const [companies] = await pool.execute(
                'SELECT * FROM companies WHERE id = ?', 
                [company_id]
            );
            const company = companies[0];
            
            if (!company) {
                return res.status(400).json({ error: 'Société introuvable' });
            }

            if (role === 'manager') {
                const [managers] = await pool.execute(
                    'SELECT COUNT(*) as count FROM users WHERE company_id = ? AND role = "manager"', 
                    [company_id]
                );
                if (managers[0].count >= company.numManagers) {
                    return res.status(400).json({ 
                        error: `Le nombre maximum de managers (${company.numManagers}) pour cette société est atteint` 
                    });
                }
            }

            if (role === 'team') {
                if (!team_name) {
                    return res.status(400).json({ error: 'Nom d\'équipe requis' });
                }

                let teams = company.teams;
                if (typeof teams === 'string') {
                    try {
                        teams = JSON.parse(teams);
                    } catch (e) {
                        teams = [];
                    }
                }
                if (!Array.isArray(teams) || !teams.includes(team_name)) {
                    return res.status(400).json({ error: 'Cette équipe n\'existe pas dans la société' });
                }

                const [uniqueTeams] = await pool.execute(
                    'SELECT COUNT(DISTINCT team_name) as count FROM users WHERE company_id = ? AND role = "team"', 
                    [company_id]
                );
                
                const [existingTeam] = await pool.execute(
                    'SELECT id FROM users WHERE company_id = ? AND team_name = ? AND role = "team"', 
                    [company_id, team_name]
                );

                if (existingTeam.length === 0 && uniqueTeams[0].count >= company.numTeams) {
                    return res.status(400).json({ 
                        error: `Le nombre maximum d'équipes (${company.numTeams}) pour cette société est atteint` 
                    });
                }
            }
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        const id = uuidv4();

        await pool.execute(
            `INSERT INTO users (id, username, password, role, company_id, team_name, valid_until) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, username, hashedPassword, role, company_id, team_name, valid_until]
        );

        res.json({ ok: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour lister les utilisateurs (admin)
app.get('/api/admin/users', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const [users] = await pool.execute(
            'SELECT id, username, role, company_id, team_name, valid_until FROM users'
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/companies - GET (lister les sociétés)
app.get('/api/companies', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const [companies] = await pool.execute('SELECT id, name, numTeams, teams, numManagers FROM companies');
        res.json(companies.map(c => ({
            ...c,
            teams: typeof c.teams === 'string' ? JSON.parse(c.teams) : c.teams
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/companies - POST (créer une société)
app.post('/api/companies', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, numTeams, teams, numManagers } = req.body;
    if (!name || !numTeams || !teams || !numManagers) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }
    try {
        const id = uuidv4();
        const teamsJson = JSON.stringify(teams);
        await pool.execute(
            'INSERT INTO companies (id, name, numTeams, teams, numManagers) VALUES (?, ?, ?, ?, ?)',
            [id, name, numTeams, teamsJson, numManagers]
        );
        res.json({ ok: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/companies/:id - PUT (mettre à jour une société)
app.put('/api/companies/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, numTeams, teams, numManagers } = req.body;
    try {
        const teamsJson = JSON.stringify(teams);
        await pool.execute(
            'UPDATE companies SET name = ?, numTeams = ?, teams = ?, numManagers = ? WHERE id = ?',
            [name, numTeams, teamsJson, numManagers, req.params.id]
        );
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/companies/:id - DELETE (supprimer une société)
app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const companyId = req.params.id;
        // Déplacer les utilisateurs vers la corbeille
        const [users] = await pool.execute('SELECT * FROM users WHERE company_id = ?', [companyId]);
        for (const u of users) {
            await pool.execute(
                'INSERT INTO deleted_users (id, username, password, role, company_id, team_name, valid_until, created_at, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [u.id, u.username, u.password, u.role, u.company_id, u.team_name, u.valid_until, u.created_at, new Date()]
            );
        }
        await pool.execute('DELETE FROM users WHERE company_id = ?', [companyId]);
        await pool.execute('DELETE FROM tasks WHERE company_id = ?', [companyId]);
        await pool.execute('DELETE FROM incidents WHERE company_id = ?', [companyId]);
        await pool.execute('DELETE FROM companies WHERE id = ?', [companyId]);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/trash - GET (corbeille)
app.get('/api/trash', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const [deletedUsers] = await pool.execute('SELECT * FROM deleted_users');
        res.json(deletedUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/trash/:userId/restore - POST (restaurer un utilisateur)
app.post('/api/trash/:userId/restore', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { valid_until } = req.body;
    try {
        const [deleted] = await pool.execute('SELECT * FROM deleted_users WHERE id = ?', [req.params.userId]);
        if (deleted.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable dans la corbeille' });
        }
        const u = deleted[0];
        await pool.execute(
            'INSERT INTO users (id, username, password, role, company_id, team_name, valid_until, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.username, u.password, u.role, u.company_id, u.team_name, valid_until, u.created_at]
        );
        await pool.execute('DELETE FROM deleted_users WHERE id = ?', [req.params.userId]);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/trash/:userId - DELETE (supprimer définitivement)
app.delete('/api/trash/:userId', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        await pool.execute('DELETE FROM deleted_users WHERE id = ?', [req.params.userId]);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/check-expired-users - GET (vérifier les utilisateurs expirés)
app.get('/api/check-expired-users', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const now = new Date();
        const [users] = await pool.execute('SELECT * FROM users WHERE valid_until < ? AND role != ?', [now, 'admin']);
        for (const u of users) {
            await pool.execute(
                'INSERT INTO deleted_users (id, username, password, role, company_id, team_name, valid_until, created_at, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [u.id, u.username, u.password, u.role, u.company_id, u.team_name, u.valid_until, u.created_at, now]
            );
        }
        await pool.execute('DELETE FROM users WHERE valid_until < ? AND role != ?', [now, 'admin']);
        res.json({ expiredUsers: users, message: `${users.length} utilisateurs déplacés vers la corbeille` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/admin/user/:id - PATCH (mettre à jour un utilisateur)
app.patch('/api/admin/user/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { password, valid_until } = req.body;
    try {
        let query = 'UPDATE users SET';
        const params = [];
        if (password) {
            const hashed = bcrypt.hashSync(password, 8);
            query += ' password = ?';
            params.push(hashed);
        }
        if (valid_until !== undefined) {
            if (params.length > 0) query += ',';
            query += ' valid_until = ?';
            params.push(valid_until || null);
        }
        query += ' WHERE id = ?';
        params.push(req.params.id);
        await pool.execute(query, params);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/admin/user/:id - DELETE (supprimer/déplacer un utilisateur vers la corbeille)
app.delete('/api/admin/user/:id', authMiddleware, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur introuvable' });
        }
        const user = users[0];
        
        // Ne pas supprimer l'admin lui-même
        if (user.role === 'admin') {
            return res.status(400).json({ error: 'Impossible de supprimer un admin' });
        }
        
        // Déplacer vers la corbeille
        const now = new Date();
        await pool.execute(
            'INSERT INTO deleted_users (id, username, password, role, company_id, team_name, valid_until, created_at, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user.id, user.username, user.password, user.role, user.company_id, user.team_name, user.valid_until, user.created_at, now]
        );
        
        // Supprimer de users
        await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        
        res.json({ ok: true, message: 'Utilisateur déplacé vers la corbeille' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/my-company - GET (récupérer la société du manager ou la première pour admin)
app.get('/api/my-company', authMiddleware, async (req, res) => {
    if (!['manager', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    try {
        let query = '';
        let params = [];
        
        if (req.user.role === 'admin') {
            // Admin : retourner la première compagnie ou une compagnie par défaut
            query = 'SELECT * FROM companies LIMIT 1';
        } else {
            // Manager : retourner sa compagnie
            query = 'SELECT * FROM companies WHERE id = ?';
            params = [req.user.company_id];
        }
        
        const [companies] = await pool.execute(query, params);
        if (companies.length === 0) {
            // Si pas de compagnie, retourner une structure par défaut pour admin
            if (req.user.role === 'admin') {
                return res.json({
                    id: null,
                    name: 'Administration',
                    numTeams: 0,
                    teams: [],
                    numManagers: 0
                });
            }
            return res.status(404).json({ error: 'Société introuvable' });
        }
        const c = companies[0];
        res.json({
            ...c,
            teams: typeof c.teams === 'string' ? JSON.parse(c.teams) : c.teams
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/tasks - GET (lister les tâches)
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        let query = 'SELECT * FROM tasks WHERE 1=1';
        let params = [];
        if (req.user.role === 'admin') {
            // L'admin voit tout
        } else if (req.user.role === 'team') {
            query += ' AND company_id = ? AND team_name = ?';
            params = [req.user.company_id, req.user.team_name];
        } else if (req.user.role === 'manager') {
            query += ' AND company_id = ?';
            params = [req.user.company_id];
        }
        const [tasks] = await pool.execute(query, params);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/tasks - POST (créer une tâche)
app.post('/api/tasks', authMiddleware, async (req, res) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    const { title, description, priority, company_id, team_name } = req.body;
    if (!title || !priority || !company_id) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }
    try {
        const id = uuidv4();
        const now = new Date();
        await pool.execute(
            'INSERT INTO tasks (id, title, description, priority, status, company_id, team_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description || '', priority, 'non effectuée', company_id, team_name || null, now, now]
        );
        res.json({ id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/tasks/:id/status - PATCH (mettre à jour le statut d'une tâche)
app.patch('/api/tasks/:id/status', authMiddleware, async (req, res) => {
    const { status, note } = req.body;
    try {
        const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        if (tasks.length === 0) {
            return res.status(404).json({ error: 'Tâche introuvable' });
        }
        const task = tasks[0];
        if (req.user.role !== 'admin' && req.user.company_id !== task.company_id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const now = new Date();
        await pool.execute('UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?', [status, now, req.params.id]);
        if (status === 'incident' && note) {
            const incidentId = uuidv4();
            await pool.execute(
                'INSERT INTO incidents (id, task_id, task_title, company_id, team_name, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [incidentId, req.params.id, task.title, task.company_id, req.user.team_name || null, note, now]
            );
        }
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/tasks/:id - DELETE (supprimer une tâche)
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const [tasks] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
        if (tasks.length === 0) {
            return res.status(404).json({ error: 'Tâche introuvable' });
        }
        const task = tasks[0];
        if (req.user.role !== 'admin' && !(req.user.role === 'manager' && req.user.company_id === task.company_id)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await pool.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        await pool.execute('DELETE FROM incidents WHERE task_id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/tasks/history - GET (historique des tâches)
app.get('/api/tasks/history', authMiddleware, async (req, res) => {
    try {
        let query = 'SELECT * FROM tasks ORDER BY updated_at DESC';
        let params = [];
        if (req.user.role === 'admin') {
            // L'admin voit toutes les tâches
        } else if (req.user.role === 'manager') {
            query = 'SELECT * FROM tasks WHERE company_id = ? ORDER BY updated_at DESC';
            params = [req.user.company_id];
        } else if (req.user.role === 'team') {
            query = 'SELECT * FROM tasks WHERE company_id = ? AND team_name = ? ORDER BY updated_at DESC';
            params = [req.user.company_id, req.user.team_name];
        }
        const [tasks] = await pool.execute(query, params);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/incidents - GET (lister les signalements)
app.get('/api/incidents', authMiddleware, async (req, res) => {
    try {
        let query = 'SELECT * FROM incidents WHERE resolved_at IS NULL';
        let params = [];
        if (req.user.role === 'admin') {
            // L'admin voit tous les signalements
        } else if (req.user.role === 'manager') {
            query += ' AND company_id = ?';
            params = [req.user.company_id];
        } else if (req.user.role === 'team') {
            query += ' AND company_id = ? AND team_name = ?';
            params = [req.user.company_id, req.user.team_name];
        }
        const [incidents] = await pool.execute(query, params);
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/incidents/resolved - GET (historique des signalements résolus)
app.get('/api/incidents/resolved', authMiddleware, async (req, res) => {
    try {
        let query = 'SELECT * FROM incidents WHERE resolved_at IS NOT NULL';
        let params = [];
        if (req.user.role === 'admin') {
            // L'admin voit tous les signalements résolus
        } else if (req.user.role === 'manager') {
            query += ' AND company_id = ?';
            params = [req.user.company_id];
        }
        const [incidents] = await pool.execute(query, params);
        // Grouper par équipe
        const grouped = {};
        for (const inc of incidents) {
            const team = inc.team_name || 'Générale';
            if (!grouped[team]) grouped[team] = [];
            grouped[team].push(inc);
        }
        res.json(grouped);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route /api/incidents/:id/resolve - PATCH (marquer un signalement comme résolu)
app.patch('/api/incidents/:id/resolve', authMiddleware, async (req, res) => {
    try {
        const [incidents] = await pool.execute('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
        if (incidents.length === 0) {
            return res.status(404).json({ error: 'Signalement introuvable' });
        }
        const incident = incidents[0];
        if (req.user.role !== 'admin' && !(req.user.role === 'manager' && req.user.company_id === incident.company_id)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (incident.resolved_at) {
            return res.status(400).json({ error: 'Déjà résolu' });
        }
        const now = new Date();
        await pool.execute('UPDATE incidents SET resolved_at = ? WHERE id = ?', [now, req.params.id]);
        res.json({ ok: true, resolved_at: now });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ... (Continuer avec les autres routes de la même manière)

// Démarrer le serveur
const PORT = process.env.PORT || 4000;

async function startServer() {
    await dbInitPromise; // attendre initialisation DB
    
    // Bind to 0.0.0.0 so other devices on the LAN can reach the server
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT} (écoute toutes interfaces)`);
    });
}

startServer().catch(console.error);
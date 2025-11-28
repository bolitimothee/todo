/**
 * Script SQL pour initialiser la base de données
 * À exécuter une seule fois sur MySQL
 */

-- Créer la base de données (optionnel si elle existe déjà)
-- CREATE DATABASE todopro;
-- USE todopro;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `username` varchar(255) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` enum('admin', 'manager', 'team') NOT NULL,
  `company_id` varchar(36),
  `team_name` varchar(255),
  `valid_until` DATETIME,
  `deleted_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHARSET=utf8mb4,
  COLLATE=utf8mb4_unicode_ci
);

-- Table des sociétés
CREATE TABLE IF NOT EXISTS `companies` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `numTeams` INT NOT NULL DEFAULT 1,
  `teams` JSON,
  `numManagers` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHARSET=utf8mb4,
  COLLATE=utf8mb4_unicode_ci
);

-- Table des tâches
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `title` varchar(255) NOT NULL,
  `status` enum('pending', 'in_progress', 'completed') DEFAULT 'pending',
  `team_name` varchar(255),
  `company_id` varchar(36),
  `deleted_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHARSET=utf8mb4,
  COLLATE=utf8mb4_unicode_ci
);

-- Table des incidents
CREATE TABLE IF NOT EXISTS `incidents` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `title` varchar(255) NOT NULL,
  `description` TEXT,
  `team_name` varchar(255),
  `company_id` varchar(36),
  `resolved_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHARSET=utf8mb4,
  COLLATE=utf8mb4_unicode_ci
);

-- Table des utilisateurs supprimés (corbeille)
CREATE TABLE IF NOT EXISTS `deleted_users` (
  `id` varchar(36) NOT NULL PRIMARY KEY,
  `username` varchar(255),
  `role` enum('admin', 'manager', 'team'),
  `company_id` varchar(36),
  `team_name` varchar(255),
  `deleted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHARSET=utf8mb4,
  COLLATE=utf8mb4_unicode_ci
);

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_name);
CREATE INDEX IF NOT EXISTS idx_incidents_company ON incidents(company_id);
CREATE INDEX IF NOT EXISTS idx_incidents_team ON incidents(team_name);

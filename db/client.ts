import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

export const sqlite = openDatabaseSync('habits.db');

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'daily',
    goal_count INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    notes TEXT
  );
`);

sqlite.execSync(`
  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    habit_id INTEGER,
    period TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite);

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'banking.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending')),
      two_factor_enabled INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      account_number TEXT UNIQUE NOT NULL,
      account_type TEXT DEFAULT 'checking' CHECK(account_type IN ('savings', 'checking')),
      balance INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'frozen', 'closed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      from_account_id TEXT,
      to_account_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('deposit', 'withdrawal', 'transfer', 'admin_credit', 'admin_debit')),
      amount INTEGER NOT NULL CHECK(amount > 0),
      description TEXT DEFAULT '',
      reference TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'pending', 'reversed')),
      performed_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (from_account_id) REFERENCES accounts(id),
      FOREIGN KEY (to_account_id) REFERENCES accounts(id),
      FOREIGN KEY (performed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_user_id TEXT,
      target_account_id TEXT,
      details TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_number ON accounts(account_number);
    CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_ref ON transactions(reference);
    CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
  `);

  // Seed admin user if none exists
  const adminCount = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`).get() as { count: number };
  if (adminCount.count === 0) {
    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');
    const adminId = uuidv4();
    const adminHash = bcrypt.hashSync('Admin@123!', 12);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'admin', 'active', ?, ?)
    `).run(adminId, 'admin@bank.com', adminHash, 'System', 'Admin', now, now);

    const accountId = uuidv4();
    const accountNumber = '1000000001';
    db.prepare(`
      INSERT INTO accounts (id, user_id, account_number, account_type, balance, created_at, updated_at)
      VALUES (?, ?, ?, 'checking', 0, ?, ?)
    `).run(accountId, adminId, accountNumber, now, now);
  }
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

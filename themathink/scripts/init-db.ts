import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://themachine.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function init() {
  // Create users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      subscription TEXT DEFAULT 'free',
      subscription_expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create sessions table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  
  console.log('Database initialized!');
}

init().catch(console.error);

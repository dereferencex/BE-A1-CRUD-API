const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.join(__dirname, '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (err) {
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT,
      done BOOLEAN
    )
  `);

  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM tasks');
  const count = parseInt(rows[0].count, 10);

  if (count === 0) {
    await pool.query(
      'INSERT INTO tasks (title, done) VALUES ($1, $2), ($3, $4), ($5, $6)',
      ['Buy milk', false, 'Write code', true, 'Go for a walk', false]
    );
  }
}

async function getAllTasks() {
  const { rows } = await pool.query('SELECT * FROM tasks');
  return rows;
}

async function getTaskById(id) {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return rows[0] || null;
}

module.exports = { pool, initDb, getAllTasks, getTaskById };

initDb()
  .then(() => {
    if (require.main === module) {
      console.log('Database ready: tasks table ensured, seeded if empty.');
      return pool.end();
    }
  })
  .catch((err) => {
    console.error('Database init failed:', err.message || err);
    process.exit(1);
  });

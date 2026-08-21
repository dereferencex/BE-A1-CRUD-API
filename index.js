const express = require('express');
const Database = require('better-sqlite3');
const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('./openapi.json');

const app = express();
const PORT = 3000;
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

const db = new Database('tasks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0
  )
`);

let tasks = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Write code', done: true },
  { id: 3, title: 'Go for a walk', done: false },
];

const count = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;

if (count === 0) {
  const insert = db.prepare(
    'INSERT INTO tasks (id, title, done) VALUES (?, ?, ?)'
  );

  db.transaction(() => {
    for (const task of tasks) {
      insert.run(task.id, task.title, task.done ? 1 : 0);
    }
  })();
}

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function rowToTask(row) {
  return { id: row.id, title: row.title, done: Boolean(row.done) };
}

app.get('/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks').all();
  res.json(rows.map(rowToTask));
});

app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const row = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(id);

  if (!row) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }

  res.json(rowToTask(row));
});

app.post('/tasks',(req,res)=>{
    const {title} = req.body;

    if(title === undefined || title === null || String(title).trim() === ''){
        return res.status(400).json({
            error: 'title is required and cannot be empty'
        })
    }

    const insert = db.prepare(
    'INSERT INTO tasks (title, done) VALUES (?, ?)'
    );

    const result = insert.run(String(title).trim(), 0);

    const row = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(result.lastInsertRowid);

    res.status(201).json(rowToTask(row));
})

app.put('/tasks/:id',(req,res)=>{
    const id = Number(req.params.id);
    const task = tasks.find(t => t.id === id);

    if(!task){
        return res.status(404).json({ error: `Task ${id} not found`});
    }

    const {title,done} = req.body ?? {};
    const hasTitle = "title" in req.body ?? {};
    const hasDone = "done" in req.body ?? {};

    if(!hasTitle && !hasDone) {
    return res.status(400).json({ error: 'request body must include title and/or done' });
  }

  if(hasTitle){
    if (title === null || String(title).trim() === '') {
      return res.status(400).json({ error: 'title cannot be empty' });
    }
    task.title = String(title).trim();
  }

  if(hasDone){
    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'done must be a boolean' });
    }
    task.done = done;
  }

  res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if(index === -1){
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openApiSpec = require('./openapi.json');
const pgDb = require('./db');

const app = express();
const PORT = 3000;
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function rowToTask(row) {
  return { id: row.id, title: row.title, done: Boolean(row.done) };
}

app.get('/tasks', async (req, res) => {
  const rows = await pgDb.getAllTasks();
  res.json(rows.map(rowToTask));
});

app.get('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const row = await pgDb.getTaskById(id);

  if (!row) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }

  res.json(rowToTask(row));
});

app.post('/tasks', async (req,res)=>{
    const {title} = req.body;

    if(title === undefined || title === null || String(title).trim() === ''){
        return res.status(400).json({
            error: 'title is required and cannot be empty'
        })
    }

    const row = await pgDb.createTask(String(title).trim());

    res.status(201).json(rowToTask(row));
})

app.put('/tasks/:id', async (req,res)=>{
    const id = Number(req.params.id);
    const task = await pgDb.getTaskById(id);


    if(!task){
        return res.status(404).json({ error: `Task ${id} not found`});
    }

    const body = req.body ?? {};
    const { title, done } = body;
    const hasTitle = 'title' in body;
    const hasDone = 'done' in body;

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

  const newTitle = hasTitle ? String(title).trim() : task.title;
  const newDone = hasDone ? done : Boolean(task.done);

  const updatedTask = await pgDb.updateTask(id, newTitle, newDone);

  res.json(rowToTask(updatedTask));
});

app.delete('/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);

  const rowCount = await pgDb.deleteTask(id);

  if (rowCount === 0) {
    return res.status(404).json({
      error: `Task ${id} not found`
    });
  }

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

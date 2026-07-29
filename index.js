const express = require('express');
const app = express();
const PORT = 3000;
app.use(express.json());

let tasks = [
  { id: 1, title: 'Buy milk', done: false },
  { id: 2, title: 'Write code', done: true },
  { id: 3, title: 'Go for a walk', done: false },
];

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: `Task ${id} not found` });
  res.json(task);
});

app.post('/tasks',(req,res)=>{
    const {title} = req.body;

    if(title === undefined || title === null || String(title).trim === ''){
        return res.status(400).json({
            error: 'title is required and cannot be empty'
        })
    }

    const id = tasks.length === 0 ? 1 : Math.max(...tasks.map(t => t.id))+1;
    const task = {id , title: String(title), done: false}

    tasks.push(task)
    res.status(201).json(task)
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

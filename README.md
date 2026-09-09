# Task API

A simple Express.js REST API for managing tasks, backed by Postgres. Built as an internship project.

On startup the app connects with `DATABASE_URL`, creates the `tasks` table if it doesn't exist, and seeds three example tasks only if the table is empty.

## Run everything (one command)

```bash
cp .env.example .env
docker compose up
```

The API starts at `http://localhost:3000`. Swagger UI is available at `/docs`.

To run just the API locally against your own Postgres instead:

```bash
npm install && node index.js
```

## Configuration

All settings live in `.env` — copy the template first:

```bash
cp .env.example .env
```

| Variable     | Used for                                              | Example                                      |
|--------------|-------------------------------------------------------|----------------------------------------------|
| `DATABASE_URL` | Postgres connection string used by `db.js` on startup | `postgres://postgres:dev@localhost:5432/tasks` |

Under `docker compose`, the `api` service overrides `DATABASE_URL` to reach the database by its service name (`postgres://postgres:dev@db:5432/tasks`), so no extra setup is needed there.

## Endpoints

| Method | Path         | Description          | Success |
|--------|--------------|----------------------|---------|
| GET    | `/`          | API info             | `200`   |
| GET    | `/health`    | Health check         | `200`   |
| GET    | `/tasks`     | List all tasks       | `200`   |
| GET    | `/tasks/:id` | Get a task by ID     | `200` (`404` if unknown) |
| POST   | `/tasks`     | Create a task        | `201` (`400` if title missing/empty) |
| PUT    | `/tasks/:id` | Update a task        | `200` (`404` if unknown) |
| DELETE | `/tasks/:id` | Delete a task        | `204` (`404` if unknown) |

Unknown task ids return `404` with `{ "error": "Task not found" }`.

## Example

```bash
curl -i http://localhost:3000/tasks
```

```
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 226
ETag: W/"e2-TbQnG1MycFp+eh0jMZnhBNnGmJ8"
Date: Wed, 09 Sep 2026 10:41:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":1,"title":"Buy milk","done":false},{"id":2,"title":"Write code","done":true},{"id":3,"title":"Go for a walk","done":false},{"id":4,"title":"Docker task one","done":false},{"id":5,"title":"Docker task two","done":false}]
```

## Database

The stack runs Postgres (`db` service, data kept in the `taskdata` volume) with one table:

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT,
  done BOOLEAN
);
```

Inspect it with:

```bash
docker exec -it <db-container> psql -U postgres -d tasks -c "\dt"
docker exec -it <db-container> psql -U postgres -d tasks -c "SELECT * FROM tasks ORDER BY id;"
```

![Tasks table in Postgres](screenshots/database.png)

## Swagger UI

Open `http://localhost:3000/docs` in your browser.

![Swagger UI](screenshots/swagger-ui.png)

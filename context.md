# Project context — Matt's 21st

A small web app for guests of Matt's 21st birthday. It gives attendees a single place to:

- Read event info (when, where, dress code, etc.)
- Arrange travel / share lifts
- Upload and browse pictures

## Stack

- **Frontend** — React 18 + Vite + Tailwind CSS, in `frontend/`
- **Backend** — Node.js (ESM) + Express + `pg` + `multer`, in `backend/`
- **Database** — PostgreSQL 16
- **Containerisation** — Docker Compose orchestrates `frontend`, `backend`, and `db`

## Layout

```
.
├── docker-compose.yml          # all three services
├── .gitignore
├── context.md                  # you are here
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   └── init.sql            # mounted into the postgres container on first boot
│   └── src/
│       ├── index.js            # Express entrypoint
│       ├── db.js               # pg pool
│       └── routes/
│           ├── info.js         # GET /api/info
│           ├── travel.js       # GET/POST /api/travel
│           └── pictures.js     # GET /api/pictures, POST /api/pictures (multipart)
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── index.css
```

## Running locally (Windows / PowerShell)

The expected dev workflow is Docker Compose — it brings up Postgres, the backend (with `node --watch`), and the Vite dev server in one command.

```powershell
docker compose up --build
```

Services:

| Service  | URL                        |
| -------- | -------------------------- |
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:3001      |
| Postgres | localhost:5432             |

Health check: `GET http://localhost:3001/api/health` returns `{ status: "ok", db: "connected" }` once Postgres is reachable.

To stop: `docker compose down`. To wipe the database volume: `docker compose down -v`.

### Running without Docker

Either service can be run directly, but you'll need a local Postgres reachable at the URL in `backend/.env` (copy from `.env.example`).

```powershell
# backend
cd backend
npm install
npm run dev

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Note: `npm install` has not been run yet — there are no `package-lock.json` files or `node_modules/` checked in. The Docker build runs `npm install` inside each container.

## Database schema

Defined in `backend/db/init.sql`, auto-applied by the `postgres:16-alpine` image on first volume init. Tables:

- `event_info(id, title, body, display_order, created_at)` — content rendered on the homepage. Seeded with three placeholder rows (When / Where / Dress code) that should be edited directly in the DB or via a future admin UI.
- `travel_arrangements(id, name, mode, departure_location, departure_time, seats_available, notes, created_at)` — lifts/rides offered or requested.
- `pictures(id, uploader_name, caption, filename, url, uploaded_at)` — uploaded photo metadata. Files themselves live on disk in `backend/uploads/` (mounted as a bind volume in compose, served at `/uploads/<filename>`).

If you change `init.sql`, you must `docker compose down -v` to re-trigger initialisation — the script only runs on an empty data volume.

## Environment variables

Backend reads from `process.env` (see `backend/.env.example`):

- `PORT` (default 3001)
- `DATABASE_URL`
- `NODE_ENV`

Frontend reads `VITE_API_URL` at build time; defaults to `http://localhost:3001` if unset. Compose injects it pointing at the host-mapped backend port.

Postgres credentials in `docker-compose.yml` default to `matts21st` / `devpassword` / db `matts21st`. These are dev-only; override via env when deploying.

## API surface (current)

| Method | Path                | Purpose                                           |
| ------ | ------------------- | ------------------------------------------------- |
| GET    | `/api/health`       | Liveness + DB ping                                |
| GET    | `/api/info`         | List event info entries                           |
| GET    | `/api/travel`       | List travel arrangements                          |
| POST   | `/api/travel`       | Create a travel arrangement (JSON body)           |
| GET    | `/api/pictures`     | List uploaded pictures (metadata)                 |
| POST   | `/api/pictures`     | Upload a picture (multipart, field name `image`)  |
| GET    | `/uploads/:file`    | Static file serving for uploaded images           |

No auth yet. Anyone who can reach the backend can post travel and upload images. That's fine for local dev; **must** be addressed before this is exposed publicly (rate limiting at minimum, ideally a guest token / passcode).

## What is intentionally not built yet

- No auth / guest-passcode gating
- No admin UI for editing `event_info` (edit DB directly for now)
- No travel UI on the frontend — only the info section is wired up; `App.jsx` has placeholder cards for travel and pictures
- No image thumbnails, no virus scanning, no S3 — uploads land on the backend container's local disk
- No tests
- No production Dockerfiles — current frontend image runs the Vite dev server, not a static build behind nginx
- No CI

## Conventions

- Backend is ESM (`"type": "module"`), Node 20.
- Routes are split by resource under `backend/src/routes/`.
- Tailwind only — no component library yet.
- Windows host: paths in this repo use forward slashes; PowerShell handles them fine. When invoking Docker, prefer `docker compose` (v2 syntax) over `docker-compose`.

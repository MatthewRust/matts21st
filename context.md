# Project context — Matt's 21st

A small web app for guests of Matt's 21st birthday. It gives attendees a single place to:

- Read event info (when, where, etc.)
- Arrange travel / share lifts
- Upload and browse pictures

## Stack

- **Frontend** — React 18 + Vite + Tailwind CSS + react-router-dom 6, in `frontend/`
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
│           ├── users.js        # /api/users
│           ├── cars.js         # /api/cars (+ /:id/join)
│           ├── pictures.js     # /api/pictures (multipart upload)
│           └── auth.js         # POST /api/auth/login
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              # router shell (BrowserRouter + AuthProvider)
        ├── index.css            # Google Fonts + tartan + parchment utilities
        ├── assets/images/hamiltonTartan.png
        ├── context/
        │   └── AuthContext.jsx  # localStorage-backed auth + login/signup/logout
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   └── InvitationCard.jsx
        └── pages/
            ├── Home.jsx         # event info homepage (protected)
            ├── Login.jsx        # invitation-styled login form
            └── Signup.jsx       # invitation-styled signup + optional car form
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

Defined in `backend/db/init.sql`, auto-applied by the `postgres:16-alpine` image on first volume init. Schema was designed via draw.io ER diagram and implemented on 2026-05-11.

**Tables:**

- `event_info(id, title, body, display_order, created_at)` — static content for the homepage. Seeded with When/Where rows; edit directly in DB or via a future admin UI. Because the seed only runs on an empty volume, `backend/db/sync-event-info.js` re-applies the canonical rows to an existing database (`docker compose exec backend node db/sync-event-info.js`).

- `users(user_id, username, password, profile_pic_url, driver, car_id, public_transport_id, ex_drinks, daily_drinks, total_drinks)` — every guest who registers. `ex_drinks` (nullable INTEGER) is the self-reported expected number of drinks set at signup. `daily_drinks` (INTEGER NOT NULL DEFAULT 0) is the live per-day tally incremented via `PATCH /api/drinks/:id`; it resets to 0 at 23:59:59 each night via the server-side cron job. `total_drinks` (INTEGER NOT NULL DEFAULT 0) is the cumulative all-time count — it receives `daily_drinks` added to it each night before the reset. `driver` boolean flags whether they offer a car. `car_id` is set when a driver creates a car or a passenger joins one. `public_transport_id` is nullable, reserved for future public-transport linking. Passwords are stored **plain text** for now — hashing (bcrypt) must be added before public deployment.

- `cars(car_id, driver_id, max_num_passenger, current_num_passenger, description, departure_time, departure_location)` — one row per car offered. `driver_id` → `users.user_id`. `departure_time` (TIMESTAMPTZ) and `departure_location` (VARCHAR) are both nullable and captured from the signup form. There is a circular FK: `users.car_id` → `cars.car_id`; handled in `init.sql` via `ALTER TABLE … ADD CONSTRAINT` inside a `DO $$` block run after both tables exist.

- `pictures(picture_id, uploader_id, description, url, filename, upload_time)` — photo metadata. `uploader_id` → `users.user_id`. Files live on disk in `backend/uploads/`, served at `/uploads/<filename>`.

If you change `init.sql`, you must `docker compose down -v` to re-trigger initialisation — the script only runs on an empty data volume.

## Environment variables

Backend reads from `process.env` (see `backend/.env.example`):

- `PORT` (default 3001)
- `DATABASE_URL`
- `NODE_ENV`

Frontend reads `VITE_API_URL` at build time; defaults to `http://localhost:3001` if unset. Compose injects it pointing at the host-mapped backend port.

Postgres credentials in `docker-compose.yml` default to `matts21st` / `devpassword` / db `matts21st`. These are dev-only; override via env when deploying.

## API surface (current)

| Method | Path                  | Purpose                                                         |
| ------ | --------------------- | --------------------------------------------------------------- |
| GET    | `/api/health`         | Liveness + DB ping                                              |
| GET    | `/api/info`           | List event info entries                                         |
| GET    | `/api/users`          | List users (passwords excluded)                                 |
| GET    | `/api/users/:id`      | Get single user                                                 |
| POST   | `/api/users`          | Create user `{ username, password, driver?, profile_pic_url? }` |
| POST   | `/api/auth/login`     | Authenticate `{ username, password }` → user object (no password) or 401 |
| GET    | `/api/drinks/:id`     | Fetch `{ daily_drinks, total_drinks, ex_drinks }` for a user             |
| PATCH  | `/api/drinks/:id`     | `{ action: 'increment' \| 'decrement' }` → updates `daily_drinks` only; returns `{ daily_drinks, total_drinks, ex_drinks }`. Decrement floors at 0. |
| GET    | `/api/leaderboard`    | All users with `daily_drinks`, `total_drinks`, sorted by `daily_drinks DESC`. Frontend re-sorts for total tab. |
| GET    | `/api/cars`           | List cars (includes driver username)                            |
| GET    | `/api/cars/:id`       | Get single car                                                  |
| POST   | `/api/cars`           | Create car `{ driver_id, max_num_passenger, description?, departure_time?, departure_location? }` |
| POST   | `/api/cars/:id/join`  | Passenger joins car `{ user_id }` — increments passenger count  |
| GET    | `/api/pictures`       | List pictures (includes uploader username)                      |
| POST   | `/api/pictures`       | Upload picture (multipart: `image` file + `uploader_id` + `description?`) |
| GET    | `/uploads/:file`      | Static file serving for uploaded images                         |

**Auth is frontend-only.** `/api/auth/login` verifies plain-text passwords and returns the user record; the frontend stores it in `localStorage` under `matts21st.user` via `AuthContext` (`frontend/src/context/AuthContext.jsx`) and uses it to gate the `/` route via `ProtectedRoute`. The backend still does not enforce auth on any other endpoint — anyone hitting the API directly bypasses the gate. Server-side enforcement (middleware checking a session/token, plus bcrypt password hashing) is still required before public deployment.

## Frontend routes

| Path       | Component  | Notes                                                      |
| ---------- | ---------- | ---------------------------------------------------------- |
| `/login`   | `Login`    | Invitation-styled form. Calls `auth.login()`.              |
| `/signup`  | `Signup`   | Invitation-styled form. `driver` checkbox reveals car fields. Calls `auth.signup()` which chains `POST /api/users` then (if driver) `POST /api/cars`. |
| `/`        | `Home`     | Protected. Event info + placeholder cards. Header shows username + user-icon button (top-right) that links to `/profile`. |
| `/profile` | `Profile`  | Protected. Invitation card showing profile picture (with SVG fallback), username, driver/guest status, and (if driver) live car details fetched from `GET /api/cars/:id`. **Edit** button is a disabled stub. **Logout** button calls `auth.logout()` and redirects to `/login`. |
| `/drinks`  | `DrinkIncrementer` | Protected. Parchment card with `pint.jpg` flanked by − and + buttons. Each press fires `PATCH /api/drinks/:id` immediately (optimistic UI, rolls back on error). Shows running total; if `ex_drinks` is set shows `"X of Y planned"`. |

## Frontend styling system

- Fonts loaded from Google Fonts in `index.css`:
  - `font-invite` — Cormorant Garamond (serif, for headings and labels)
  - `font-hand` — Caveat (handwriting, for input contents and incidental copy)
- Tartan background utilities in `index.css`:
  - `.bg-tartan` — tiled `hamiltonTartan.png` (preferred; preserves pattern)
  - `.bg-tartan-stretch` — stretched, available as fallback
- `.bg-parchment` — cream invitation paper colour with subtle radial gradients
- `<Navbar>` — shared top navigation bar (`components/Navbar.jsx`) used on all protected pages (Home, Profile, Drinks). Dark `stone-950` strip with Cormorant Garamond text. Links: "Matt's 21st" title → `/`, "Home", "The Tally", profile icon → `/profile`. Active link highlighted in amber. Uses `useLocation` for active-state detection.
- `<InvitationCard>` — wrapper component (`components/InvitationCard.jsx`) that applies parchment + shadow + slight rotation. Login uses `-rotate-2`, Signup uses `rotate-[1.5deg]`. Exports `inviteInputClass`, `inviteLabelClass`, and `inviteButtonClass` for consistent form styling (transparent inputs with bottom-border-only "lines to write on", small-caps serif labels, wax-seal-style red submit buttons).

## What is intentionally not built yet

- **Passwords stored in plain text** — bcrypt hashing needed before deployment
- **Auth is client-side only** — backend endpoints (other than `/api/auth/login`) are not protected; anyone hitting the API directly bypasses the React-side `ProtectedRoute`
- No admin UI for editing `event_info` (edit DB directly for now)
- No frontend UI for travel/pictures yet — `Home.jsx` has placeholder cards.
- Profile **Edit** button is a disabled stub — editing user details is not yet implemented.
- No profile picture upload — `profile_pic_url` defaults to `'default_pic.png'` (non-existent file); the profile page SVG avatar fallback fires automatically.
- No image thumbnails, no virus scanning, no S3 — uploads land on the backend container's local disk
- No tests
- No production Dockerfiles — current frontend image runs the Vite dev server, not a static build behind nginx
- No CI

## Conventions

- Backend is ESM (`"type": "module"`), Node 20.
- Routes are split by resource under `backend/src/routes/`.
- Tailwind only — no component library yet.
- Windows host: paths in this repo use forward slashes; PowerShell handles them fine. When invoking Docker, prefer `docker compose` (v2 syntax) over `docker-compose`.

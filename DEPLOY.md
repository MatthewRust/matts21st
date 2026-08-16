# Deploying to Render

The site is already deployed on Render as three services created by hand in the
dashboard: the frontend, the backend API, and a Postgres database. That
configuration (build commands, start commands, environment variables) lives in
**Render's dashboard, not in this repo** — nothing here describes it.

There is deliberately no `render.yaml` Blueprint. A Blueprint does not adopt
existing hand-made services; it would create a second, duplicate set alongside
them. Don't add one without first deleting the current services.

## The secret-handling rule

Production secrets live in **Render's dashboard**, never in the repo.

- `backend/.env` — real values, **gitignored**, local development only.
- `backend/.env.example` — committed template with blank values. Never put a
  real key here; it is a tracked file (`.gitignore` line 71 un-ignores it).

Both services deploy from **`main`** with **Auto-Deploy on commit**, and each
has a Root Directory set (`backend` / `frontend`), so a change touching only
one half rebuilds only that service.

Because auto-deploy is on, **set the Cloudinary environment variables before
merging to `main`** — otherwise the new upload code goes live for a window with
no credentials and quietly writes photos to the disposable disk.

## Changes needed on Render before the next deploy

### 1. Cloudinary credentials (required — photos break without them)

On the **backend** service → Environment, add:

| Key | Where to get it |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard → Settings → API Keys |
| `CLOUDINARY_API_KEY` | same |
| `CLOUDINARY_API_SECRET` | same |
| `CLOUDINARY_FOLDER` | optional, defaults to `matts21st` |

The same values are in your local `backend/.env`.

If these are missing the backend does **not** crash. It logs
`[storage] Cloudinary not configured`, silently writes uploads to the
container's disk, and Render destroys that disk on every redeploy — so photos
vanish without any error. After deploying, confirm the log line reads
`[storage] Cloudinary enabled`.

### 2. Build commands

This repo uses **Yarn Classic (1.22)** — `yarn.lock` committed, no
`package-lock.json`. Yarn 1.22 is Render's default, so nothing needs pinning.

Current dashboard settings, and what they should be:

| Service | Root Dir | Build Command | Start Command |
| --- | --- | --- | --- |
| backend (web service) | `backend` | `yarn` → prefer `yarn install --frozen-lockfile` | `yarn start` ✅ |
| frontend (static site) | `frontend` | `npm install && npm run build` → **change to** `yarn install --frozen-lockfile && yarn build` | *(static — none)* |

Neither current command hard-fails against the yarn-locked repo:

- Backend `yarn` installs from `yarn.lock` correctly. Switching it to
  `--frozen-lockfile` is a small upgrade: it makes the build fail loudly if
  `yarn.lock` and `package.json` ever drift, instead of quietly rewriting the
  lockfile mid-build.
- Frontend `npm install` still works (unlike `npm ci`, it doesn't require a
  lockfile) — but it ignores `yarn.lock` and resolves its own versions, so the
  deployed frontend would be built from a dependency tree nobody tested. This
  is the one command actually worth changing.

`yarn start` runs `node src/index.js`. Never use `yarn dev`: that runs
`node --watch`, a development file-watcher that restarts on disk churn.

### 3. Check the SPA rewrite rule

The frontend is a static site serving a React Router app. Render needs a
**Redirect/Rewrite** rule of `/*` → `/index.html` (type: Rewrite), or any
direct link or refresh on a sub-path — `/travel`, `/profile` — returns 404,
because no such file exists on disk. Client-side navigation from the homepage
still works, which is why this can go unnoticed until someone shares a deep
link. Check the service's Redirects/Rewrites tab.

### 4. Confirm `VITE_API_URL`

Set on the frontend static site, pointing at the backend's `onrender.com` URL.
Vite inlines it at **build** time, so changing it requires a rebuild, not a
restart. If it were missing the site would be calling `localhost:3001` and
failing entirely — so if the deployed site works today, this is already set.

## Starting the database fresh before sending the link out

When you wipe and recreate the database, remember it comes up **empty** —
Render does not run `backend/db/init.sql` (that only happens for the local
Docker container, which mounts it into `docker-entrypoint-initdb.d`). Recreate
the schema by hand using the new database's External URL:

```bash
psql "<external-database-url>" -f backend/db/init.sql
```

Every statement is `CREATE TABLE IF NOT EXISTS`, so re-running is safe.

Then check the backend service's `DATABASE_URL` still points at the new
database — if the old one was linked by hand rather than via Render's database
picker, the connection string will have changed.

Note that **photos already uploaded to Cloudinary survive** a database wipe.
Their `pictures` rows are gone, so they disappear from the gallery listing, but
the files remain in the Cloudinary `matts21st` folder until deleted there.

## Free-tier limits worth knowing

| Limit | Effect here |
| --- | --- |
| Free Postgres expires **30 days** after creation, deleted after a further 14 | Fine — the database is being recreated shortly before the event, so the clock restarts then |
| Free web services spin down after **15 min** idle, ~1 min cold start | First visitor after a quiet spell waits ~a minute. Load the site ~5 min before guests arrive to absorb it |
| 750 free instance-hours per month per workspace | One always-on service uses ~730 |

Cloudinary's free tier has no expiry.

## Package manager

Use yarn everywhere — mixing managers is what causes trouble. Running
`npm install` would ignore `yarn.lock`, resolve its own versions, write a
competing `package-lock.json`, and leave you deploying a tree you never tested.

```bash
yarn install          # not npm install
yarn dev              # not npm run dev
yarn add <package>    # not npm install <package>
```

If yarn isn't on your PATH, Node bundles `corepack` — prefix with it
(`corepack yarn install`). Never commit a `package-lock.json`.

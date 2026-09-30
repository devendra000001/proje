# RSS VNIT Shakha Portal

Deployment guide for the existing React/Vite frontend, Express API, and MongoDB Atlas database.

## Architecture

```text
Browser -- HTTPS --> Vercel static React app -- HTTPS API --> Render Node/Express --> MongoDB Atlas
```

The client uses bearer JWT authentication. The API must remain available over HTTPS and its CORS allowlist must include the deployed Vercel origin.

## Prerequisites

- Node.js 20 or later and npm
- A MongoDB Atlas project and cluster
- A Vercel account for the frontend and a Render account for the API
- An administrator username and a unique password of at least 12 characters

## Local development

Install dependencies in `server` and `client` with `npm install`. Copy `server/.env.example` to `server/.env`, then set a local MongoDB URI and a random `JWT_SECRET` of at least 32 characters. Set `NODE_ENV=development` and `FRONTEND_ORIGIN=http://localhost:3000` locally. In `client/.env`, set `VITE_API_URL=/api` to use the Vite proxy, or use `http://localhost:5000/api` directly.

Start the API with `npm run dev` in `server` and the UI with `npm run dev` in `client`. Visit `http://localhost:3000/login`; health is at `http://localhost:5000/api/health`.

There is no automatic seed process. Use `npm run reset-db -- --confirm` only for an intentional portal data reset. It clears only the User, Member, Event, Attendance, and EventRemark collections.

## Environment variables

### Render backend

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Set automatically by Render; optional locally |
| `MONGODB_URI` | Atlas connection string with production database name |
| `JWT_SECRET` | Unique random secret of at least 32 characters |
| `JWT_EXPIRES_IN` | Optional; defaults to `12h` |
| `FRONTEND_ORIGIN` | Exact Vercel origin, e.g. `https://your-portal.vercel.app` |

Never place credentials in the repository or frontend variables. `server/.env` is ignored by Git; `.env.example` contains placeholders only.

### Vercel frontend

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

Set it for Production, Preview, and Development environments as needed. Vite embeds `VITE_*` values into the public JavaScript bundle; this variable must contain only the public API URL.

## MongoDB Atlas setup

1. Create a production database and a dedicated database user with access only to that database.
2. Configure Atlas Network Access for the Render service's outbound addresses. If the Render plan does not provide stable outbound addresses, Atlas may require `0.0.0.0/0`; use a strong database password and least-privilege database user in that case.
3. Copy the Atlas `mongodb+srv://` connection string, include the database name, and URL-encode special characters in the username/password.
4. Set the string only in Render's `MONGODB_URI` secret field. Do not paste it into logs, frontend variables, or committed files.
5. Enable Atlas automated backups or scheduled snapshots and test restore procedures. Decide retention and recovery objectives before launch.

The API waits for MongoDB before listening and exits startup on connection failure. `/api/health` returns HTTP 200 only when Mongoose is connected; otherwise it returns HTTP 503 without connection details.

## First administrator bootstrap

Run this once against the production database from a trusted machine with `server/.env` configured for the same Atlas URI, or provide the values as environment variables in the execution environment:

```powershell
cd server
$env:BOOTSTRAP_ADMIN_NAME = "RSS VNIT Admin"
$env:BOOTSTRAP_ADMIN_USERNAME = "adminuser"
$env:BOOTSTRAP_ADMIN_PASSWORD = "use-a-unique-password-at-least-12-chars"
npm run create-admin
Remove-Item Env:BOOTSTRAP_ADMIN_NAME, Env:BOOTSTRAP_ADMIN_USERNAME, Env:BOOTSTRAP_ADMIN_PASSWORD
```

The script hashes the password, creates an active `admin`, prints only the username, and refuses to overwrite an existing username. Avoid putting real passwords in shell history; use an approved secret manager or temporary environment injection.

## Create and manage normal members

Sign in as an administrator, open **Members**, and choose **Register Swayamsevak**. Creating a member creates an active member profile and a linked login account, with role `member` by default. Admin-only routes allow deactivation/reactivation and password reset. Passwords must be at least 12 characters (maximum 72 UTF-8 bytes). Password reset invalidates the member's existing JWT sessions. The backend enforces these permissions independently of the UI.

## Render backend deployment

1. Create a **Web Service** connected to this repository.
2. Set **Root Directory** to `server`.
3. Select the Node runtime. Build command: `npm install`. Start command: `npm start`.
4. Add the Render environment variables in the table above. `MONGODB_URI`, `JWT_SECRET`, and production `FRONTEND_ORIGIN` are required. Let Render provide `PORT`.
5. Deploy and wait for the service to become healthy. Confirm `https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns `{"status":"ok",...}`.
6. Run the one-time admin bootstrap script against that same Atlas database.

## Vercel frontend deployment

1. Import the repository as a Vercel project and set **Root Directory** to `client`.
2. Use the Vite framework preset, build command `npm run build`, and output directory `dist`.
3. Set `VITE_API_URL` to the Render HTTPS API base URL ending in `/api`.
4. Deploy. The included `client/vercel.json` rewrites non-asset SPA paths to `index.html`, so direct navigation and refreshes work for `/login`, `/dashboard`, `/members`, `/events`, `/attendance`, `/profile`, and `/settings`.
5. Set Render `FRONTEND_ORIGIN` to the exact Vercel origin (scheme and host, no path), then redeploy/restart the API.

If using a custom Vercel domain, set the matching custom domain as `FRONTEND_ORIGIN` and update the Vercel `VITE_API_URL` as needed.

## Production build and health check

```sh
cd server && npm start
cd client && npm run build
```

Render's health check path can be set to `/api/health`. The endpoint reports app and database availability only; it does not reveal configuration or stack traces.

## Security checklist

- Keep `server/.env` out of Git and rotate any secret that was ever exposed.
- Use unique production MongoDB and JWT secrets; do not reuse development accounts.
- Run the admin bootstrap once; reset data only with the explicit confirmation flag.
- Restrict Atlas database permissions and network access; maintain tested backups.
- Use HTTPS for both Vercel and Render and set the exact frontend origin in CORS.
- Keep dependencies patched and review Render/Vercel access controls and logs.
- Treat Vercel `VITE_*` values as public.

## Troubleshooting

- **Render does not start:** verify `MONGODB_URI`, Atlas network access, credentials, and required `JWT_SECRET` (minimum 32 characters). Logs intentionally omit connection credentials.
- **Browser CORS error:** `FRONTEND_ORIGIN` must exactly match the browser's Vercel origin, including `https://`, with no trailing path.
- **API request fails from Vercel:** confirm `VITE_API_URL` ends in `/api`, then redeploy Vercel because Vite values are compiled at build time.
- **Health returns 503:** check Atlas availability, network allowlist, database user permissions, and Render logs.
- **Login fails after a reset or deactivation:** ask an administrator to confirm account status or reset the password; password resets revoke existing sessions.
- **Direct page refresh is 404:** confirm `client/vercel.json` is deployed and Vercel root directory is `client`.
- **Bootstrap refuses to run:** confirm the target database and that the username is not already present.

## Deployment state

This repository can be prepared as **code-ready** after its build and tests pass. It is not **deployed** until you configure the external services, and it is not **production-verified** until deployment health, account flows, and CRUD permissions have been exercised against production-like services. No external resources are created by this guide.

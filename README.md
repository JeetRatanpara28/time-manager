# Time Manager Monorepo

Time Manager is a multi-app workspace for employee time tracking and role-based workforce management.

The repository currently contains:

- A React + TypeScript dashboard prototype (root app)
- A Phoenix JSON API backend with PostgreSQL
- A Vue 3 frontend wired to the Phoenix API
- A Cordova iOS wrapper for the Vue build

## Repository Structure

```text
.
├── src/                      # React app (prototype/demo UI)
├── time_manager_phx/         # Phoenix backend (Elixir API)
├── time_manager_vue/         # Vue frontend (API-integrated)
├── time_manager_IOS/         # Cordova iOS wrapper for Vue build
├── docker-compose.yml        # Full-stack local orchestration
├── commands_and_apis.txt     # Handy dev commands and endpoint notes
└── note.txt                  # Extended development notes
```

## Tech Stack

### Root React App (Prototype)

- React 18 + TypeScript
- Vite
- Radix UI + custom UI components
- Recharts

Purpose:

- Role-switchable demo dashboards for `employee`, `manager`, `general_manager`
- Uses in-memory mock data in `src/App.tsx`
- Good for UI iteration and component reuse

### Phoenix Backend

- Elixir 1.15+
- Phoenix 1.8
- Ecto + PostgreSQL
- Guardian JWT auth
- CORSPlug

Purpose:

- Authenticated JSON API for users and working-time records
- Role-gated GM statistics endpoint

### Vue Frontend

- Vue 3 + Vue Router
- Vite
- API service layer with token handling + fallback behavior

Purpose:

- Main API-integrated web UI for login, dashboards, analytics, and management views

### iOS Wrapper

- Apache Cordova (iOS)
- Uses built Vue assets copied into `time_manager_IOS/www`

## Role Model

Roles used across apps:

- `employee`
- `manager`
- `general_manager` (normalized to `gm` in Vue routing logic)

## Main Features

- Authentication with JWT access/refresh tokens (Phoenix)
- User management (CRUD, role-aware visibility)
- Working time CRUD
- Clock in/out and break tracking
- Dashboard statistics (including GM-only aggregate stats)
- CSV export behavior in dashboard UIs
- Role-specific dashboard navigation in Vue app

## Quick Start

## Option A: Docker (recommended for full stack)

Prerequisites:

- Docker + Docker Compose

1. Create a root `.env` file:

```env
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=time_manager_phx_dev
PGHOST=db
PGPORT=5432
PORT=4000
VITE_API_URL=http://localhost:4000
```

2. Start all services:

```bash
docker compose up --build
```

Services:

- PostgreSQL: `localhost:5432`
- Phoenix API: `localhost:4000`
- Vue frontend: `localhost:5173`

## Option B: Local Development (without Docker)

### 1) Start Phoenix API

```bash
cd time_manager_phx
mix deps.get
mix ecto.create
mix ecto.migrate
mix phx.server
```

API base URL:

- `http://localhost:4000/api`

### 2) Start Vue Frontend

```bash
cd time_manager_vue
npm install
npm run dev
```

Vue app URL:

- `http://localhost:5173`

### 3) (Optional) Run React Prototype App

```bash
npm install
npm run dev
```

Note:

- Root React app default Vite port is configured as `3000`.
- Vue app uses `5173`.

Run one at a time or change ports if running both simultaneously.

## API Overview (Phoenix)

Base URL:

- `http://localhost:4000/api`

Authentication:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `DELETE /auth/logout`
- `GET /auth/profile` (auth required)

Users:

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`
- `GET /dashboard/stats` (GM role required)

Working Times:

- `GET /workingtimes`
- `POST /workingtimes`
- `GET /workingtimes/:id`
- `PUT /workingtimes/:id`
- `DELETE /workingtimes/:id`
- `GET /workingtimes/today/:user_id`
- `GET /workingtimes/stats/:user_id`

For additional curl examples, see:

- `commands_and_apis.txt`
- `note.txt`

## iOS Build Flow (Cordova)

From Vue app directory:

```bash
cd time_manager_vue
npm install
npm run build:cordova
```

This builds Vue and copies `dist/` output into `time_manager_IOS/www/`.

## Useful Commands

### Root React

```bash
npm run dev
npm run build
```

### Phoenix

```bash
cd time_manager_phx
mix setup
mix phx.server
mix ecto.reset
```

### Vue

```bash
cd time_manager_vue
npm run dev
npm run build
npm run preview
```

## Seed Data

Phoenix includes a helper seed script for role-based users:

```bash
cd time_manager_phx
mix run seed_gm.exs
```

This script attempts to create:

- 1 General Manager
- 1 Manager
- 2 Employees

## Notes and Current Status

- Root React app is a prototype and currently mock-data driven.
- Vue app is configured to use the real API (`useRealAPI: true`).
- CORS in Phoenix is currently tuned for localhost origins.
- A root `.env` file is expected by `docker-compose.yml`.

## Troubleshooting

- Port already in use:
  - Check `4000`, `5173`, `5432` before startup.
- Phoenix DB connectivity in Docker:
  - Ensure `PGHOST=db` in `.env`.
- Auth failures from frontend:
  - Verify backend is running and token headers are present.

## License

No license file is currently defined in this repository.

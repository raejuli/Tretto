# Tretto

> A Trello-like Kanban task manager — boards, columns, and cards with drag-and-drop, JWT auth, and a clean REST API.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Webpack 5 (code-split + tree-shaken) |
| Backend | Spring Boot 3, Spring Security, JWT (access + refresh tokens), Spring Data JPA |
| Database | PostgreSQL 16 |
| Container | Docker + Docker Compose, Nginx (frontend reverse proxy) |

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Docker + Docker Compose | Docker 24 / Compose v2 |
| Java (local dev only) | 21 |
| Node.js (local dev only) | 20 |

---

## Quick Start (Docker Compose)

```bash
# 1. Clone the repo
git clone https://github.com/your-org/Tretto.git
cd Tretto

# 2. (Optional) override the JWT secret
export JWT_SECRET=my_super_secret_32_char_minimum_key

# 3. Build images and start all services
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (Nginx) | http://localhost |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

Stop everything: `docker compose down`  
Wipe volumes too: `docker compose down -v`

---

## Local Development

### Backend

```bash
cd backend

# Start a local Postgres instance (or reuse the Docker one)
docker compose up db -d

# Run the Spring Boot dev server
./mvnw spring-boot:run
# API available at http://localhost:8080
```

Key environment variables (can be set in `backend/src/main/resources/application-local.properties`):

| Variable | Default |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/tretto` |
| `SPRING_DATASOURCE_USERNAME` | `tretto` |
| `SPRING_DATASOURCE_PASSWORD` | `tretto` |
| `JWT_SECRET` | `devsecret_change_this_in_production_must_be_32_chars` |

### Frontend

```bash
cd frontend
npm install
npm start
# Dev server with HMR at http://localhost:3000
# API calls are proxied to http://localhost:8080
```

---

## API Overview

All REST endpoints are prefixed with `/api`.

### Auth flow

1. **Register** — `POST /api/auth/register` with `{ username, email, password }`
2. **Login** — `POST /api/auth/login` → returns `{ accessToken, refreshToken }`
3. **Authenticate** — send `Authorization: Bearer <accessToken>` on every protected request
4. **Refresh** — `POST /api/auth/refresh` with `{ refreshToken }` to rotate tokens

### Core resources

| Resource | Base path |
|---|---|
| Boards | `/api/boards` |
| Columns | `/api/boards/{boardId}/columns` |
| Cards | `/api/columns/{columnId}/cards` |
| Members | `/api/boards/{boardId}/members` |

---

## Architecture & Design

See **[TDD.md](./TDD.md)** for the full Technical Design Document, covering data model, API design, authentication, drag-and-drop strategy, Webpack configuration, security considerations, and deployment architecture.
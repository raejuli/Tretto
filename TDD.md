# Tretto — Technical Design Document

**Project:** Tretto — A Trello-like Task Management / Project Board  
**Version:** 1.0  
**Date:** 2026-04-04  
**Status:** Approved for Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [System Architecture](#3-system-architecture)
4. [Technology Choices & Tradeoffs](#4-technology-choices--tradeoffs)
5. [Repository Structure (Monorepo)](#5-repository-structure-monorepo)
6. [Data Model](#6-data-model)
7. [API Design](#7-api-design)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Backend Architecture](#10-backend-architecture)
11. [Drag-and-Drop Design](#11-drag-and-drop-design)
12. [Optimistic UI Updates](#12-optimistic-ui-updates)
13. [Webpack Configuration](#13-webpack-configuration)
14. [Security Considerations](#14-security-considerations)
15. [Database Design & Migrations](#15-database-design--migrations)
16. [Testing Strategy](#16-testing-strategy)
17. [Deployment & Infrastructure](#17-deployment--infrastructure)
18. [Performance Considerations](#18-performance-considerations)
19. [Open Issues & Future Work](#19-open-issues--future-work)

---

## 1. Overview

Tretto is a Kanban-style project management web application. Users can create **boards**, organise work into **columns** (lists), and manage **cards** (tasks) within those columns. Cards can be dragged between columns and reordered within a column in real time. The system supports multiple users on a single board with role-based access control.

### Core user journeys

| Journey | Description |
|---|---|
| Registration / Login | A new user creates an account; a returning user logs in. Both paths issue a JWT. |
| Board management | Create, rename, archive, and delete boards. |
| Column management | Add, rename, reorder, and delete columns within a board. |
| Card management | Create, edit, move, and delete cards. Cards carry a title, description, due date, assignee, and labels. |
| Drag and drop | Cards can be dragged between columns or reordered within a column. Columns can be reordered on the board. |
| Member management | Board owners can invite other registered users, assign them roles (Owner, Editor, Viewer). |

---

## 2. Goals & Non-Goals

### Goals

- Fully functional Kanban board with real-time-feel optimistic updates.
- Stateless JWT authentication with refresh-token rotation.
- A clean REST API with predictable resource URLs.
- A Webpack build with code splitting and tree shaking.
- Reproducible local development via Docker Compose.
- Test coverage for critical backend paths (unit + integration) and frontend components.

### Non-Goals

- Real-time multi-user collaboration (WebSocket / SSE) — out of scope for v1. See §19.
- Mobile native applications.
- Paid plans, billing, or subscription management.
- Rich-text card descriptions (plain text only in v1).
- File attachment storage (out of scope; stub endpoint only).

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                       Browser                          │
│  React SPA  ←──── Webpack bundles (code-split) ──────  │
│  (port 3000 in dev / served by Nginx in prod)          │
└────────────────────┬───────────────────────────────────┘
                     │ HTTPS  (JWT in Authorization header)
                     ▼
┌────────────────────────────────────────────────────────┐
│              Spring Boot Application                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Auth Filter  │  │  Controllers │  │  Services   │  │
│  │  (JWT)        │  │  (REST)      │  │  (Business  │  │
│  └──────┬────────┘  └──────┬───────┘  │   Logic)    │  │
│         │                  │          └──────┬───────┘  │
│         └──────────────────┴─────────────────┘          │
│                          JPA / Hibernate                │
└────────────────────────────┬───────────────────────────┘
                             │ JDBC
                             ▼
                   ┌──────────────────┐
                   │   PostgreSQL 16  │
                   └──────────────────┘
```

**Deployment topology (production)**

- Frontend static assets served by an Nginx container.
- Spring Boot runs in its own container behind Nginx (reverse proxy for `/api/*`).
- PostgreSQL runs in a separate container (or managed RDS in cloud).
- Docker Compose orchestrates all three for local development.

---

## 4. Technology Choices & Tradeoffs

### 4.1 Frontend

#### React + TypeScript

| Consideration | Decision | Tradeoff |
|---|---|---|
| Component model | React functional components + hooks | Simpler than class components; no lifecycle confusion. Slight learning curve for hooks-heavy patterns. |
| Type safety | TypeScript strict mode | Catches entire classes of runtime bugs at compile time. Adds verbosity and build complexity. |
| State management | React Context + `useReducer` (no Redux) | Lower ceremony for a focused CRUD app. Redux would provide better devtools and middleware at the cost of boilerplate. If the app grows significantly, migrating to Zustand or Redux Toolkit would be a natural next step. |
| Data fetching | Custom `useFetch` hook wrapping `fetch()` | Avoids adding React Query/SWR for v1. React Query would be the preferred upgrade path for caching and background refetching. |

#### react-beautiful-dnd

| Consideration | Decision | Tradeoff |
|---|---|---|
| DnD library | `react-beautiful-dnd` (rbd) | Battle-tested, accessible out-of-the-box (keyboard support, screen reader announcements). **Known limitation:** rbd is in maintenance mode (Atlassian's `@hello-pangea/dnd` fork is the recommended successor). We use rbd here for ecosystem familiarity. |
| Alternative | `dnd-kit` | More flexible and actively maintained; migration is straightforward if needed. |
| Virtual lists | Not implemented in v1 | rbd supports virtualised lists but adds complexity. Boards with > 500 cards per column would need this. |

#### Webpack

| Consideration | Decision | Tradeoff |
|---|---|---|
| Bundler | Webpack 5 | Mature ecosystem, fine-grained control over chunk splitting. Slower cold-start builds vs Vite/esbuild but more familiar in enterprise settings. |
| Code splitting | `React.lazy` + dynamic `import()` per route | Reduces initial bundle size. Each board route is a separate chunk. |
| Tree shaking | ES modules throughout; `sideEffects: false` in package.json | Eliminates dead code. Requires all imports to be ESM-compatible. |
| Dev server | `webpack-dev-server` with hot module replacement (HMR) | Fast iteration in development. Requires proxy config to forward `/api/*` to Spring Boot. |

### 4.2 Backend

#### Spring Boot

| Consideration | Decision | Tradeoff |
|---|---|---|
| Framework | Spring Boot 3.x (Jakarta EE 10) | Production-grade, massive ecosystem. Higher memory footprint than Micronaut/Quarkus; not ideal for serverless but fine for container deployment. |
| Security | Spring Security 6 + custom JWT filter | Full control over auth logic. More verbose than rolling your own but provides CSRF, session, and method-level security. |
| ORM | Spring Data JPA (Hibernate) | Rapid development with derived queries and `@Entity` mapping. N+1 queries are a risk; mitigated by `@EntityGraph` or explicit JPQL joins (see §10). |
| Database | PostgreSQL 16 | ACID-compliant, excellent support for JSONB if metadata fields are needed later, wide community. MySQL would be a valid alternative with minor query differences. |
| Migration | Flyway | SQL-first migrations; easy to audit. Liquibase is an XML-heavy alternative. |
| Testing | JUnit 5 + Testcontainers (PostgreSQL) | Integration tests run against a real database container, eliminating sqlite mocking issues. |

#### JWT vs Session Cookies

We chose **JWT (stateless)** over server-side sessions for the following reasons:

- Horizontal scaling is simpler: no shared session store (Redis) is required.
- The SPA consumes the token directly from JavaScript — no cookie plumbing needed.
- **Tradeoff:** Token revocation requires a deny-list or short expiry + refresh tokens. We implement a refresh-token rotation scheme (see §8) with tokens stored in an `HttpOnly` cookie to balance security and convenience.

---

## 5. Repository Structure (Monorepo)

```
Tretto/
├── TDD.md
├── README.md
├── docker-compose.yml
├── .gitignore
│
├── backend/                        # Spring Boot project
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/tretto/
│       │   │   ├── TrettoApplication.java
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   └── WebConfig.java
│       │   │   ├── auth/
│       │   │   │   ├── AuthController.java
│       │   │   │   ├── AuthService.java
│       │   │   │   ├── JwtService.java
│       │   │   │   └── RefreshTokenService.java
│       │   │   ├── user/
│       │   │   │   ├── User.java
│       │   │   │   ├── UserRepository.java
│       │   │   │   └── UserService.java
│       │   │   ├── board/
│       │   │   │   ├── Board.java
│       │   │   │   ├── BoardController.java
│       │   │   │   ├── BoardService.java
│       │   │   │   └── BoardRepository.java
│       │   │   ├── column/
│       │   │   │   ├── BoardColumn.java
│       │   │   │   ├── ColumnController.java
│       │   │   │   ├── ColumnService.java
│       │   │   │   └── ColumnRepository.java
│       │   │   ├── card/
│       │   │   │   ├── Card.java
│       │   │   │   ├── CardController.java
│       │   │   │   ├── CardService.java
│       │   │   │   └── CardRepository.java
│       │   │   ├── member/
│       │   │   │   ├── BoardMember.java
│       │   │   │   ├── BoardMemberRepository.java
│       │   │   │   └── Role.java
│       │   │   └── exception/
│       │   │       ├── GlobalExceptionHandler.java
│       │   │       └── TrettoException.java
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/
│       │           ├── V1__init_schema.sql
│       │           └── V2__seed_roles.sql
│       └── test/
│           └── java/com/tretto/
│               ├── auth/AuthControllerTest.java
│               ├── board/BoardServiceTest.java
│               └── card/CardServiceTest.java
│
├── frontend/                       # React + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── webpack.config.js
│   └── src/
│       ├── index.tsx
│       ├── App.tsx
│       ├── api/
│       │   ├── client.ts           # fetch wrapper with JWT injection
│       │   ├── auth.ts
│       │   ├── boards.ts
│       │   ├── columns.ts
│       │   └── cards.ts
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   └── BoardContext.tsx
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   └── useBoard.ts
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx   # List of boards
│       │   └── BoardPage.tsx       # The Kanban board
│       ├── components/
│       │   ├── Board/
│       │   │   ├── BoardView.tsx
│       │   │   ├── Column.tsx
│       │   │   └── Card.tsx
│       │   ├── Auth/
│       │   │   ├── LoginForm.tsx
│       │   │   └── RegisterForm.tsx
│       │   └── common/
│       │       ├── Button.tsx
│       │       ├── Modal.tsx
│       │       └── Spinner.tsx
│       └── types/
│           └── index.ts
```

---

## 6. Data Model

### Entity Relationship Diagram

```
users
  id             UUID PK
  email          VARCHAR(255) UNIQUE NOT NULL
  display_name   VARCHAR(100) NOT NULL
  password_hash  TEXT NOT NULL
  created_at     TIMESTAMP NOT NULL

refresh_tokens
  id             UUID PK
  user_id        UUID FK → users.id
  token_hash     TEXT NOT NULL
  expires_at     TIMESTAMP NOT NULL
  revoked        BOOLEAN DEFAULT FALSE

boards
  id             UUID PK
  title          VARCHAR(255) NOT NULL
  description    TEXT
  owner_id       UUID FK → users.id
  created_at     TIMESTAMP NOT NULL
  archived       BOOLEAN DEFAULT FALSE

board_members
  board_id       UUID FK → boards.id   PK composite
  user_id        UUID FK → users.id    PK composite
  role           VARCHAR(20) NOT NULL  -- OWNER | EDITOR | VIEWER

board_columns
  id             UUID PK
  board_id       UUID FK → boards.id
  title          VARCHAR(255) NOT NULL
  position       INTEGER NOT NULL      -- 0-indexed ordering
  created_at     TIMESTAMP NOT NULL

cards
  id             UUID PK
  column_id      UUID FK → board_columns.id
  board_id       UUID FK → boards.id   -- denormalised for query efficiency
  title          VARCHAR(255) NOT NULL
  description    TEXT
  position       INTEGER NOT NULL      -- 0-indexed within column
  due_date       DATE
  assignee_id    UUID FK → users.id    NULLABLE
  created_at     TIMESTAMP NOT NULL
  updated_at     TIMESTAMP NOT NULL

labels
  id             UUID PK
  board_id       UUID FK → boards.id
  name           VARCHAR(50) NOT NULL
  color          VARCHAR(7) NOT NULL   -- hex e.g. #FF5733

card_labels
  card_id        UUID FK → cards.id   PK composite
  label_id       UUID FK → labels.id  PK composite
```

### Ordering Strategy

Card and column ordering uses a **position integer** (0-indexed). When an item is moved:

1. The server recomputes affected positions in a single transaction.
2. The client sends a `PATCH /cards/{id}/move` payload with `{ columnId, position }`.

**Tradeoff:** Integer positions require renumbering a range of rows on every move, but keep queries simple (`ORDER BY position`). An alternative is a **fractional indexing** scheme (e.g. Lexorank), which avoids bulk updates at the cost of more complex client-side logic and occasional rebalancing. For v1 with moderate board sizes, integer reordering is acceptable.

---

## 7. API Design

All endpoints are prefixed with `/api/v1`. Responses use `application/json`. Errors follow RFC 7807 Problem Details format.

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user. Returns `{ accessToken }`. Sets `refreshToken` cookie. |
| POST | `/auth/login` | Authenticate. Returns `{ accessToken }`. Sets `refreshToken` cookie. |
| POST | `/auth/refresh` | Exchange refresh token (from cookie) for a new access token. |
| POST | `/auth/logout` | Revoke refresh token. Clears cookie. |

### Boards

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/boards` | Required | List boards the caller is a member of. |
| POST | `/boards` | Required | Create a board. Caller becomes OWNER. |
| GET | `/boards/{boardId}` | Member | Get board with columns and cards. |
| PATCH | `/boards/{boardId}` | Owner/Editor | Update title/description. |
| DELETE | `/boards/{boardId}` | Owner | Archive board. |
| GET | `/boards/{boardId}/members` | Member | List members. |
| POST | `/boards/{boardId}/members` | Owner | Invite a member by email. |
| DELETE | `/boards/{boardId}/members/{userId}` | Owner | Remove member. |

### Columns

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/boards/{boardId}/columns` | Editor | Create a column. |
| PATCH | `/columns/{columnId}` | Editor | Rename column. |
| PATCH | `/columns/{columnId}/move` | Editor | Reorder column. Body: `{ position: int }` |
| DELETE | `/columns/{columnId}` | Editor | Delete column (cascades to cards). |

### Cards

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/columns/{columnId}/cards` | Editor | Create a card. |
| GET | `/cards/{cardId}` | Member | Get card detail. |
| PATCH | `/cards/{cardId}` | Editor | Update title/description/dueDate/assigneeId. |
| PATCH | `/cards/{cardId}/move` | Editor | Move/reorder card. Body: `{ columnId, position }` |
| DELETE | `/cards/{cardId}` | Editor | Delete card. |
| POST | `/cards/{cardId}/labels` | Editor | Add label to card. |
| DELETE | `/cards/{cardId}/labels/{labelId}` | Editor | Remove label. |

### Response shape examples

```jsonc
// GET /boards/{boardId} — board detail
{
  "id": "uuid",
  "title": "Sprint 42",
  "description": "...",
  "archived": false,
  "columns": [
    {
      "id": "uuid",
      "title": "Backlog",
      "position": 0,
      "cards": [
        {
          "id": "uuid",
          "title": "Implement login",
          "description": "",
          "position": 0,
          "dueDate": "2026-04-20",
          "assignee": { "id": "uuid", "displayName": "Alice" },
          "labels": [{ "id": "uuid", "name": "bug", "color": "#e11d48" }]
        }
      ]
    }
  ],
  "members": [
    { "userId": "uuid", "displayName": "Alice", "role": "OWNER" }
  ]
}
```

---

## 8. Authentication & Authorization

### JWT Access Token

- Algorithm: **HS256** (symmetric; secret stored as env var `JWT_SECRET`).
- Payload claims: `sub` (userId), `email`, `iat`, `exp`.
- Expiry: **15 minutes**.
- Transmitted in the `Authorization: Bearer <token>` header.

**Tradeoff:** RS256 (asymmetric) would allow independent verification without sharing the secret, useful when multiple services need to verify tokens. HS256 is simpler for a single-service deployment.

### Refresh Token

- Stored as an **`HttpOnly`, `Secure`, `SameSite=Strict` cookie**.
- Server stores a **bcrypt hash** of the raw token value in `refresh_tokens` table.
- Expiry: **7 days**; rotation on every use (old token is revoked, new one issued).
- Family detection: if a revoked token is replayed, all tokens for that user are invalidated.

### Spring Security Filter Chain

```
Request
  └─ JwtAuthenticationFilter          (OncePerRequestFilter)
       ├─ Extract Bearer token from header
       ├─ Validate signature & expiry
       ├─ Load UserDetails from DB (cached per request)
       └─ Set SecurityContext
  └─ Authorization checks (method-level @PreAuthorize or custom BoardAccessEvaluator)
```

### Role Enforcement

Board membership roles (`OWNER`, `EDITOR`, `VIEWER`) are enforced at the **service layer**:

```java
// Example
boardAccessEvaluator.requireRole(boardId, currentUserId, Role.EDITOR);
```

`VIEWER` can read. `EDITOR` can read and write. `OWNER` can do everything including member management and deletion.

---

## 9. Frontend Architecture

### State Model

```
AuthContext
  ├── user: UserProfile | null
  ├── accessToken: string | null
  └── actions: login, logout, refresh

BoardContext  (per board page)
  ├── board: BoardDetail
  │    ├── columns: Column[]  (sorted by position)
  │    │    └── cards: Card[] (sorted by position)
  │    └── members: Member[]
  └── actions: moveCard, moveColumn, addCard, updateCard, deleteCard, ...
```

`BoardContext` is only mounted while a `BoardPage` is active and is torn down on navigation.

### Optimistic UI Updates

When the user drags a card:

1. **Immediately** update the local state in `BoardContext` (re-order/re-column).
2. Fire `PATCH /cards/{id}/move` in the background.
3. On **success**: server state replaces optimistic state (usually identical).
4. On **error**: roll back to the previous board snapshot and show a toast notification.

This creates a responsive feel even on high-latency connections.

**Tradeoff:** Optimistic updates can diverge from server state in concurrent editing scenarios (two users editing the same board). v1 accepts this risk; v2 should add WebSocket push notifications or polling to reconcile state.

### Routing

React Router v6 with lazy-loaded routes:

```tsx
const BoardPage = React.lazy(() => import('./pages/BoardPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
```

Each lazy import becomes a separate Webpack chunk, improving initial load time.

---

## 10. Backend Architecture

### Layered Architecture

```
Controller  →  Service  →  Repository (JPA)
                 ↑
            BoardAccessEvaluator (security)
```

- **Controllers** are thin: parse request, call service, return DTO.
- **Services** own business logic and transactions (`@Transactional`).
- **Repositories** extend `JpaRepository`; custom queries use `@Query` JPQL.

### N+1 Prevention

`GET /boards/{boardId}` returns the full board tree (columns → cards). Naive lazy loading would trigger one query per column. We use:

```java
@EntityGraph(attributePaths = {"columns", "columns.cards", "columns.cards.assignee", "columns.cards.labels"})
Optional<Board> findWithFullDetailById(UUID id);
```

**Tradeoff:** Eager loading the full tree is fine for a single board load. For boards with thousands of cards, pagination per column would be needed.

### Transaction Design for Card Move

Moving a card involves:

1. Decrement positions of cards after the old position in the old column.
2. Increment positions of cards at and after the new position in the new column.
3. Update the card's `columnId` and `position`.

All three steps execute in a single `@Transactional` method to maintain consistency.

---

## 11. Drag-and-Drop Design

```
<DragDropContext onDragEnd={handleDragEnd}>
  {columns.map(col => (
    <Droppable droppableId={col.id} key={col.id}>
      {provided => (
        <Column ref={provided.innerRef} {...provided.droppableProps}>
          {col.cards.map((card, index) => (
            <Draggable draggableId={card.id} index={index} key={card.id}>
              {provided => <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} card={card} />}
            </Draggable>
          ))}
          {provided.placeholder}
        </Column>
      )}
    </Droppable>
  ))}
</DragDropContext>
```

`handleDragEnd` receives `source` and `destination` descriptors and dispatches the optimistic `moveCard` action followed by the API call.

Column reordering wraps the column list in its own `<Droppable type="COLUMN" direction="horizontal">`.

---

## 12. Optimistic UI Updates

### State Reducer Actions

```typescript
type BoardAction =
  | { type: 'MOVE_CARD'; cardId: string; fromColumnId: string; toColumnId: string; newIndex: number }
  | { type: 'MOVE_COLUMN'; columnId: string; newIndex: number }
  | { type: 'ADD_CARD'; card: Card; columnId: string }
  | { type: 'UPDATE_CARD'; card: Partial<Card> & { id: string } }
  | { type: 'DELETE_CARD'; cardId: string; columnId: string }
  | { type: 'SET_BOARD'; board: BoardDetail }
  | { type: 'ROLLBACK'; snapshot: BoardDetail };
```

### Rollback Implementation

```typescript
const previousSnapshot = state.board;
dispatch({ type: 'MOVE_CARD', ... });  // optimistic

api.moveCard(cardId, { columnId, position })
  .catch(() => {
    dispatch({ type: 'ROLLBACK', snapshot: previousSnapshot });
    toast.error('Failed to move card. Changes reverted.');
  });
```

---

## 13. Webpack Configuration

### Key configuration points

```javascript
// webpack.config.js (abbreviated)
module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: '/',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    runtimeChunk: 'single',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
};
```

### Chunks produced

| Chunk | Contents |
|---|---|
| `main.[hash].js` | App bootstrap + routing shell |
| `vendors.[hash].js` | React, react-dom, react-beautiful-dnd, react-router |
| `dashboard.[hash].chunk.js` | DashboardPage lazy chunk |
| `board.[hash].chunk.js` | BoardPage + BoardContext lazy chunk |
| `runtime.[hash].js` | Webpack runtime (tiny; inline in prod) |

`contenthash` in filenames enables **long-lived browser caching**: a chunk only changes hash when its content changes.

---

## 14. Security Considerations

| Risk | Mitigation |
|---|---|
| JWT theft (XSS) | Access token is short-lived (15 min). Refresh token is `HttpOnly` cookie (not accessible from JS). CSP headers prevent most XSS. |
| CSRF | Refresh token cookie uses `SameSite=Strict`, preventing cross-site requests. Custom `X-Requested-With` header check added for extra defence. |
| SQL Injection | All DB access via JPA/Hibernate parameterised queries; no raw string interpolation. |
| Mass assignment | DTOs separate from entities; Spring uses `@RequestBody` DTO validation (`@Valid`). |
| IDOR (Insecure Direct Object Reference) | Every resource access checks board membership via `BoardAccessEvaluator`. |
| Password storage | BCrypt with cost factor 12. |
| Rate limiting | Not implemented in v1 (infrastructure-level in prod via Nginx `limit_req`). |
| Dependency vulnerabilities | `mvn dependency:check` + `npm audit` in CI pipeline. |

---

## 15. Database Design & Migrations

Migrations are managed by **Flyway**, applied automatically on startup.

### V1__init_schema.sql

Creates all tables described in §6 with appropriate indexes:

```sql
CREATE INDEX idx_cards_column_id ON cards(column_id);
CREATE INDEX idx_cards_board_id  ON cards(board_id);
CREATE INDEX idx_board_columns_board_id ON board_columns(board_id);
CREATE INDEX idx_board_members_user_id  ON board_members(user_id);
```

### V2__seed_roles.sql

No seed data needed; roles are Java enums embedded in the JPA entity.

---

## 16. Testing Strategy

### Backend

| Layer | Tool | What is tested |
|---|---|---|
| Unit | JUnit 5 + Mockito | Service layer business logic in isolation |
| Integration | Spring Boot Test + Testcontainers | Full HTTP stack against a real PostgreSQL container |
| Security | MockMvc | JWT rejection, role enforcement |

Key test scenarios:
- `POST /auth/register` → happy path, duplicate email.
- `POST /auth/login` → valid credentials, wrong password.
- `POST /auth/refresh` → valid refresh, expired refresh, replayed (revoked) refresh.
- `PATCH /cards/{id}/move` → move within column, move between columns, position boundary conditions, unauthorized user.
- Board access: VIEWER cannot create card (403), EDITOR can.

### Frontend

| Layer | Tool | What is tested |
|---|---|---|
| Component | React Testing Library | LoginForm validation, Card rendering, drag-drop result dispatch |
| Unit | Vitest / Jest | BoardContext reducer, API client token injection |
| E2E | Playwright (future) | Full login → create board → drag card flow |

---

## 17. Deployment & Infrastructure

### Docker Compose (local dev)

```yaml
version: '3.9'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: tretto
      POSTGRES_USER: tretto
      POSTGRES_PASSWORD: tretto
    ports: ["5432:5432"]

  backend:
    build: ./backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/tretto
      SPRING_DATASOURCE_USERNAME: tretto
      SPRING_DATASOURCE_PASSWORD: tretto
      JWT_SECRET: change_me_in_production
      REFRESH_TOKEN_SECRET: change_me_in_production
    ports: ["8080:8080"]
    depends_on: [db]

  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]
```

### Production concerns

- Secrets should be injected via environment variables or a secrets manager (Vault / AWS Secrets Manager), never hardcoded.
- PostgreSQL should be a managed service (RDS, Cloud SQL) rather than a container for durability.
- Consider a CDN (CloudFront) in front of the Nginx for static asset caching.

---

## 18. Performance Considerations

| Concern | Approach |
|---|---|
| Initial bundle size | Lazy-loaded routes + vendor chunk splitting |
| Large boards | N+1 prevention via EntityGraph; future: paginate cards per column |
| DB query latency | Indexed foreign keys; connection pool via HikariCP (default Spring Boot) |
| Auth overhead | UserDetails loaded per request (cache with Spring Cache + Caffeine in v2) |
| Token refresh race | Frontend queues requests while refresh is in flight; single refresh at a time via a mutex flag |

---

## 19. Open Issues & Future Work

| Item | Priority | Notes |
|---|---|---|
| Real-time collaboration | High (v2) | WebSocket (STOMP over SockJS) or Server-Sent Events for board state push |
| Card comments | Medium | New `card_comments` table; mentions with `@user` |
| File attachments | Medium | Presigned S3 uploads; stub endpoint in v1 |
| Card activity log | Medium | Audit trail for card changes |
| Pagination (cards per column) | Medium | Required once boards have > 100 cards/column |
| Switch DnD to dnd-kit | Low | rbd is maintenance-only; migration is straightforward |
| OAuth2 login | Low | Google/GitHub SSO via Spring Security OAuth2 |
| Email notifications | Low | Due-date reminders; Spring Mail + task scheduler |
| React Query for data fetching | Low | Better caching and background refetch; replaces custom `useFetch` hook |
| RS256 for JWT | Low | Needed if multiple backend services consume tokens |
| Rate limiting at app level | High (security) | Bucket4j + Spring AOP; currently delegated to infrastructure |

---

*End of Technical Design Document*

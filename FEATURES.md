# Tretto — Feature Backlog

A living document of missing and nice-to-have features for the Tretto Kanban board system.  
Items are grouped by area and ordered roughly by priority within each group.

---

## 🐛 Bugs / Critical Fixes

| # | Feature | Status |
|---|---------|--------|
| 1 | Frontend `cards.ts` and `columns.ts` call wrong API paths (board-prefixed paths that don't exist in the backend) — card creation, move, and delete are silently broken | **Done** |
| 2 | `CardRequest` DTO uses `@NotBlank` on `title`, which breaks partial PATCH updates | **Done** |
| 3 | `BoardDetailResponse` is missing a `myRole` field, so the frontend type `BoardDetail.myRole` is always `undefined` | **Done** |

---

## 🃏 Card Features

| # | Feature | Status |
|---|---------|--------|
| 4 | **Card Detail Modal** — click a card to open a full-screen detail view with editable title, description, due date, assignee, and labels | **Done** |
| 5 | **Delete Card** — button in the card detail modal to permanently delete a card | **Done** |
| 6 | **Card Priority** — LOW / MEDIUM / HIGH / URGENT field stored on the card and shown as a coloured badge | Planned |
| 7 | **Card Checklists** — sub-tasks with a progress indicator on the card thumbnail | Planned |
| 8 | **Card Comments / Activity Feed** — threaded comments with timestamps, mentions, and an activity log | Planned |
| 9 | **Card Attachments** — file-upload endpoint + storage (S3 or local) with previews | Planned |
| 10 | **Card Cover Image / Color** — set a visual cover on a card to make it stand out | Planned |
| 11 | **Copy / Duplicate Card** — duplicate a card within or across columns | Planned |
| 12 | **Move Card Between Boards** — move a card to a column on a different board | Planned |

---

## 📋 Column Features

| # | Feature | Status |
|---|---------|--------|
| 13 | **Rename Column** — inline edit of column title | **Done** |
| 14 | **Delete Column** — delete a column and optionally its cards | **Done** |
| 15 | **Collapse Column** — fold a column down to a narrow strip to save horizontal space | **Done** |
| 16 | **Column Card Count** — show the number of cards in the column header | **Done** |
| 17 | **WIP Limit** — configurable maximum number of cards per column with a visual warning | Planned |
| 18 | **Column Color / Icon** — visual customisation for columns | Planned |

---

## 🗂️ Board Features

| # | Feature | Status |
|---|---------|--------|
| 19 | **Board Settings Modal** — edit title, description, and danger-zone (delete / archive) from inside the board view | **Done** |
| 20 | **Board Starring / Favourites** — star boards and pin them to the top of the dashboard | **Done** |
| 21 | **Archived Boards View** — toggle to show archived boards on the dashboard | **Done** |
| 22 | **Board Templates** — create a new board from predefined templates (e.g. Software Sprint, Content Calendar) | Planned |
| 23 | **Board Background** — choose a background colour or image for the board canvas | Planned |
| 24 | **Board Activity Log** — audit trail of all changes (card moves, edits, member changes) | Planned |
| 25 | **Board Export** — export a board to CSV or JSON | Planned |

---

## 🔍 Search & Filter

| # | Feature | Status |
|---|---------|--------|
| 26 | **Card Text Filter** — filter visible cards in the current board by a search string | **Done** |
| 27 | **Filter by Label** — hide cards that don't match selected labels | Planned |
| 28 | **Filter by Assignee** — show only cards assigned to a specific member | Planned |
| 29 | **Filter by Due Date** — overdue / due soon / no due date filters | Planned |
| 30 | **Global Search** — search cards and boards across the entire workspace | Planned |

---

## 🏷️ Label Management

| # | Feature | Status |
|---|---------|--------|
| 31 | **Create / Edit / Delete Labels** — per-board label management with colour picker | **Done** |
| 32 | **Label Presets** — common colours pre-seeded when a board is created | Planned |

---

## 👤 User & Profile

| # | Feature | Status |
|---|---------|--------|
| 33 | **Profile Page** — view and edit display name; change password | Planned |
| 34 | **Avatar / Initials** — consistent avatar display using the user's initials everywhere an assignee is shown | Planned |
| 35 | **Password Reset** — "Forgot password" flow via email | Planned |
| 36 | **Email Verification** — verify email address on registration | Planned |

---

## 🔔 Notifications

| # | Feature | Status |
|---|---------|--------|
| 37 | **In-App Notifications** — bell icon with unread count for card assignments, mentions, and due-date reminders | Planned |
| 38 | **Email Notifications** — configurable email alerts for board activity | Planned |

---

## 🎨 UI / UX

| # | Feature | Status |
|---|---------|--------|
| 39 | **Dark Mode** — system-aware colour scheme toggle stored in user preferences | Planned |
| 40 | **Keyboard Shortcuts** — `N` add card, `B` add list, `/` search, `Esc` close modal, etc. | Planned |
| 41 | **Mobile Drag-and-Drop** — replace `react-beautiful-dnd` (poor touch support) with `@dnd-kit` | Planned |
| 42 | **Responsive Layout** — stacked single-column view on narrow screens | Planned |
| 43 | **Skeleton Loading** — replace spinners with content-aware skeleton screens | Planned |
| 44 | **Board Breadcrumb / Navigation** — clearer header showing current board and quick navigation | Planned |

---

## 🔧 Developer / Ops

| # | Feature | Status |
|---|---------|--------|
| 45 | **OpenAPI / Swagger UI** — auto-generated interactive API documentation | Planned |
| 46 | **Rate Limiting** — protect auth endpoints from brute-force attacks | Planned |
| 47 | **Structured Logging** — JSON log format with correlation IDs for distributed tracing | Planned |
| 48 | **CI/CD Pipeline** — GitHub Actions workflow for build, test, and Docker image push | Planned |
| 49 | **Frontend Unit Tests** — React Testing Library tests for key components and hooks | Planned |
| 50 | **Backend Integration Tests** — Testcontainers-based tests for all controllers | Planned |

---

*Last updated: 2026-04-06*

# NEXORA — Project Management & Collaboration Platform

Nexora is a full-stack project management and team collaboration platform designed for modern product and software engineering teams. Built with React, TypeScript, Node.js, Express, PostgreSQL, Prisma ORM, and Socket.IO, Nexora provides real-time task synchronization, strict Role-Based Access Control (RBAC), database-backed analytics, and a dark SaaS visual design system.

Developed for the **CodeAlpha Full Stack Development Internship**.

---

## 🔗 Project Links

- **GitHub Repository:** https://github.com/pk7745/CodeAlpha_Nexora
- **Live Demo:** `https://YOUR-RENDER-SERVICE.onrender.com` *(Add after deployment)*
- **API Health:** `https://YOUR-RENDER-SERVICE.onrender.com/health` *(Add after deployment)*

---

## ✨ Key Features

- **JWT Authentication & Security**: Password hashing with `bcrypt` (10 salt rounds), JSON Web Token session management, Zod request body validation, Helmet security headers, and Express rate limiting.
- **Role-Based Access Control (RBAC)**: Fine-grained, server-side permission enforcement across four roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).
- **Interactive Drag-and-Drop Kanban Board**: Real-time position reordering and status column movement (`To Do`, `In Progress`, `In Review`, `Done`) powered by `@dnd-kit/core` with floating-point position ordering persisted to PostgreSQL.
- **Slide-Over Task Drawer**: Inspect task details, update status, priority, assignee, due date, description, threaded comments, and project activity audit logs.
- **Real-Time Collaboration via Socket.IO**: WebSocket room broadcasting (`project:{projectId}`) for real-time task creation, column shifts, edits, comments, and team membership updates.
- **In-App Notification Center**: Bell icon dropdown feed with unread counter badge, task assignment alerts, comment alerts, and `Mark all as read` functionality (`GET /api/notifications`, `PUT /api/notifications/read-all`).
- **Database-Backed Analytics Dashboard**: Interactive KPI cards (Active Projects, Assigned Tasks, Completed Tasks, Overdue Tasks), URL-filtered task navigation, and a Workspace Productivity Breakdown.
- **Member Profiles & Productivity Summaries**: Slide-over member drawer displaying user role, active task counts, completed tasks, overdue items, and authorized shared project history.
- **Global Server-Side Search (`Ctrl + K`)**: Modal search querying backend APIs for authorized projects, tasks (by key or title), and team members.

---

## 🏗️ Architecture

Nexora uses a decoupled monorepo architecture engineered for both separate development servers and unified single-service deployment on **Render**.

```text
+-------------------------------------------------------------------------+
|                        React + Vite Client (SPA)                        |
|   Components | Pages | Context API | Tailwind CSS | @dnd-kit | Axios    |
+-------------------------------------------------------------------------+
       |                                                    ^
       | REST API (HTTP Bearer JWT)                         | Socket.IO Events
       v                                                    v
+-------------------------------------------------------------------------+
|                       Node.js + Express Server                          |
|   Controllers | RBAC Middleware | Zod Validation | Socket.IO Gateway    |
+-------------------------------------------------------------------------+
       |                                                    ^
       | Prisma Client Queries                              | Real-time Emits
       v                                                    |
+-------------------------------------------------------------------------+
|                          PostgreSQL Database                            |
|   User | Project | ProjectMember | Task | Comment | Notification | Act  |
+-------------------------------------------------------------------------+
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Geist Typography, `@dnd-kit/core`, `@dnd-kit/sortable` |
| **Backend** | Node.js, Express, TypeScript (NodeNext), Socket.IO |
| **Database & ORM** | PostgreSQL, Prisma ORM v5, Prisma Client |
| **Security & Auth** | JWT (`jsonwebtoken`), `bcryptjs`, Helmet, CORS, `express-rate-limit`, Zod validation |
| **Testing** | Vitest, Supertest |
| **Deployment** | Render Web Service (Single-Service Production), Render PostgreSQL |

---

## 🔐 Role-Based Access Control (RBAC)

Authorization is strictly enforced server-side via `server/src/middleware/authorize.ts` and controller-level checks:

| Capability | OWNER | ADMIN | MEMBER | VIEWER |
| :--- | :---: | :---: | :---: | :---: |
| **View Dashboard, Projects, Kanban & Tasks** | ✅ | ✅ | ✅ | ✅ |
| **Create & Update Tasks** | ✅ | ✅ | ✅ | ❌ (403 Forbidden) |
| **Move Tasks on Kanban Board** | ✅ | ✅ | ✅ | ❌ (403 Forbidden) |
| **Create & Edit Own Comments** | ✅ | ✅ | ✅ | ❌ (403 Forbidden) |
| **Invite & Add Project Members** | ✅ | ✅ | ❌ | ❌ (403 Forbidden) |
| **Update Member Roles** | ✅ | ❌ | ❌ | ❌ (403 Forbidden) |
| **Remove Project Members** | ✅ | ✅ (Non-Owner) | ❌ | ❌ (403 Forbidden) |
| **Delete Project** | ✅ | ❌ | ❌ | ❌ (403 Forbidden) |

---

## ⚡ Real-Time Collaboration & Socket.IO

The backend initializes a Socket.IO gateway attached to the primary HTTP server (`server/src/socket/index.ts`):

- **Authentication Handshake**: Clients pass their JWT token during connection; invalid tokens are rejected.
- **Room Isolation**: Clients join `project:{projectId}` on selection, isolating event traffic per project.
- **Real-Time Broadcast Events**:
  - `task:created` — Emitted when a new task is created.
  - `task:moved` — Emitted when a task is dragged to a new status column or reordered.
  - `task:updated` — Emitted when task properties are edited.
  - `task:deleted` — Emitted when a task is removed.
  - `comment:created` — Emitted when a comment is added to a task.
  - `member:added` / `member:removed` — Emitted on team roster updates.

---

## 🔔 In-App Notification System

Nexora includes a persistent database-backed notification engine:

- **Triggers**: Automatically generates notifications when a task is assigned to a user or when a member is added to a project.
- **Notification Dropdown**: Located in the top header featuring an unread count badge, notification feed, and `Mark all as read` button.
- **API Endpoints**: `GET /api/notifications` (fetches user notifications) and `PUT /api/notifications/read-all` (marks notifications as read).

---

## 🗄️ Database Schema & Migrations

The database is powered by **PostgreSQL** and managed via **Prisma ORM**.

### Models Overview
- `User`: User accounts, hashed credentials, roles, avatar URLs.
- `Project`: Project workspaces, unique keys (e.g. `NXR`), description, owner relationship.
- `ProjectMember`: Unique composite relationship `(projectId, userId)` with project-level roles.
- `Task`: Task keys (`NXR-101`), status, priority, position ordering, assignee, creator, due date.
- `Comment`: Task comments with author relationships.
- `Notification`: User notifications with read/unread flags.
- `Activity`: Project activity audit logs.

Migrations are version-controlled in [`server/prisma/migrations/`](server/prisma/migrations/):
```bash
# Execute migrations on deployment
npx prisma migrate deploy
```

---

## 📁 Project Structure

```text
CodeAlpha_Nexora/
├── package.json                   # Monorepo root scripts (build, start, test)
├── .gitignore                     # Git exclusion rules (.env, node_modules, dist)
├── .env.example                   # Environment variable template
├── render.yaml                    # Render Blueprint deployment manifest
├── README.md                      # Documentation
├── client/                        # React + Vite Frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── components/            # UI Components (Kanban, Layout, Modals, TaskDrawer, Team)
│       ├── context/               # React Context (AuthContext, ProjectContext)
│       ├── pages/                 # Page Views (Dashboard, Kanban, TaskList, ProjectOverview, Team)
│       └── services/              # API Axios client & Socket.IO client
└── server/                        # Node.js + Express Backend
    ├── package.json
    ├── tsconfig.json
    ├── .env.example
    ├── prisma/
    │   ├── schema.prisma          # PostgreSQL Prisma Schema
    │   ├── seed.ts                # Database Seeding Script
    │   └── migrations/            # Versioned SQL Migration History
    └── src/
        ├── app.ts                 # Express App & SPA Client Serving
        ├── index.ts               # HTTP & Socket.IO Server Entry Point
        ├── controllers/           # Route Controllers
        ├── middleware/            # Auth & RBAC Middleware
        ├── routes/                # Express API Route Definitions
        ├── socket/                # Socket.IO Gateway & Event Handlers
        └── tests/                 # Vitest Automated Integration Suite
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher running on `localhost:5432`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/pk7745/CodeAlpha_Nexora.git
cd CodeAlpha_Nexora

# Install monorepo dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in root and `server/`:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nexora_db?schema=public"
JWT_SECRET="your_local_development_jwt_secret"
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

Use a unique secret for local development. Never commit production secrets.

### 3. Database Migration & Seed
```bash
cd server

# Apply database migrations to PostgreSQL
npx prisma migrate deploy

# Seed database with demo accounts
npm run db:seed
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend Express Server (http://localhost:5000)
cd server
npm run dev

# Terminal 2: Frontend Vite Client (http://localhost:5173)
cd client
npm run dev
```

---

## 🔑 Demo Credentials

Demo credentials for local/testing purposes only:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@nexora.io` | `Password123!` | Full admin & project creation/deletion rights |
| **Admin** | `admin@nexora.io` | `Password123!` | Task CRUD & member management |
| **Member** | `member@nexora.io` | `Password123!` | Task creation, status updates, commenting |
| **Viewer** | `viewer@nexora.io` | `Password123!` | Read-only access (Mutations return 403) |

> These credentials are intended for local/demo testing only and must not be reused as production credentials.

---

## 🧪 Testing

Automated integration tests verify authentication, RBAC restrictions, task position persistence, comments ownership, search, and member profile access:

```bash
cd server
npm test
```

### Verified Test Summary
```text
 RUN  v1.6.1 server

 ✓ src/tests/api.test.ts  (19 tests) 725ms

 Test Files  1 passed (1)
      Tests  19 passed (19)
   Duration  1.96s
```

---

## 🏭 Production Build

```bash
# Build both frontend React client and backend Express server
npm run build
```

---

## ☁️ Render Deployment

Nexora is configured to deploy on **Render** as a single Web Service backed by Render PostgreSQL using [`render.yaml`](render.yaml).

### Render Configuration Summary
- **Service Type**: Web Service
- **Environment**: Node
- **Build Command**: `npm install && cd server && npm install && cd ../client && npm install && cd .. && npm run build && cd server && npx prisma migrate deploy`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

### Environment Variables on Render
```env
DATABASE_URL=postgresql://nexora_user:PASSWORD@dpg-xxx-a.render.com/nexora_db
JWT_SECRET=your_production_jwt_secret_key
CORS_ORIGIN=https://YOUR-RENDER-SERVICE.onrender.com
NODE_ENV=production
PORT=10000
```

> Replace this placeholder with the actual URL assigned to your Render Web Service after deployment.

---

## 🌐 Environment Variables

| Variable | Purpose | Example Placeholder |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://USER:PASSWORD@HOST:5432/DB` |
| `JWT_SECRET` | Secret key for JWT signing | `YOUR_PRODUCTION_JWT_SECRET_KEY` |
| `CORS_ORIGIN` | Allowed origin for CORS & Socket.IO | `https://YOUR-RENDER-SERVICE.onrender.com` |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | HTTP server port | `5000` |

---

## 🎯 CodeAlpha Internship

This project was developed as part of the **CodeAlpha Full Stack Development Internship**.

- **Primary Requirement**: Full-stack project management platform with authentication, PostgreSQL database, project/task CRUD, and RBAC permissions.
- **Bonus Requirement Achieved**: Real-time updates and in-app notifications using Socket.IO / WebSockets.

---

## 🔮 Future Improvements

- Email notification delivery via SendGrid / Resend.
- File attachment uploads for tasks (S3 / Cloudinary integration).
- Rich-text markdown editor for task descriptions.
- Advanced sprint velocity charts and burndown metrics.

---

## 👨‍💻 Author

**Pavan Kumar S**

- GitHub: https://github.com/pk7745
- Repository: https://github.com/pk7745/CodeAlpha_Nexora

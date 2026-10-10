# LetsCollab — Collaborative Project Management Platform
### Full Stack Engineering Hackathon 2026 Submission

LetsCollab is an enterprise-grade, real-time collaborative project management platform built for modern engineering teams. Featuring **strict server-enforced RBAC**, **Optimistic Concurrency Control (OCC) with HTTP 409 conflict detection**, **real-time Socket.IO room clustering**, and an **immutable audit trail**.

---

## 🌟 Key Architecture & Winning Features

1. **Real-Time Collaboration Without Refresh**
   - Built on **Socket.IO** with targeted room clustering (`project:${id}` and `user:${id}`).
   - Live synchronization for task creation, drag-and-drop status changes, priority shifts, team updates, comments, and notification pings across all connected browsers simultaneously.
   - Live presence indicator displays avatars of team members viewing or editing the same task in real time.

2. **Concurrent Updates & Conflict Resolution (Optimistic Concurrency Control)**
   - Tasks maintain an integer `version` counter incremented with each valid write.
   - When concurrent edits occur (User A moves version $7 \to 8$, while User B submits an edit based on stale version $7$):
     - The backend detects the conflict and rejects the stale write with **HTTP 409 Conflict**.
     - The UI immediately renders a **Conflict Resolution Dialog** displaying a side-by-side diff comparing the user's unsaved changes against the server's current state.
     - Offers clean resolution actions: **Discard & Load Server Version** or **Force Overwrite**.

3. **Strict Server-Side Authorization (RBAC)**
   - Role boundaries are enforced at the API middleware layer—not merely by hiding UI buttons.
   - Unauthorized API mutations directly return **HTTP 403 Forbidden**.
   - **Admin**: Full system management, user CRUD, project creation/deletion, system activity audit.
   - **Project Manager**: Manage assigned projects, add/remove team members, change project roles, create/update/delete tasks.
   - **Team Member**: Access assigned projects, update assigned tasks, advance task statuses, participate in comments. Cannot delete tasks or manage members.
   - **Viewer**: Strictly read-only access. Any mutation attempt is immediately blocked with HTTP 403.
   - **Account Deactivation**: Deactivated users are blocked from logging in and accessing APIs with HTTP 403.

4. **Interactive 1-Click Role Switcher**
   - For judge testing convenience, an instant persona switcher is built into both the login page and the top navigation bar. Switch between **Admin**, **Project Manager**, **Team Member**, and **Viewer** with a single click to test permissions instantly!

5. **Immutable Activity Audit Log & Real-Time Notifications**
   - Structured audit logging (`user_id`, `project_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`).
   - In-app notification center with read/unread tracking and real-time delivery on task assignments, status shifts, and `@mention` comments.

---

## 👥 Demo Accounts & Credentials

All demo accounts use the standard password: `password123`

| Role | Name | Email | Password | Key Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Pooja Sharma | `admin@letscollab.com` | `password123` | Full system control, user CRUD, create/delete projects |
| **Project Manager** | Rohan Verma | `pm@letscollab.com` | `password123` | Manage assigned projects, tasks CRUD, add/remove members |
| **Team Member** | Aditya Kumar | `dev@letscollab.com` | `password123` | Update assigned tasks, change task status, post comments |
| **Designer** | Maya Patel | `designer@letscollab.com` | `password123` | Design tasks, UX conflict reviews, comments |
| **Viewer** | Ananya Iyer | `viewer@letscollab.com` | `password123` | Read-only view; all mutation attempts return HTTP 403 |
| **Deactivated User** | Vikram Malhotra | `inactive@letscollab.com` | `password123` | Test deactivation enforcement (login returns HTTP 403) |

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: Node.js, Express.js, TypeScript, Socket.IO, Prisma ORM, Zod, JWT, bcryptjs.
- **Database**: Relational SQLite default (zero-configuration out of the box) with seamless PostgreSQL compatibility.
- **Testing**: Jest + Supertest integration suite verifying RBAC and 409 conflict detection.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v22+ (verified with `node -v`)
- **npm**: v10+ (verified with `npm -v`)

### 2. Install Dependencies
From the repository root:
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Database Migration & Seed
Run Prisma to generate database schema and populate realistic test data:
```bash
npm run db:migrate
npm run db:seed
```
*Note: This creates a relational SQLite database (`backend/prisma/dev.db`) with sample users, projects, tasks, comments, and activity logs ready for instant testing.*

### 4. Start the Application
Run both backend and frontend concurrently:
```bash
npm run dev
```

The application services will start at:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5001](http://localhost:5001)
- **API Health**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🧪 Running Automated Tests

Run the backend integration test suite verifying authentication, RBAC, and concurrent conflict handling:
```bash
npm test
```

### Test Coverage Highlights:
- ✅ **Authentication**: Rejection of deactivated users with HTTP 403.
- ✅ **Server-Side RBAC**: Non-admins rejected from user management (HTTP 403).
- ✅ **Viewer Protection**: Viewer forbidden from updating task status (HTTP 403).
- ✅ **Task Deletion Guard**: Team members forbidden from deleting tasks (HTTP 403).
- ✅ **Optimistic Concurrency Control**: Rejection of stale updates with HTTP 409 Conflict, returning latest server state.
- ✅ **Conflict Resolution**: Successful update when re-submitting with latest version.
- ✅ **Real-Time Collaboration**: Comment creation and audit log recording.

---

## 📐 Application Architecture & Data Model

### Data Model Schema (Prisma)
- `User`: `id`, `name`, `email`, `password`, `role`, `avatarUrl`, `isActive`, `createdAt`, `updatedAt`
- `Project`: `id`, `name`, `key`, `description`, `status`, `priority`, `managerId`, `startDate`, `endDate`
- `ProjectMember`: `id`, `projectId`, `userId`, `role`, `joinedAt` (unique on `[projectId, userId]`)
- `Task`: `id`, `taskNumber`, `title`, `description`, `status`, `priority`, `version`, `dueDate`, `tags`, `estimatedHours`, `projectId`, `assigneeId`, `creatorId`
- `Comment`: `id`, `taskId`, `userId`, `content`, `createdAt`, `updatedAt`
- `Notification`: `id`, `userId`, `actorId`, `type`, `title`, `message`, `entityType`, `entityId`, `isRead`, `createdAt`
- `ActivityLog`: `id`, `userId`, `projectId`, `action`, `entityType`, `entityId`, `metadata`, `createdAt`

### PostgreSQL Configuration (Optional)
If you wish to use PostgreSQL instead of SQLite:
1. Update `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set your PostgreSQL connection string in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/letscollab?schema=public"
   ```
3. Run `npm run db:migrate && npm run db:seed`.

---

## 📡 API Contract Overview

| Method | Endpoint | Description | Access Control |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/auth/me` | Fetch active profile | Authenticated |
| `GET` | `/api/auth/demo-users` | Fetch demo accounts for 1-click test | Public |
| `GET` | `/api/users` | List users | Authenticated (Inactive: Admin) |
| `POST` | `/api/users` | Create new user | **Admin Only** |
| `PUT` | `/api/users/:id` | Update user details | **Admin Only** |
| `PATCH`| `/api/users/:id/status`| Activate/Deactivate user | **Admin Only** |
| `GET` | `/api/projects` | List visible projects | Member / Admin |
| `POST` | `/api/projects` | Create new project | **Admin Only** |
| `GET` | `/api/projects/:id` | Get project details & tasks | Member / Admin |
| `PUT` | `/api/projects/:id` | Update project metadata | Admin / Project Manager |
| `PATCH`| `/api/projects/:id/archive` | Toggle project archive | Admin / Project Manager |
| `DELETE`| `/api/projects/:id` | Delete project | **Admin Only** |
| `POST` | `/api/projects/:id/members` | Add project member | Admin / Project Manager |
| `DELETE`| `/api/projects/:id/members/:userId` | Remove project member | Admin / Project Manager |
| `GET` | `/api/tasks/project/:id` | Get tasks for project | Member / Admin |
| `POST` | `/api/tasks/project/:id` | Create new task | Admin / Project Manager |
| `GET` | `/api/tasks/:id` | Get task details & comments | Member / Admin |
| `PUT` | `/api/tasks/:id` | Update task with OCC check | Admin / PM / Assignee |
| `PATCH`| `/api/tasks/:id/status`| Update status (Kanban move) | Admin / PM / Team Member |
| `DELETE`| `/api/tasks/:id` | Delete task | Admin / Project Manager |
| `POST` | `/api/comments/task/:id` | Post comment with @mentions | Admin / PM / Team Member |
| `GET` | `/api/notifications` | Fetch unread notifications | Authenticated User |
| `PATCH`| `/api/notifications/read-all` | Mark all notifications read | Authenticated User |
| `GET` | `/api/activity` | System audit activity stream | Member / Admin |

---

## 🏆 Summary

LetsCollab fulfills 100% of the Challenge Brief specifications:
- Multi-user real-time collaboration with Socket.IO room clustering.
- Strict server-enforced RBAC rejecting unauthorized API calls.
- Optimistic Concurrency Control preventing silent overwrites with HTTP 409 conflict diff modal.
- Full CRUD for Users, Projects, Members, Tasks, and Comments.
- Complete audit logging and notification system.
- Comprehensive automated tests with 100% pass rate.

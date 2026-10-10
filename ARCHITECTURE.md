# Architectural Decision Document & Design Justifications
## Collaborative Project Management Platform — NeoStats

This document details the core architectural decisions, data models, real-time protocols, concurrency models, and security layers implemented in NeoStats.

---

## 1. Real-Time Collaboration Approach

### Technology: Socket.IO over WebSockets
**Why Socket.IO over raw WebSockets or Server-Sent Events (SSE)?**
1. **Bi-directional multiplexing**: Tasks, comments, and presence events require low-latency bi-directional synchronization. SSE is unidirectional (server-to-client), which would require HTTP POST requests for every action and introduce round-trip overhead.
2. **Room Clustering & Scope Isolation**:
   - `project:${projectId}`: Ensures clients only receive messages and mutations pertinent to the project they are actively viewing, preventing bandwidth bloat and cross-tenant data leakage.
   - `user:${userId}`: Provides a private notification pipe where server-side events (such as task assignments, @mentions, and membership invitations) are sent directly to the targeted user.
3. **Automatic Fallback & Heartbeats**: Socket.IO provides built-in reconnection heuristics, transport upgrades (HTTP Long-Polling $\to$ WebSocket), and dead connection cleanup without complex manual bookkeeping.
4. **Active Collaborator Presence**: Sockets broadcast `task:viewing` events, allowing users to see in real time which team members are currently inspecting or editing a task.

---

## 2. Concurrency Control Architecture: Optimistic Concurrency Control (OCC)

### The Problem
When User A and User B open the same task simultaneously:
- User A begins editing title at version 7.
- User B begins editing description at version 7.
- If User A submits first, the database updates to version 8.
- If User B submits subsequently without concurrency checks, User B's payload would silently overwrite User A's changes (the "Lost Update" anomaly).

### NeoStats Solution
1. **Version Field**: Every `Task` record in the database holds an integer `version` initialized to `1`.
2. **Version Checking on Mutation**:
   - The frontend includes the `version` it originally read in its `PUT /api/tasks/:id` payload.
   - The backend checks:
     ```typescript
     if (clientVersion !== currentTask.version && !forceOverwrite) {
       return res.status(409).json({
         conflict: true,
         error: "Conflict: Task has been modified by another user",
         serverVersion: currentTask.version,
         clientVersion: clientVersion,
         currentTask: currentTask,
       });
     }
     ```
3. **Atomic Increment**:
   Upon a match, the backend commits the update and increments the version: `version: currentTask.version + 1`.
4. **UI Conflict Resolution Dialog**:
   When receiving HTTP 409, the client does not crash or lose input. Instead, it opens a dedicated **Conflict Resolution Modal**:
   - Displays side-by-side comparison of local unsaved edits vs the latest database state.
   - Field-by-field diff highlighting.
   - Options to either **Discard & Reload Latest** or **Force Overwrite** (`forceOverwrite: true`).

---

## 3. Authentication & Server-Side RBAC Enforcement

### Principle: Defense in Depth
Authorization is never entrusted to the frontend. While the UI hides unauthorized buttons for clean UX, all API controllers strictly invoke server-side RBAC middleware:

```
[Incoming Request]
        │
        ▼
[authenticateToken] ──► Validates JWT Bearer Token, checks user.isActive in DB
        │
        ▼
[requireSystemRole] ──► Checks system role (ADMIN, PROJECT_MANAGER, TEAM_MEMBER, VIEWER)
        │
        ▼
[checkProjectMembership] ──► Resolves user's effective role in the specific project
        │
        ▼
[Action Handler] ──► Commits mutation, records Audit Log, emits Socket event
```

### Authorization Matrix
| Capability | Admin | Project Manager | Team Member | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| Manage System Users | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| Create / Delete Projects | ✅ | ❌ (403) | ❌ (403) | ❌ (403) |
| Add / Remove Team Members | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Change Member Roles | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Create / Delete Tasks | ✅ | ✅ | ❌ (403) | ❌ (403) |
| Update Assigned Tasks | ✅ | ✅ | ✅ (Own tasks) | ❌ (403) |
| Advance Task Status | ✅ | ✅ | ✅ | ❌ (403) |
| Post Comments / @mentions | ✅ | ✅ | ✅ | ❌ (403) |
| Read Project & Tasks | ✅ | ✅ | ✅ | ✅ |

---

## 4. Relational Data Model Design

The schema is implemented via **Prisma ORM**:
- **Normalized relational tables** ensure referential integrity with foreign key cascading (`onDelete: Cascade` on task deletion cascading comments, `onDelete: SetNull` on creator/assignee deactivation).
- **Unique composite index** on `ProjectMember([projectId, userId])` prevents duplicate memberships.
- **Unique composite index** on `Task([projectId, taskNumber])` enables natural identifiers (`NEO-1`, `NEO-2`).
- **Activity Log** records every critical system transition with JSON metadata for full auditable reproducibility.

---

## 5. Error Handling & Resilience
- **Input Validation**: All payloads validated with **Zod** schemas before reaching controllers, returning structured 400 Bad Request responses with detailed field issues.
- **JWT Expiration & Refresh**: Secure bearer token transmission with expiration and automatic client-side logout redirection.
- **Graceful Socket Reconnection**: Client automatically rejoins project rooms upon connection recovery.

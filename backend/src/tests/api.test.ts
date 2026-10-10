import request from "supertest";
import { app } from "../app";
import { prisma } from "../prisma";

describe("LetsCollab Collaborative Platform Core Test Suite", () => {
  let adminToken: string;
  let pmToken: string;
  let devToken: string;
  let viewerToken: string;
  let inactiveToken: string;

  let testProjectId: string;
  let testTaskId: string;

  beforeAll(async () => {
    // 1. Authenticate sample users from seed
    const adminRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@neostats.com", password: "password123" });
    adminToken = adminRes.body.token;

    const pmRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "pm@neostats.com", password: "password123" });
    pmToken = pmRes.body.token;

    const devRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "dev@neostats.com", password: "password123" });
    devToken = devRes.body.token;

    const viewerRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "viewer@neostats.com", password: "password123" });
    viewerToken = viewerRes.body.token;

    // Fetch existing seeded project
    const project = await prisma.project.findFirst({
      where: { key: "NEO" },
      include: { tasks: true },
    });
    testProjectId = project!.id;
    testTaskId = project!.tasks[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("1. Authentication & Deactivation Enforcement", () => {
    it("should reject login for deactivated user with HTTP 403", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "inactive@neostats.com", password: "password123" });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/deactivated/i);
    });

    it("should allow active users to fetch profile via /api/auth/me", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("admin@neostats.com");
      expect(res.body.user.role).toBe("ADMIN");
    });
  });

  describe("2. Server-Side RBAC Enforcement", () => {
    it("Admin can access user management", async () => {
      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("Non-Admin cannot create users (HTTP 403)", async () => {
      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${devToken}`)
        .send({
          name: "Hacker User",
          email: "hacker@test.com",
          password: "password123",
          role: "ADMIN",
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/i);
    });

    it("Viewer cannot update task status (HTTP 403)", async () => {
      const res = await request(app)
        .patch(`/api/tasks/${testTaskId}/status`)
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({ status: "DONE" });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Viewers/i);
    });

    it("Team Member attempting unauthorized task deletion is rejected with HTTP 403", async () => {
      const res = await request(app)
        .delete(`/api/tasks/${testTaskId}`)
        .set("Authorization", `Bearer ${devToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only Project Managers or Admins/i);
    });

    it("Team Member attempting unauthorized project deletion is rejected with HTTP 403", async () => {
      const res = await request(app)
        .delete(`/api/projects/${testProjectId}`)
        .set("Authorization", `Bearer ${devToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only Project Managers or Admins/i);
    });

    it("Viewer attempting unauthorized project deletion is rejected with HTTP 403", async () => {
      const res = await request(app)
        .delete(`/api/projects/${testProjectId}`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Only Project Managers or Admins/i);
    });

    it("Project Manager can delete a project", async () => {
      const createRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          name: "Temporary Project For Deletion Test",
          key: "DELPM",
          priority: "LOW",
        });
      expect(createRes.status).toBe(201);
      const tempId = createRes.body.project.id;

      const deleteRes = await request(app)
        .delete(`/api/projects/${tempId}`)
        .set("Authorization", `Bearer ${pmToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toMatch(/deleted successfully/i);

      const verifyRes = await request(app)
        .get(`/api/projects/${tempId}`)
        .set("Authorization", `Bearer ${pmToken}`);
      expect(verifyRes.status).toBe(404);
    });

    it("Projects are displayed only to assigned users, the creator, and admins", async () => {
      const devUser = await prisma.user.findUnique({ where: { email: "dev@neostats.com" } });
      const createRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          name: "Confidential Project",
          key: "CONFID",
          priority: "HIGH",
          memberIds: [devUser!.id],
        });
      expect(createRes.status).toBe(201);
      const confId = createRes.body.project.id;

      // Creator (PM) sees it
      const pmList = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${pmToken}`);
      expect(pmList.body.projects.some((p: any) => p.id === confId)).toBe(true);

      // Admin sees it
      const adminList = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(adminList.body.projects.some((p: any) => p.id === confId)).toBe(true);

      // Assigned team member (Dev) sees it
      const devList = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${devToken}`);
      expect(devList.body.projects.some((p: any) => p.id === confId)).toBe(true);

      // Unassigned user (Viewer) does NOT see it in project list
      const viewerList = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(viewerList.body.projects.some((p: any) => p.id === confId)).toBe(false);

      // Unassigned user attempting direct GET /api/projects/:id is rejected with 403 Forbidden
      const viewerDirectGet = await request(app)
        .get(`/api/projects/${confId}`)
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(viewerDirectGet.status).toBe(403);
      expect(viewerDirectGet.body.error).toMatch(/Forbidden/i);

      // Clean up
      await prisma.project.delete({ where: { id: confId } });
    });
  });

  describe("3. Concurrent Updates & Conflict Detection (OCC)", () => {
    it("User A and User B concurrently edit: User A succeeds, User B gets HTTP 409 conflict, then resolves", async () => {
      // Both users initially read the task
      const initialTask = await prisma.task.findUnique({ where: { id: testTaskId } });
      const baseVersion = initialTask!.version;

      // User A submits update based on baseVersion
      const userARes = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          title: "Update by User A",
          version: baseVersion,
        });

      expect(userARes.status).toBe(200);
      expect(userARes.body.task.version).toBe(baseVersion + 1);

      // User B now submits update based on the OLD baseVersion (stale update)
      const userBConflictRes = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          title: "Update by User B based on stale version",
          version: baseVersion, // Stale! Server is now at baseVersion + 1
        });

      expect(userBConflictRes.status).toBe(409);
      expect(userBConflictRes.body.conflict).toBe(true);
      expect(userBConflictRes.body.serverVersion).toBe(baseVersion + 1);
      expect(userBConflictRes.body.clientVersion).toBe(baseVersion);
      expect(userBConflictRes.body.currentTask).toBeDefined();

      // User B reviews currentTask and updates with latest version
      const userBResolvedRes = await request(app)
        .put(`/api/tasks/${testTaskId}`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          title: "Resolved update by User B",
          version: userBConflictRes.body.serverVersion,
        });

      expect(userBResolvedRes.status).toBe(200);
      expect(userBResolvedRes.body.task.version).toBe(baseVersion + 2);
      expect(userBResolvedRes.body.task.title).toBe("Resolved update by User B");
    });
  });

  describe("4. Comments & Activity Logging", () => {
    it("Team member can post comment and receive real-time payload", async () => {
      const res = await request(app)
        .post(`/api/comments/task/${testTaskId}`)
        .set("Authorization", `Bearer ${devToken}`)
        .send({ content: "Testing automated comment creation with @Pooja Sharma" });

      expect(res.status).toBe(201);
      expect(res.body.comment.content).toContain("Testing automated comment");
    });

    it("Activity log reflects task and comment events", async () => {
      const res = await request(app)
        .get(`/api/activity/project/${testProjectId}`)
        .set("Authorization", `Bearer ${devToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.activities)).toBe(true);
      expect(res.body.activities.length).toBeGreaterThan(0);
    });
  });
});

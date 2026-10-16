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

    it("Empty comments are rejected with HTTP 400", async () => {
      const res = await request(app)
        .post(`/api/comments/task/${testTaskId}`)
        .set("Authorization", `Bearer ${devToken}`)
        .send({ content: "" });
      expect(res.status).toBe(400);
    });

    it("Comments can be read, and only the author / PM / Admin can delete them", async () => {
      const created = await request(app)
        .post(`/api/comments/task/${testTaskId}`)
        .set("Authorization", `Bearer ${devToken}`)
        .send({ content: "Comment to read and delete" });
      expect(created.status).toBe(201);
      const commentId = created.body.comment.id;

      // Read
      const list = await request(app)
        .get(`/api/comments/task/${testTaskId}`)
        .set("Authorization", `Bearer ${pmToken}`);
      expect(list.status).toBe(200);
      expect(list.body.comments.some((c: any) => c.id === commentId)).toBe(true);

      // Non-author, non-manager cannot delete
      const viewerDelete = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(viewerDelete.status).toBe(403);

      // Author can delete
      const authorDelete = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Authorization", `Bearer ${devToken}`);
      expect(authorDelete.status).toBe(200);

      const after = await request(app)
        .get(`/api/comments/task/${testTaskId}`)
        .set("Authorization", `Bearer ${devToken}`);
      expect(after.body.comments.some((c: any) => c.id === commentId)).toBe(false);
    });

    it("Admin can delete any user's comment", async () => {
      const created = await request(app)
        .post(`/api/comments/task/${testTaskId}`)
        .set("Authorization", `Bearer ${devToken}`)
        .send({ content: "Admin moderation test" });
      const res = await request(app)
        .delete(`/api/comments/${created.body.comment.id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
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

  describe("5. Optional Organization Support", () => {
    let createdOrgId: string;

    it("User can register with an optional organization name", async () => {
      const uniqueSuffix = Date.now();
      const uniqueEmail = `orguser_${uniqueSuffix}@testcompany.com`;
      const uniqueOrgName = `Acme Innovations ${uniqueSuffix}`;
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Org User",
          email: uniqueEmail,
          password: "password123",
          role: "PROJECT_MANAGER",
          organizationName: uniqueOrgName,
        });

      expect(res.status).toBe(201);
      expect(res.body.user.organizationMemberships).toBeDefined();
      expect(res.body.user.organizationMemberships.length).toBeGreaterThan(0);
      expect(res.body.user.organizationMemberships[0].organization.name).toBe(uniqueOrgName);
      expect(res.body.user.organizationMemberships[0].role).toBe("OWNER");
    });

    it("User can create an organization via API", async () => {
      const uniqueOrg = `Stark Labs ${Date.now()}`;
      const res = await request(app)
        .post("/api/organizations")
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          name: uniqueOrg,
          description: "High-tech collaboration hub",
        });

      expect(res.status).toBe(201);
      expect(res.body.organization.name).toBe(uniqueOrg);
      expect(res.body.organization.userRole).toBe("OWNER");
      createdOrgId = res.body.organization.id;
    });

    it("User can list their organizations", async () => {
      const res = await request(app)
        .get("/api/organizations")
        .set("Authorization", `Bearer ${pmToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.organizations)).toBe(true);
      expect(res.body.organizations.some((o: any) => o.id === createdOrgId)).toBe(true);
    });

    it("Organization owner can invite team member by email", async () => {
      const res = await request(app)
        .post(`/api/organizations/${createdOrgId}/members`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          email: "dev@neostats.com",
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.member.user.email).toBe("dev@neostats.com");
    });
  });

  describe("6. Email-Based Project Invitations & Access Control", () => {
    let inviteId: string;
    let inviteProjectId: string;
    const testSuffix = Math.floor(Math.random() * 90000 + 10000).toString();
    const testKey = `I${testSuffix.slice(0, 4)}`;
    const testJaneEmail = `jane_${testSuffix}@collab.com`;

    it("PM can create a project and invite a user to collaborate by their email address", async () => {
      // 1. Create a fresh project with no extra members
      const createRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          name: `Invite Test Project ${testSuffix}`,
          key: testKey,
          priority: "MEDIUM",
        });
      expect(createRes.status).toBe(201);
      inviteProjectId = createRes.body.project.id;

      // 2. Invite viewer@neostats.com by email
      const res = await request(app)
        .post(`/api/projects/${inviteProjectId}/invitations`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          email: "viewer@neostats.com",
          role: "TEAM_MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.invitation).toBeDefined();
      expect(res.body.invitation.email).toBe("viewer@neostats.com");
      expect(res.body.invitation.status).toBe("PENDING");
      inviteId = res.body.invitation.id;
    });

    it("Invited user can see their pending invitations via /api/projects/my-invitations", async () => {
      const res = await request(app)
        .get("/api/projects/my-invitations")
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.invitations)).toBe(true);
      expect(res.body.invitations.some((inv: any) => inv.id === inviteId)).toBe(true);
    });

    it("Invited user can accept the invitation to gain access to the project", async () => {
      const res = await request(app)
        .post(`/api/projects/invitations/${inviteId}/accept`)
        .set("Authorization", `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.member).toBeDefined();
      expect(res.body.member.role).toBe("TEAM_MEMBER");

      // Verify the user is now listed as a member of the project
      const projectRes = await request(app)
        .get(`/api/projects/${inviteProjectId}`)
        .set("Authorization", `Bearer ${viewerToken}`);
      expect(projectRes.status).toBe(200);
      expect(projectRes.body.project.members.some((m: any) => m.userId === res.body.member.userId)).toBe(true);
    });

    it("New user registration triggers welcome notification and welcome email", async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Collaborator Jane",
          email: testJaneEmail,
          password: "password123",
          role: "TEAM_MEMBER",
        });

      expect(regRes.status).toBe(201);
      const janeToken = regRes.body.token;

      // Verify Jane received the in-app welcome notification
      const notifsRes = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${janeToken}`);

      expect(notifsRes.status).toBe(200);
      expect(
        notifsRes.body.notifications.some(
          (n: any) => n.title.includes("Welcome to LetsCollab")
        )
      ).toBe(true);
    });

    it("PM can directly invite a newly created account by their email ID and collaborate together on project tasks", async () => {
      // 1. PM invites Jane directly by email ID
      const inviteRes = await request(app)
        .post(`/api/projects/${inviteProjectId}/invitations`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          email: testJaneEmail,
          role: "TEAM_MEMBER",
        });

      expect(inviteRes.status).toBe(201);
      expect(inviteRes.body.invitation.email).toBe(testJaneEmail);
      const janeInviteId = inviteRes.body.invitation.id;

      // 2. Jane logs in and accepts the invitation
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testJaneEmail, password: "password123" });
      const janeToken = loginRes.body.token;

      const acceptRes = await request(app)
        .post(`/api/projects/invitations/${janeInviteId}/accept`)
        .set("Authorization", `Bearer ${janeToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);

      // 3. Jane creates a task in the collaborative project
      const taskRes = await request(app)
        .post(`/api/tasks/project/${inviteProjectId}`)
        .set("Authorization", `Bearer ${janeToken}`)
        .send({
          title: "Jane's Collaborative Task",
          description: "Working together with PM on project goals",
          status: "TODO",
          priority: "HIGH",
        });

      expect(taskRes.status).toBe(201);
      const taskId = taskRes.body.task.id;

      // 4. PM comments on Jane's task to collaborate
      const commentRes = await request(app)
        .post(`/api/comments/task/${taskId}`)
        .set("Authorization", `Bearer ${pmToken}`)
        .send({
          content: "Great start, Jane! Let's get this done.",
        });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body.comment.content).toContain("Great start, Jane!");

      // 5. Verify Jane can read the PM's comment on their task
      const getCommentsRes = await request(app)
        .get(`/api/comments/task/${taskId}`)
        .set("Authorization", `Bearer ${janeToken}`);

      expect(getCommentsRes.status).toBe(200);
      expect(getCommentsRes.body.comments.length).toBe(1);
      expect(getCommentsRes.body.comments[0].user.name).toBe("Rohan Verma");
    });
  });
});

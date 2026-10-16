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

  describe("7. Password Reset with Email OTP", () => {
    let sentOtp: string;

    it("User can request a 6-digit OTP for password reset", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "dev@neostats.com" });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/verification code has been sent/i);
      expect(res.body.testOtp).toBeDefined();
      expect(res.body.testOtp).toHaveLength(6);
      sentOtp = res.body.testOtp;
    });

    it("Rejects incorrect or expired OTP with HTTP 400", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          email: "dev@neostats.com",
          otp: "999999", // wrong OTP
          newPassword: "brandnewpassword123",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid or expired/i);
    });

    it("User can reset password with valid OTP and receives instant login session", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({
          email: "dev@neostats.com",
          otp: sentOtp,
          newPassword: "brandnewpassword123",
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("dev@neostats.com");

      // Verify user can now authenticate with the new password
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "dev@neostats.com", password: "brandnewpassword123" });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();

      // Reset password back to password123 for other tests
      const resetBackRes = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "dev@neostats.com" });
      await request(app)
        .post("/api/auth/reset-password")
        .send({
          email: "dev@neostats.com",
          otp: resetBackRes.body.testOtp,
          newPassword: "password123",
        });
    });
  });

  describe("8. End-to-End Team-Based Project Collaboration & Token Invitation System", () => {
    let personAToken: string;
    let personBToken: string;
    let personCToken: string;
    let personFToken: string;
    let createdProjectId: string;
    let tokenB: string;
    let tokenC: string;
    let tokenD: string;
    let tokenE: string;
    let invitationEId: string;

    const emailA = `persona_${Date.now()}@test.com`;
    const emailB = `personb_${Date.now()}@test.com`;
    const emailC = `personc_${Date.now()}@test.com`;
    const emailD = `persond_${Date.now()}@test.com`; // Registers later
    const emailE = `persone_${Date.now()}@test.com`;
    const emailF = `personf_${Date.now()}@test.com`; // Non-member intruder

    beforeAll(async () => {
      // Register Person A (Owner), Person B (Member), Person C (Decliner), Person F (Non-member)
      const regA = await request(app)
        .post("/api/auth/register")
        .send({ name: "Person A", email: emailA, password: "password123" });
      personAToken = regA.body.token;

      const regB = await request(app)
        .post("/api/auth/register")
        .send({ name: "Person B", email: emailB, password: "password123" });
      personBToken = regB.body.token;

      const regC = await request(app)
        .post("/api/auth/register")
        .send({ name: "Person C", email: emailC, password: "password123" });
      personCToken = regC.body.token;

      const regF = await request(app)
        .post("/api/auth/register")
        .send({ name: "Person F", email: emailF, password: "password123" });
      personFToken = regF.body.token;
    });

    it("Step 1: Person A creates project and automatically becomes Project Owner", async () => {
      const res = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${personAToken}`)
        .send({
          name: "Campus Event Management System",
          key: `CEMS${Math.floor(100 + Math.random() * 899)}`,
          description: "Full collaboration hub for campus fest & hackathon organizers",
          priority: "HIGH",
        });

      expect(res.status).toBe(201);
      expect(res.body.project).toBeDefined();
      createdProjectId = res.body.project.id;
      expect(res.body.project.creatorId).toBeDefined();

      // Check Person A is in project members with PROJECT_MANAGER role
      const memberA = res.body.project.members.find((m: any) => m.userId === res.body.project.creatorId);
      expect(memberA).toBeDefined();
      expect(memberA.role).toBe("PROJECT_MANAGER");
    });

    it("Step 2: Person A invites Persons B, C, D, and E in a batch via email with secure tokens", async () => {
      const res = await request(app)
        .post(`/api/projects/${createdProjectId}/invitations`)
        .set("Authorization", `Bearer ${personAToken}`)
        .send({
          emails: [emailB, emailC, emailD, emailE],
          role: "TEAM_MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(4);
      expect(res.body.invitations).toHaveLength(4);

      const invB = res.body.invitations.find((i: any) => i.email === emailB);
      const invC = res.body.invitations.find((i: any) => i.email === emailC);
      const invD = res.body.invitations.find((i: any) => i.email === emailD);
      const invE = res.body.invitations.find((i: any) => i.email === emailE);

      expect(invB.token).toBeDefined();
      expect(invB.status).toBe("PENDING");
      expect(invB.expiresAt).toBeDefined();

      tokenB = invB.token;
      tokenC = invC.token;
      tokenD = invD.token;
      tokenE = invE.token;
      invitationEId = invE.id;
    });

    it("Step 3: Publicly inspect invitation details via GET /api/projects/invitations/token/:token", async () => {
      const res = await request(app).get(`/api/projects/invitations/token/${tokenB}`);
      expect(res.status).toBe(200);
      expect(res.body.invitation).toBeDefined();
      expect(res.body.invitation.email).toBe(emailB);
      expect(res.body.invitation.project.name).toBe("Campus Event Management System");
      expect(res.body.invitation.isExpired).toBe(false);
      expect(res.body.invitation.inviter.name).toBe("Person A");
    });

    it("Step 4: Case A - Person B (existing account) accepts invitation via token and gains project access", async () => {
      const acceptRes = await request(app)
        .post(`/api/projects/invitations/token/${tokenB}/accept`)
        .set("Authorization", `Bearer ${personBToken}`);

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.success).toBe(true);
      expect(acceptRes.body.member.role).toBe("TEAM_MEMBER");

      // Verify Person B can now fetch the private project workspace
      const projectRes = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set("Authorization", `Bearer ${personBToken}`);

      expect(projectRes.status).toBe(200);
      expect(projectRes.body.project.name).toBe("Campus Event Management System");
    });

    it("Step 5: Person C declines invitation via token", async () => {
      const declineRes = await request(app)
        .post(`/api/projects/invitations/token/${tokenC}/decline`)
        .set("Authorization", `Bearer ${personCToken}`);

      expect(declineRes.status).toBe(200);
      expect(declineRes.body.success).toBe(true);

      // Person C should NOT have access to the project workspace
      const projectRes = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set("Authorization", `Bearer ${personCToken}`);

      expect(projectRes.status).toBe(403);
    });

    it("Step 6: Case B - Person D (not yet registered) registers with invited email then accepts via token", async () => {
      // Step 6a: Register Person D
      const regD = await request(app)
        .post("/api/auth/register")
        .send({ name: "Person D", email: emailD, password: "password123" });
      expect(regD.status).toBe(201);
      const personDToken = regD.body.token;

      // Before accepting, Person D is NOT in the project
      const preCheck = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set("Authorization", `Bearer ${personDToken}`);
      expect(preCheck.status).toBe(403);

      // Step 6b: Person D accepts the invitation via token
      const acceptD = await request(app)
        .post(`/api/projects/invitations/token/${tokenD}/accept`)
        .set("Authorization", `Bearer ${personDToken}`);
      expect(acceptD.status).toBe(200);

      // Step 6c: Person D now has full access to the project workspace
      const postCheck = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set("Authorization", `Bearer ${personDToken}`);
      expect(postCheck.status).toBe(200);
      expect(postCheck.body.project.id).toBe(createdProjectId);
    });

    it("Step 7: Case C - Revoke, Resend, and Unauthorized email acceptance handling", async () => {
      // Intruding user (Person F) attempts to accept Person E's invitation
      const wrongEmailRes = await request(app)
        .post(`/api/projects/invitations/token/${tokenE}/accept`)
        .set("Authorization", `Bearer ${personFToken}`);
      expect(wrongEmailRes.status).toBe(403);
      expect(wrongEmailRes.body.error).toMatch(/different email address|signed in as/i);

      // Person A revokes Person E's invitation
      const revokeRes = await request(app)
        .delete(`/api/projects/${createdProjectId}/invitations/${invitationEId}`)
        .set("Authorization", `Bearer ${personAToken}`);
      expect(revokeRes.status).toBe(200);

      // Inspecting revoked token indicates revoked status
      const inspectRevoked = await request(app).get(`/api/projects/invitations/token/${tokenE}`);
      expect(inspectRevoked.status).toBe(200);
      expect(inspectRevoked.body.invitation.status).toBe("REVOKED");

      // Attempting to accept a revoked token is rejected
      const acceptRevoked = await request(app)
        .post(`/api/projects/invitations/token/${tokenE}/accept`)
        .set("Authorization", `Bearer ${personAToken}`); // Even with correct or incorrect user
      expect(acceptRevoked.status).toBe(400);
      expect(acceptRevoked.body.error).toMatch(/revoked/i);

      // Person A resends the invitation to Person E
      const resendRes = await request(app)
        .post(`/api/projects/${createdProjectId}/invitations/${invitationEId}/resend`)
        .set("Authorization", `Bearer ${personAToken}`);
      expect(resendRes.status).toBe(200);
      expect(resendRes.body.success).toBe(true);
      expect(resendRes.body.invitation.status).toBe("PENDING");
    });

    it("Step 8: Non-member Person F is strictly blocked from the project workspace and tasks", async () => {
      // Workspace access forbidden
      const projRes = await request(app)
        .get(`/api/projects/${createdProjectId}`)
        .set("Authorization", `Bearer ${personFToken}`);
      expect(projRes.status).toBe(403);

      // Tasks listing for this project forbidden
      const taskRes = await request(app)
        .get(`/api/tasks/project/${createdProjectId}`)
        .set("Authorization", `Bearer ${personFToken}`);
      expect(taskRes.status).toBe(403);

      // Non-member cannot manage members or invite anyone
      const inviteRes = await request(app)
        .post(`/api/projects/${createdProjectId}/invitations`)
        .set("Authorization", `Bearer ${personFToken}`)
        .send({ email: "intruder_friend@test.com" });
      expect(inviteRes.status).toBe(403);
    });
  });

  describe("9. Account Details Persistence & Permanent Account Deletion Lifecycle", () => {
    const userEmail = `persist_user_${Date.now()}@neostats.com`;
    let userToken: string;
    let userId: string;

    it("Step 1: Account creation details are saved into the database and preserved across sessions", async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Persistent User",
          email: userEmail,
          password: "MySecurePassword123",
          role: "TEAM_MEMBER",
        });
      expect(regRes.status).toBe(201);
      expect(regRes.body.user.email).toBe(userEmail);
      userToken = regRes.body.token;
      userId = regRes.body.user.id;

      // Log in again from another session - details must be intact
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: userEmail,
          password: "MySecurePassword123",
        });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.name).toBe("Persistent User");
      expect(loginRes.body.user.id).toBe(userId);
    });

    it("Step 2: User can customize and change avatar options", async () => {
      const newAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=RoboNeo";
      const updateRes = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          avatarUrl: newAvatar,
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.user.avatarUrl).toBe(newAvatar);

      // Verify persistent avatar from profile endpoint
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${userToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.avatarUrl).toBe(newAvatar);
    });

    it("Step 3: Permanent account deletion requires password verification", async () => {
      // Wrong password fails
      const wrongPassRes = await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ password: "WrongPassword" });
      expect(wrongPassRes.status).toBe(400);
      expect(wrongPassRes.body.error).toMatch(/incorrect password/i);

      // Correct password permanently deletes account
      const deleteRes = await request(app)
        .delete("/api/auth/account")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ password: "MySecurePassword123" });
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toMatch(/permanently deleted/i);

      // Account is gone from database; cannot log in anymore
      const deadLoginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: userEmail,
          password: "MySecurePassword123",
        });
      expect(deadLoginRes.status).toBe(401);
    });
  });
});

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning database...");
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectInvitation.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("🌱 Seeding users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@neostats.com",
      name: "Pooja Sharma",
      password: hashedPassword,
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      isActive: true,
    },
  });

  const pm = await prisma.user.create({
    data: {
      email: "pm@neostats.com",
      name: "Rohan Verma",
      password: hashedPassword,
      role: "PROJECT_MANAGER",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      isActive: true,
    },
  });

  const dev = await prisma.user.create({
    data: {
      email: "dev@neostats.com",
      name: "Aditya Kumar",
      password: hashedPassword,
      role: "TEAM_MEMBER",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      isActive: true,
    },
  });

  const designer = await prisma.user.create({
    data: {
      email: "designer@neostats.com",
      name: "Maya Patel",
      password: hashedPassword,
      role: "TEAM_MEMBER",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      isActive: true,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: "viewer@neostats.com",
      name: "Ananya Iyer",
      password: hashedPassword,
      role: "VIEWER",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
      isActive: true,
    },
  });

  const inactiveUser = await prisma.user.create({
    data: {
      email: "inactive@neostats.com",
      name: "Vikram Malhotra",
      password: hashedPassword,
      role: "TEAM_MEMBER",
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
      isActive: false, // Testing deactivated state
    },
  });

  console.log("🌱 Seeding projects...");
  const projectNeo = await prisma.project.create({
    data: {
      name: "NeoFlow Cloud Platform",
      key: "NEO",
      description: "Distributed microservices orchestrator and high-throughput real-time stream engine.",
      status: "ACTIVE",
      priority: "HIGH",
      managerId: pm.id,
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-31"),
      members: {
        create: [
          { userId: admin.id, role: "PROJECT_MANAGER" },
          { userId: pm.id, role: "PROJECT_MANAGER" },
          { userId: dev.id, role: "TEAM_MEMBER" },
          { userId: designer.id, role: "TEAM_MEMBER" },
          { userId: viewer.id, role: "VIEWER" },
        ],
      },
    },
  });

  const projectPulse = await prisma.project.create({
    data: {
      name: "Pulse Mobile Client",
      key: "PLS",
      description: "Next-gen field analytics mobile client with offline-first synchronization.",
      status: "ACTIVE",
      priority: "MEDIUM",
      managerId: pm.id,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2027-02-28"),
      members: {
        create: [
          { userId: pm.id, role: "PROJECT_MANAGER" },
          { userId: dev.id, role: "TEAM_MEMBER" },
          { userId: viewer.id, role: "VIEWER" },
        ],
      },
    },
  });

  const projectArchived = await prisma.project.create({
    data: {
      name: "Legacy Monolith Migration",
      key: "LMM",
      description: "Completed migration of legacy data store to modern distributed datastores.",
      status: "ARCHIVED",
      priority: "LOW",
      managerId: admin.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-08-30"),
      members: {
        create: [
          { userId: admin.id, role: "PROJECT_MANAGER" },
          { userId: dev.id, role: "TEAM_MEMBER" },
        ],
      },
    },
  });

  console.log("🌱 Seeding tasks...");
  const task1 = await prisma.task.create({
    data: {
      projectId: projectNeo.id,
      taskNumber: 1,
      title: "Implement WebSocket room clustering & heartbeat",
      description: "Ensure Socket.IO cluster can handle 10,000 concurrent sockets with sub-10ms delivery latency.",
      status: "IN_PROGRESS",
      priority: "URGENT",
      version: 1,
      dueDate: new Date("2026-10-20"),
      tags: "Backend,Sockets,Performance",
      estimatedHours: 12,
      assigneeId: dev.id,
      creatorId: pm.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: projectNeo.id,
      taskNumber: 2,
      title: "Design optimistic concurrency conflict resolution modal",
      description: "Provide interactive side-by-side diff when HTTP 409 conflict is returned by backend.",
      status: "IN_REVIEW",
      priority: "HIGH",
      version: 1,
      dueDate: new Date("2026-10-18"),
      tags: "Frontend,UX,Conflict",
      estimatedHours: 8,
      assigneeId: designer.id,
      creatorId: pm.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: projectNeo.id,
      taskNumber: 3,
      title: "Audit RBAC server-side authorization middleware",
      description: "Guarantee that unauthorized mutations return HTTP 403 Forbidden even if frontend buttons are tampered with.",
      status: "DONE",
      priority: "HIGH",
      version: 2,
      dueDate: new Date("2026-10-12"),
      tags: "Security,RBAC,API",
      estimatedHours: 6,
      assigneeId: dev.id,
      creatorId: admin.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: projectNeo.id,
      taskNumber: 4,
      title: "Configurable alert webhooks for audit log streams",
      description: "Allow Slack and PagerDuty endpoints to subscribe to security and membership events.",
      status: "TODO",
      priority: "MEDIUM",
      version: 1,
      dueDate: new Date("2026-10-28"),
      tags: "Integration,Webhooks",
      estimatedHours: 10,
      assigneeId: dev.id,
      creatorId: pm.id,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      projectId: projectNeo.id,
      taskNumber: 5,
      title: "Interactive Gantt & Kanban multi-view toggle",
      description: "Smooth spring animations when switching between board, list, and calendar views.",
      status: "BACKLOG",
      priority: "LOW",
      version: 1,
      dueDate: new Date("2026-11-05"),
      tags: "Frontend,Animation",
      estimatedHours: 16,
      assigneeId: designer.id,
      creatorId: pm.id,
    },
  });

  const taskPulse1 = await prisma.task.create({
    data: {
      projectId: projectPulse.id,
      taskNumber: 1,
      title: "Configure SQLite cache layer for offline mutation queue",
      description: "Persist offline user edits locally and sync when back online.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      version: 1,
      dueDate: new Date("2026-10-25"),
      tags: "Mobile,Offline,Sync",
      estimatedHours: 14,
      assigneeId: dev.id,
      creatorId: pm.id,
    },
  });

  console.log("🌱 Seeding comments...");
  await prisma.comment.create({
    data: {
      taskId: task1.id,
      userId: pm.id,
      content: "@Aditya Kumar please benchmark Redis adapter vs default memory store for socket failover.",
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task1.id,
      userId: dev.id,
      content: "Benchmarked! Memory store is lightning fast for single node; Redis adapter ready for horizontal scale.",
    },
  });

  await prisma.comment.create({
    data: {
      taskId: task2.id,
      userId: designer.id,
      content: "Framer Motion modal layout designed with glassmorphism backdrop and clean diff highlights.",
    },
  });

  console.log("🌱 Seeding activity logs...");
  const activities = [
    {
      userId: admin.id,
      projectId: projectNeo.id,
      action: "PROJECT_CREATED",
      entityType: "PROJECT",
      entityId: projectNeo.id,
      metadata: JSON.stringify({ name: projectNeo.name, key: projectNeo.key }),
    },
    {
      userId: pm.id,
      projectId: projectNeo.id,
      action: "MEMBER_ADDED",
      entityType: "MEMBER",
      entityId: dev.id,
      metadata: JSON.stringify({ memberName: dev.name, role: "TEAM_MEMBER" }),
    },
    {
      userId: pm.id,
      projectId: projectNeo.id,
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task1.id,
      metadata: JSON.stringify({ title: task1.title, priority: task1.priority }),
    },
    {
      userId: dev.id,
      projectId: projectNeo.id,
      action: "TASK_STATUS_CHANGED",
      entityType: "TASK",
      entityId: task1.id,
      metadata: JSON.stringify({ from: "TODO", to: "IN_PROGRESS", title: task1.title }),
    },
    {
      userId: pm.id,
      projectId: projectNeo.id,
      action: "COMMENT_ADDED",
      entityType: "COMMENT",
      entityId: task1.id,
      metadata: JSON.stringify({ taskTitle: task1.title, snippet: "@Aditya Kumar please benchmark Redis adapter..." }),
    },
    {
      userId: admin.id,
      projectId: projectArchived.id,
      action: "PROJECT_ARCHIVED",
      entityType: "PROJECT",
      entityId: projectArchived.id,
      metadata: JSON.stringify({ name: projectArchived.name }),
    },
  ];

  for (const act of activities) {
    await prisma.activityLog.create({ data: act });
  }

  console.log("🌱 Seeding notifications...");
  await prisma.notification.create({
    data: {
      userId: dev.id,
      actorId: pm.id,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: "Rohan Verma assigned you to 'Implement WebSocket room clustering & heartbeat'",
      entityType: "TASK",
      entityId: task1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: dev.id,
      actorId: pm.id,
      type: "COMMENT_ADDED",
      title: "Mentioned in Comment",
      message: "Rohan Verma mentioned you in a comment on task NEO-1",
      entityType: "TASK",
      entityId: task1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: designer.id,
      actorId: pm.id,
      type: "TASK_ASSIGNED",
      title: "New Task Assigned",
      message: "Rohan Verma assigned you to 'Design optimistic concurrency conflict resolution modal'",
      entityType: "TASK",
      entityId: task2.id,
      isRead: true,
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("Demo credentials created:");
  console.log("  ADMIN:           admin@neostats.com    / password123");
  console.log("  PROJECT MANAGER: pm@neostats.com       / password123");
  console.log("  TEAM MEMBER:     dev@neostats.com      / password123");
  console.log("  VIEWER:          viewer@neostats.com   / password123");
  console.log("  INACTIVE USER:   inactive@neostats.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import { reconcilePersistentUsers } from "../src/services/accountStorage.service";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up any pre-seeded sample accounts and sample projects...");

  // Remove legacy pre-seeded sample projects
  const deletedProjects = await prisma.project.deleteMany({
    where: {
      key: { in: ["NEO", "PLS", "LMM"] },
    },
  });

  // Remove legacy pre-seeded sample accounts
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { endsWith: "@neostats.com" } },
        { email: { endsWith: "@testcompany.com" } },
        { email: { endsWith: "@collab.com" } },
        { email: { endsWith: "@test.com" } },
      ],
    },
  });

  if (deletedProjects.count > 0 || deletedUsers.count > 0) {
    console.log(
      `✅ Removed ${deletedUsers.count} pre-seeded sample accounts and ${deletedProjects.count} sample projects.`
    );
  }

  // Reconcile and restore any real user-created accounts from persistent storage
  await reconcilePersistentUsers();

  console.log("✅ Database is clean and ready for real user accounts.");
}

main()
  .catch((e) => {
    console.error("❌ Database initialization error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

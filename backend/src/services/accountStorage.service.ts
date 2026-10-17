import fs from "fs";
import path from "path";
import { prisma } from "../prisma";

const DATA_DIR = path.resolve(__dirname, "../../data");
const REGISTRY_FILE = path.join(DATA_DIR, "registered_users.json");

const CLOUD_REGISTRY_URL =
  process.env.CLOUD_REGISTRY_URL || "https://letscollab-delta.vercel.app/api/cloud-registry";
const REGISTRY_SECRET =
  process.env.REGISTRY_SECRET || "letscollab-cloud-storage-key-2026";

const SAMPLE_EMAILS = new Set([
  "admin@neostats.com",
  "pm@neostats.com",
  "dev@neostats.com",
  "designer@neostats.com",
  "viewer@neostats.com",
  "inactive@neostats.com",
]);

const SAMPLE_PROJECT_KEYS = ["NEO", "PLS", "LMM"];

export function isSampleOrTestEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  if (SAMPLE_EMAILS.has(lower)) return true;
  if (
    lower.endsWith("@neostats.com") ||
    lower.endsWith("@testcompany.com") ||
    lower.endsWith("@collab.com") ||
    lower.endsWith("@test.com")
  ) {
    return true;
  }
  return false;
}

export interface PersistentUserRecord {
  id: string;
  email: string;
  password: string; // bcrypt hash
  name: string;
  role: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function ensureRegistryFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(REGISTRY_FILE)) {
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("[AccountStorage] Error ensuring registry file:", err);
  }
}

export function readPersistentUsers(): PersistentUserRecord[] {
  ensureRegistryFile();
  try {
    const raw = fs.readFileSync(REGISTRY_FILE, "utf-8");
    const parsed: PersistentUserRecord[] = JSON.parse(raw);
    return parsed.filter((u) => !isSampleOrTestEmail(u.email));
  } catch (err) {
    console.error("[AccountStorage] Error reading registry file:", err);
    return [];
  }
}

/**
 * Asynchronously pushes user updates to the cloud Vercel Blob registry
 */
async function pushToCloudRegistry(action: string, payload: any): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  try {
    const res = await fetch(CLOUD_REGISTRY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-registry-secret": REGISTRY_SECRET,
      },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[AccountStorage] Cloud registry push returned status ${res.status}:`, errText);
    } else {
      console.log(`[AccountStorage] Cloud registry updated successfully with action: ${action}`);
    }
  } catch (err: any) {
    console.warn(`[AccountStorage] Cloud registry push network warning:`, err.message);
  }
}

/**
 * Asynchronously pulls all persistent users from the cloud Vercel Blob registry
 */
async function pullFromCloudRegistry(): Promise<PersistentUserRecord[]> {
  try {
    const res = await fetch(CLOUD_REGISTRY_URL, {
      method: "GET",
      headers: {
        "x-registry-secret": REGISTRY_SECRET,
      },
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    if (data?.success && Array.isArray(data.users)) {
      return data.users.filter((u: any) => u.email && !isSampleOrTestEmail(u.email));
    }
    return [];
  } catch (err: any) {
    console.warn(`[AccountStorage] Cloud registry pull network warning:`, err.message);
    return [];
  }
}

export function saveUserToPersistentRegistry(user: PersistentUserRecord): void {
  if (process.env.NODE_ENV === "test") return;
  if (isSampleOrTestEmail(user.email)) return;
  ensureRegistryFile();
  try {
    const users = readPersistentUsers();
    const index = users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(users, null, 2), "utf-8");
    console.log(`[AccountStorage] User ${user.email} saved to local persistent registry.`);

    // Push to remote cloud store so container restarts don't lose it
    pushToCloudRegistry("save_user", { user });
  } catch (err) {
    console.error("[AccountStorage] Error saving user to registry:", err);
  }
}

export function removeUserFromPersistentRegistry(emailOrId: string): void {
  if (process.env.NODE_ENV === "test") return;
  ensureRegistryFile();
  try {
    const users = readPersistentUsers();
    const filtered = users.filter(
      (u) => u.id !== emailOrId && u.email.toLowerCase() !== emailOrId.toLowerCase()
    );
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    console.log(`[AccountStorage] User ${emailOrId} permanently removed from local registry.`);

    // Remove from remote cloud store
    pushToCloudRegistry("remove_user", { emailOrId });
  } catch (err) {
    console.error("[AccountStorage] Error removing user from registry:", err);
  }
}

/**
 * On-demand account restorer.
 * If a user attempts to sign in or reset password after a container cold-start,
 * this function checks local & cloud registries and seamlessly restores the user
 * into the active Prisma database so they never have to create an account twice.
 */
export async function restoreUserFromRegistry(emailOrId: string): Promise<any | null> {
  const target = emailOrId.toLowerCase().trim();
  if (isSampleOrTestEmail(target)) return null;

  // 1. Check local registry first
  let registryUsers = readPersistentUsers();
  let match = registryUsers.find(
    (u) => u.email.toLowerCase() === target || u.id === emailOrId
  );

  // 2. If not found locally, fetch from cloud registry
  if (!match) {
    const cloudUsers = await pullFromCloudRegistry();
    if (cloudUsers.length > 0) {
      // Merge into local registry
      for (const cu of cloudUsers) {
        if (!registryUsers.some((r) => r.email.toLowerCase() === cu.email.toLowerCase())) {
          registryUsers.push(cu);
        }
      }
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registryUsers, null, 2), "utf-8");
      match = registryUsers.find(
        (u) => u.email.toLowerCase() === target || u.id === emailOrId
      );
    }
  }

  if (!match) return null;

  // 3. Ensure user exists in Prisma DB
  const existingInDb = await prisma.user.findUnique({
    where: { email: match.email.toLowerCase() },
  });

  if (existingInDb) {
    return existingInDb;
  }

  // Restore into DB
  try {
    const restored = await prisma.user.create({
      data: {
        id: match.id,
        email: match.email.toLowerCase(),
        password: match.password,
        name: match.name,
        role: match.role,
        avatarUrl: match.avatarUrl,
        isActive: match.isActive !== false,
        createdAt: new Date(match.createdAt),
        updatedAt: new Date(match.updatedAt || match.createdAt),
      },
    });
    console.log(`[AccountStorage] On-demand restored user: ${restored.email}`);
    return restored;
  } catch (err) {
    console.error(`[AccountStorage] Failed to recreate user in DB:`, err);
    return null;
  }
}

/**
 * Purges any legacy pre-seeded sample accounts and sample projects from the database,
 * then reconciles real persistent user accounts on server startup from both local & cloud registries.
 */
export async function reconcilePersistentUsers(): Promise<void> {
  if (process.env.NODE_ENV === "test") return;
  ensureRegistryFile();
  try {
    // 0. Remove pre-seeded sample projects & sample users if present in DB
    await prisma.project.deleteMany({
      where: { key: { in: SAMPLE_PROJECT_KEYS } },
    });

    const allDbUsers = await prisma.user.findMany();
    const sampleUserIds = allDbUsers
      .filter((u) => isSampleOrTestEmail(u.email))
      .map((u) => u.id);

    if (sampleUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: sampleUserIds } },
      });
      console.log(`[AccountStorage] Purged ${sampleUserIds.length} pre-seeded sample accounts.`);
    }

    // 1. Pull users from Cloud Registry
    const cloudUsers = await pullFromCloudRegistry();
    let registryUsers = readPersistentUsers();
    let registryUpdated = false;

    for (const cu of cloudUsers) {
      if (isSampleOrTestEmail(cu.email)) continue;
      const idx = registryUsers.findIndex((r) => r.email.toLowerCase() === cu.email.toLowerCase());
      if (idx < 0) {
        registryUsers.push(cu);
        registryUpdated = true;
      }
    }

    // 2. Export any existing real Prisma users into the registry if missing
    const existingDbUsers = await prisma.user.findMany();
    for (const dbUser of existingDbUsers) {
      if (isSampleOrTestEmail(dbUser.email)) continue;
      if (!registryUsers.some((r) => r.email.toLowerCase() === dbUser.email.toLowerCase())) {
        registryUsers.push({
          id: dbUser.id,
          email: dbUser.email,
          password: dbUser.password,
          name: dbUser.name,
          role: dbUser.role,
          avatarUrl: dbUser.avatarUrl,
          isActive: dbUser.isActive,
          createdAt: dbUser.createdAt.toISOString(),
          updatedAt: dbUser.updatedAt.toISOString(),
        });
        registryUpdated = true;
      }
    }

    if (registryUpdated) {
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registryUsers, null, 2), "utf-8");
      // Sync back to cloud so both are always in lockstep
      pushToCloudRegistry("sync_all", { users: registryUsers });
    }

    // 3. Restore any real registry users that are missing in the database
    for (const regUser of registryUsers) {
      if (isSampleOrTestEmail(regUser.email)) continue;
      const dbMatch = await prisma.user.findUnique({ where: { email: regUser.email.toLowerCase() } });
      if (!dbMatch) {
        await prisma.user.create({
          data: {
            id: regUser.id,
            email: regUser.email.toLowerCase(),
            password: regUser.password,
            name: regUser.name,
            role: regUser.role,
            avatarUrl: regUser.avatarUrl,
            isActive: regUser.isActive,
            createdAt: new Date(regUser.createdAt),
            updatedAt: new Date(regUser.updatedAt || regUser.createdAt),
          },
        });
        console.log(`[AccountStorage] Restored persistent account: ${regUser.email}`);
      }
    }
  } catch (err) {
    console.error("[AccountStorage] Error during user reconciliation:", err);
  }
}

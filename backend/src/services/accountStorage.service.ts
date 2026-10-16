import fs from "fs";
import path from "path";
import { prisma } from "../prisma";

const DATA_DIR = path.resolve(__dirname, "../../data");
const REGISTRY_FILE = path.join(DATA_DIR, "registered_users.json");

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
    return JSON.parse(raw);
  } catch (err) {
    console.error("[AccountStorage] Error reading registry file:", err);
    return [];
  }
}

export function saveUserToPersistentRegistry(user: PersistentUserRecord): void {
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
    console.log(`[AccountStorage] User ${user.email} saved to persistent registry.`);
  } catch (err) {
    console.error("[AccountStorage] Error saving user to registry:", err);
  }
}

export function removeUserFromPersistentRegistry(emailOrId: string): void {
  ensureRegistryFile();
  try {
    const users = readPersistentUsers();
    const filtered = users.filter(
      (u) => u.id !== emailOrId && u.email.toLowerCase() !== emailOrId.toLowerCase()
    );
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    console.log(`[AccountStorage] User ${emailOrId} permanently removed from registry.`);
  } catch (err) {
    console.error("[AccountStorage] Error removing user from registry:", err);
  }
}

/**
 * Reconciles persistent users with the database on server startup.
 * Ensures any registered account is never lost even if container reboots.
 */
export async function reconcilePersistentUsers(): Promise<void> {
  ensureRegistryFile();
  try {
    // 1. Export any existing Prisma users into the registry if missing
    const existingDbUsers = await prisma.user.findMany();
    const registryUsers = readPersistentUsers();
    let registryUpdated = false;

    for (const dbUser of existingDbUsers) {
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
    }

    // 2. Restore any registry users that are missing in the database
    for (const regUser of registryUsers) {
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

import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

const REGISTRY_SECRET = process.env.REGISTRY_SECRET || "letscollab-cloud-storage-key-2026";
const BLOB_PATH = "registry/persistent_users.json";

// In-memory fallback cache across serverless warm invocations
let memoryRegistryCache: any[] | null = null;

async function fetchRegistryFromBlob(): Promise<any[]> {
  try {
    const { blobs } = await list({ prefix: "registry/persistent_users" });
    if (!blobs || blobs.length === 0) {
      return memoryRegistryCache || [];
    }

    // Pick the most recent blob matching the prefix
    const latestBlob = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
    const res = await fetch(latestBlob.url, { cache: "no-store" });
    if (!res.ok) {
      return memoryRegistryCache || [];
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      memoryRegistryCache = data;
      return data;
    }
    return memoryRegistryCache || [];
  } catch (err) {
    console.warn("[CloudRegistry] Blob read fallback to memory cache:", err);
    return memoryRegistryCache || [];
  }
}

async function saveRegistryToBlob(users: any[]): Promise<boolean> {
  memoryRegistryCache = users;
  try {
    const jsonContent = JSON.stringify(users, null, 2);
    await put(BLOB_PATH, jsonContent, {
      access: "public",
      addRandomSuffix: true,
      contentType: "application/json",
    });
    return true;
  } catch (err) {
    console.warn("[CloudRegistry] Blob write failed, persisted in memory cache:", err);
    return false;
  }
}

// GET: Retrieve the list of persistent registered users
export async function GET(req: NextRequest) {
  try {
    const users = await fetchRegistryFromBlob();
    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err: any) {
    console.error("[CloudRegistry] Error in GET:", err);
    return NextResponse.json({ success: false, error: err.message, users: memoryRegistryCache || [] }, { status: 500 });
  }
}

// POST: Save or remove user in the persistent cloud registry
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-registry-secret");
    if (secret !== REGISTRY_SECRET) {
      return NextResponse.json({ error: "Unauthorized registry access" }, { status: 401 });
    }

    const body = await req.json();
    const { action, user, emailOrId, users } = body;

    let currentUsers = await fetchRegistryFromBlob();

    if (action === "save_user" && user && user.email) {
      const idx = currentUsers.findIndex(
        (u) => u.email.toLowerCase() === user.email.toLowerCase() || u.id === user.id
      );
      if (idx >= 0) {
        currentUsers[idx] = { ...currentUsers[idx], ...user };
      } else {
        currentUsers.push(user);
      }
      await saveRegistryToBlob(currentUsers);
      return NextResponse.json({ success: true, action: "saved", count: currentUsers.length });
    }

    if (action === "remove_user" && emailOrId) {
      const target = String(emailOrId).toLowerCase().trim();
      currentUsers = currentUsers.filter(
        (u) => u.id !== emailOrId && u.email.toLowerCase() !== target
      );
      await saveRegistryToBlob(currentUsers);
      return NextResponse.json({ success: true, action: "removed", count: currentUsers.length });
    }

    if (action === "sync_all" && Array.isArray(users)) {
      for (const incoming of users) {
        if (!incoming.email) continue;
        const idx = currentUsers.findIndex(
          (u) => u.email.toLowerCase() === incoming.email.toLowerCase() || u.id === incoming.id
        );
        if (idx >= 0) {
          currentUsers[idx] = { ...currentUsers[idx], ...incoming };
        } else {
          currentUsers.push(incoming);
        }
      }
      await saveRegistryToBlob(currentUsers);
      return NextResponse.json({ success: true, action: "synced", count: currentUsers.length });
    }

    return NextResponse.json({ error: "Invalid action or missing parameters" }, { status: 400 });
  } catch (err: any) {
    console.error("[CloudRegistry] Error in POST:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

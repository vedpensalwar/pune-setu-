import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { User } from "../auth/types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "punesetu-users.json");

let memoryCache: User[] | null = null;

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    console.error("Failed to initialize user data store directory:", err);
  }
}

async function readAll(): Promise<User[]> {
  await ensureDataFile();
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(data) as User[];
    memoryCache = parsed;
    return parsed;
  } catch (err) {
    if (memoryCache !== null) return memoryCache;
    return [];
  }
}

async function writeAll(users: User[]): Promise<void> {
  await ensureDataFile();
  const tempFile = `${USERS_FILE}.${crypto.randomUUID()}.tmp`;
  const content = JSON.stringify(users, null, 2);
  await fs.writeFile(tempFile, content, "utf8");
  await fs.rename(tempFile, USERS_FILE);
  memoryCache = users;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const users = await readAll();
  const match = users.find((u) => u.email.toLowerCase() === normalized);
  return match || null;
}

export async function findUserById(id: string): Promise<User | null> {
  if (!id) return null;
  const users = await readAll();
  const match = users.find((u) => u.id === id);
  return match || null;
}

export async function createUser(
  data: Omit<User, "id" | "createdAt" | "updatedAt">
): Promise<User> {
  const users = await readAll();
  const normalizedEmail = data.email.trim().toLowerCase();

  // Enforce unique email at the persistence layer
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error("An account with this email address already exists.");
  }

  const now = new Date().toISOString();
  const newUser: User = {
    ...data,
    id: `usr_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`,
    email: normalizedEmail,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  await writeAll(users);
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<Omit<User, "id" | "createdAt">>
): Promise<User | null> {
  const users = await readAll();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  const updated: User = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  users[index] = updated;
  await writeAll(users);
  return updated;
}

export async function countUsers(): Promise<number> {
  const users = await readAll();
  return users.length;
}

export async function listAllUsers(): Promise<User[]> {
  return readAll();
}

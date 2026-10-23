#!/usr/bin/env node

/**
 * PuneSetu (पुणे सेतू) - Secure Administrator Provisioning Script
 *
 * Usage:
 *   ADMIN_EMAIL="admin@punesetu.gov.in" ADMIN_PASSWORD="ChangeMe@Pune2026!" ADMIN_NAME="PMC Chief Administrator" node scripts/provision-admin.js
 *
 * Security:
 *   - NEVER hardcodes secrets in source or commits.
 *   - Hashes passwords using bcrypt with salt rounds = 10.
 *   - Verifies if an admin with the same email already exists (prevents accidental overwrite).
 *   - Saves administrator safely to the persistent identity store.
 */

const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "punesetu-users.json");

async function readUsers() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  const tempFile = `${USERS_FILE}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(users, null, 2), "utf8");
  await fs.rename(tempFile, USERS_FILE);
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || process.argv[2] || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || "";
  const name = (process.env.ADMIN_NAME || process.argv[4] || "PMC Central Administrator").trim();

  if (!email || !password) {
    console.error("❌ Configuration Error: Missing required administrator provisioning credentials.");
    console.error("Usage:");
    console.error("  ADMIN_EMAIL=\"admin@punesetu.gov.in\" ADMIN_PASSWORD=\"Secr3tP@ss\" ADMIN_NAME=\"Admin Name\" node scripts/provision-admin.js");
    console.error("  OR: node scripts/provision-admin.js <email> <password> [name]");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ Security Error: Administrator password must be at least 8 characters long.");
    process.exit(1);
  }

  if (!email.includes("@")) {
    console.error("❌ Validation Error: Invalid administrator email format.");
    process.exit(1);
  }

  const users = await readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email);

  if (existing) {
    if (existing.role === "ADMIN") {
      console.warn(`⚠️ An administrator account already exists for ${email}. Accidental overwrite prevented.`);
      console.log(`Administrator ID: ${existing.id}`);
      process.exit(0);
    } else {
      console.error(`❌ Conflict Error: An account already exists for ${email} with role ${existing.role}. Cannot elevate automatically.`);
      process.exit(1);
    }
  }

  console.log(`🔒 Hashing administrator password securely using bcrypt...`);
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const newAdmin = {
    id: `usr_adm_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`,
    name,
    email,
    passwordHash,
    role: "ADMIN",
    status: "ACTIVE",
    department: "PMC Municipal Commissioner Office",
    ward: "Headquarters (Shivajinagar)",
    createdAt: now,
    updatedAt: now,
  };

  users.push(newAdmin);
  await writeUsers(users);

  console.log(`✅ PuneSetu Administrator account provisioned successfully!`);
  console.log(`   ID:       ${newAdmin.id}`);
  console.log(`   Name:     ${newAdmin.name}`);
  console.log(`   Email:    ${newAdmin.email}`);
  console.log(`   Role:     ${newAdmin.role}`);
  console.log(`   Status:   ${newAdmin.status}`);
  console.log(`   Created:  ${newAdmin.createdAt}`);
  console.log(`🔒 Passwords and hash secrets are excluded from logs.`);
}

main().catch((err) => {
  console.error("❌ Fatal provisioning failure:", err);
  process.exit(1);
});

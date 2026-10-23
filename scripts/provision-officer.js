#!/usr/bin/env node

/**
 * PuneSetu (पुणे सेतू) - Secure Municipal Officer Provisioning Script
 *
 * Usage:
 *   OFFICER_EMAIL="officer.roads@punesetu.gov.in" \
 *   OFFICER_PASSWORD="OfficerPass@2026" \
 *   OFFICER_NAME="Er. Sachin Kadam" \
 *   OFFICER_DEPT="Roads & Infrastructure Maintenance" \
 *   OFFICER_WARD="Shivajinagar - Ghole Road (Prabhag 08)" \
 *   node scripts/provision-officer.js
 *
 * Security:
 *   - Ordinary citizens cannot self-assign officer roles or departments.
 *   - Hashes passwords using bcrypt.
 *   - Prevents duplicate email collision.
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
  const email = (process.env.OFFICER_EMAIL || process.argv[2] || "").trim().toLowerCase();
  const password = process.env.OFFICER_PASSWORD || process.argv[3] || "";
  const name = (process.env.OFFICER_NAME || process.argv[4] || "Municipal Officer").trim();
  const department = (process.env.OFFICER_DEPT || process.argv[5] || "Roads & Infrastructure Maintenance").trim();
  const ward = (process.env.OFFICER_WARD || process.argv[6] || "Shivajinagar - Ghole Road").trim();

  if (!email || !password) {
    console.error("❌ Configuration Error: Missing required officer provisioning credentials.");
    console.error("Usage:");
    console.error("  node scripts/provision-officer.js <email> <password> [name] [department] [ward]");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ Security Error: Officer password must be at least 8 characters long.");
    process.exit(1);
  }

  const users = await readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email);

  if (existing) {
    console.error(`❌ Conflict Error: An account already exists for ${email}. Overwrite prevented.`);
    process.exit(1);
  }

  console.log(`🔒 Hashing officer password securely using bcrypt...`);
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const newOfficer = {
    id: `usr_off_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`,
    name,
    email,
    passwordHash,
    role: "MUNICIPAL_OFFICER",
    status: "ACTIVE",
    department,
    ward,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newOfficer);
  await writeUsers(users);

  console.log(`✅ PuneSetu Municipal Officer account provisioned successfully!`);
  console.log(`   ID:         ${newOfficer.id}`);
  console.log(`   Name:       ${newOfficer.name}`);
  console.log(`   Email:      ${newOfficer.email}`);
  console.log(`   Role:       ${newOfficer.role}`);
  console.log(`   Department: ${newOfficer.department}`);
  console.log(`   Ward:       ${newOfficer.ward}`);
  console.log(`   Status:     ${newOfficer.status}`);
}

main().catch((err) => {
  console.error("❌ Fatal provisioning failure:", err);
  process.exit(1);
});

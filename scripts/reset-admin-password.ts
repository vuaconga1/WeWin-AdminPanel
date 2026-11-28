/**
 * One-off: set password for admin@wewin.local (or ADMIN_SEED_EMAIL).
 * Usage: npx tsx scripts/reset-admin-password.ts [password]
 */
import { hashSync } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const email = (
  process.env.ADMIN_SEED_EMAIL?.trim() || "admin@wewin.local"
).toLowerCase();
const rawPassword = process.argv[2]?.trim() || process.env.ADMIN_SEED_PASSWORD?.trim() || "";

if (
  rawPassword.length < 8 ||
  rawPassword.length > 128 ||
  !/[A-Za-z]/.test(rawPassword) ||
  !/\d/.test(rawPassword)
) {
  console.error("Password must be 8–128 chars with at least one letter and one digit.");
  process.exit(1);
}

const password: string = rawPassword;
const prisma = new PrismaClient();

async function main() {
  const passwordHash = hashSync(password, 12);
  const user = await prisma.adminUser.update({
    where: { email },
    data: { passwordHash },
    select: { id: true, email: true, username: true },
  });
  console.log(`Updated password for ${user.email} (${user.username})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

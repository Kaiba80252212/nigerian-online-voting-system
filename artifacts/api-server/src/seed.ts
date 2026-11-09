// Seeds the default admin account, idempotently.
//
//   pnpm --filter @workspace/api-server run seed
//
// Env:
//   DATABASE_URL   — required (from @workspace/db)
//   ADMIN_USERNAME — default: "admin"
//   ADMIN_PASSWORD — default: "nigeria2025" (change for any real deployment!)
import { db, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const username = process.env.ADMIN_USERNAME ?? "admin";
const password = process.env.ADMIN_PASSWORD ?? "nigeria2025";

async function main() {
  const [existing] = await db
    .select({ id: adminsTable.id })
    .from(adminsTable)
    .where(eq(adminsTable.username, username))
    .limit(1);

  if (existing) {
    console.log(`Admin "${username}" already exists — nothing to do.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(adminsTable).values({ username, passwordHash, role: "admin" });
  console.log(`Admin "${username}" created successfully.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  });

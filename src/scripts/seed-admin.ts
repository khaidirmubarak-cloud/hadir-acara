import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";

async function main() {
  if (!env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD wajib diisi di .env sebelum menjalankan seed.");
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  const admin = await prisma.admin.upsert({
    where: { username: env.ADMIN_USERNAME },
    update: { passwordHash },
    create: {
      username: env.ADMIN_USERNAME,
      passwordHash,
      name: "Administrator",
    },
  });

  console.log(`Admin siap: ${admin.username}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { limiters, consumeRateLimit, getClientIp, RateLimitExceededError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
});

export async function PATCH(req: NextRequest) {
  try {
    await consumeRateLimit(limiters.auth, getClientIp(req));

    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: session.adminId } });
    if (!admin) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

    const valid = await verifyPassword(parsed.data.currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }
}

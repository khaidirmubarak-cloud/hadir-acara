import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { limiters, consumeRateLimit, getClientIp, RateLimitExceededError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    await consumeRateLimit(limiters.auth, getClientIp(req));

    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Username/password wajib diisi" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { username: parsed.data.username } });
    const valid = admin ? await verifyPassword(parsed.data.password, admin.passwordHash) : false;

    if (!admin || !valid) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 });
    }

    const token = await signSession({ adminId: admin.id, username: admin.username, name: admin.name });
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("[auth/login] error", err);
    return NextResponse.json({ error: "Terjadi kesalahan, silakan coba lagi" }, { status: 500 });
  }
}

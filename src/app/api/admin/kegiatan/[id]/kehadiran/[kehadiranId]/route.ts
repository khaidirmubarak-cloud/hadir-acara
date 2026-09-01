import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limiters, consumeRateLimit, getClientIp, RateLimitExceededError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; kehadiranId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await consumeRateLimit(limiters.adminMutation, getClientIp(req));

    const { id, kehadiranId } = await params;
    const kehadiran = await prisma.kehadiran.findUnique({ where: { id: kehadiranId } });
    if (!kehadiran || kehadiran.kegiatanId !== id) {
      return NextResponse.json({ error: "Data kehadiran tidak ditemukan" }, { status: 404 });
    }

    await prisma.kehadiran.delete({ where: { id: kehadiranId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }
}

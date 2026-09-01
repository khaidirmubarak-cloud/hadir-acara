import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeKegiatanStatus } from "@/lib/kegiatan-status";
import { limiters, consumeRateLimit, getClientIp, RateLimitExceededError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await consumeRateLimit(limiters.publicRead, getClientIp(req));

    const { slug } = await params;
    const kegiatan = await prisma.kegiatan.findUnique({ where: { slug } });
    if (!kegiatan) return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });

    const status = computeKegiatanStatus(kegiatan);

    return NextResponse.json({
      nama: kegiatan.nama,
      deskripsi: kegiatan.deskripsi,
      lokasi: kegiatan.lokasi,
      waktuMulai: kegiatan.waktuMulai,
      waktuSelesai: kegiatan.waktuSelesai,
      status,
    });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("[public/kegiatan] error", err);
    return NextResponse.json({ error: "Terjadi kesalahan, silakan coba lagi" }, { status: 500 });
  }
}

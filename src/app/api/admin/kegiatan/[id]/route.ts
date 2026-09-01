import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { kegiatanInputSchema } from "@/lib/validation/kegiatan";
import { parseWitaLocalInput } from "@/lib/timezone";
import { limiters, consumeRateLimit, getClientIp, RateLimitExceededError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id },
    include: { _count: { select: { kehadiran: true } } },
  });
  if (!kegiatan) return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });

  return NextResponse.json({
    kegiatan: {
      ...kegiatan,
      jumlahHadir: kegiatan._count.kehadiran,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await consumeRateLimit(limiters.adminMutation, getClientIp(req));

    const { id } = await params;
    const existing = await prisma.kegiatan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });

    const body = await req.json().catch(() => null);

    // PATCH juga dipakai tombol "tutup lebih awal" (hanya kirim { ditutupManual }).
    if (body && typeof body === "object" && "ditutupManual" in body && Object.keys(body).length === 1) {
      const kegiatan = await prisma.kegiatan.update({
        where: { id },
        data: { ditutupManual: Boolean(body.ditutupManual) },
      });
      return NextResponse.json({ kegiatan });
    }

    const parsed = kegiatanInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    const { nama, deskripsi, lokasi, waktuMulai, waktuSelesai } = parsed.data;
    const kegiatan = await prisma.kegiatan.update({
      where: { id },
      data: {
        nama,
        deskripsi: deskripsi || null,
        lokasi,
        waktuMulai: parseWitaLocalInput(waktuMulai),
        waktuSelesai: parseWitaLocalInput(waktuSelesai),
      },
    });

    return NextResponse.json({ kegiatan });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await consumeRateLimit(limiters.adminMutation, getClientIp(req));

    const { id } = await params;
    const count = await prisma.kehadiran.count({ where: { kegiatanId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: "Kegiatan tidak bisa dihapus karena sudah ada data kehadiran" },
        { status: 409 },
      );
    }

    await prisma.kegiatan.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }
}

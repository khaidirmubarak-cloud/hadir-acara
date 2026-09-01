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
    include: {
      _count: { select: { kehadiran: true } },
      pertanyaan: { orderBy: { urutan: "asc" } },
    },
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

    const { nama, deskripsi, lokasi, waktuMulai, waktuSelesai, pertanyaan } = parsed.data;

    // Pertanyaan yang dihapus dari form tapi sudah punya jawaban peserta tidak
    // boleh ikut terhapus (akan menghilangkan data jawaban yang sudah tercatat).
    const existingPertanyaan = await prisma.pertanyaan.findMany({
      where: { kegiatanId: id },
      include: { _count: { select: { jawaban: true } } },
    });
    const incomingIds = new Set(pertanyaan.map((p) => p.id).filter((v): v is string => Boolean(v)));
    const toRemove = existingPertanyaan.filter((p) => !incomingIds.has(p.id));
    const blocked = toRemove.find((p) => p._count.jawaban > 0);
    if (blocked) {
      return NextResponse.json(
        { error: `Tidak bisa menghapus pertanyaan "${blocked.teks}" karena sudah ada jawaban peserta` },
        { status: 409 },
      );
    }

    const kegiatan = await prisma.$transaction(async (tx) => {
      if (toRemove.length > 0) {
        await tx.pertanyaan.deleteMany({ where: { id: { in: toRemove.map((p) => p.id) } } });
      }
      for (const [index, p] of pertanyaan.entries()) {
        if (p.id) {
          await tx.pertanyaan.update({ where: { id: p.id }, data: { teks: p.teks, urutan: index } });
        } else {
          await tx.pertanyaan.create({ data: { kegiatanId: id, teks: p.teks, urutan: index } });
        }
      }
      return tx.kegiatan.update({
        where: { id },
        data: {
          nama,
          deskripsi: deskripsi || null,
          lokasi,
          waktuMulai: parseWitaLocalInput(waktuMulai),
          waktuSelesai: parseWitaLocalInput(waktuSelesai),
        },
      });
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

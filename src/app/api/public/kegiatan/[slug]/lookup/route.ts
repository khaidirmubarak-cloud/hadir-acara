import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeKegiatanStatus } from "@/lib/kegiatan-status";
import { kehadiranLookupSchema } from "@/lib/validation/kehadiran";
import { fetchMahasiswa, fetchPegawai, SevimaError } from "@/lib/integrations/sevima";
import { limiters, consumeRateLimit, getClientIp, RateLimitExceededError } from "@/lib/rate-limit";
import { formatWita } from "@/lib/timezone";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const ip = getClientIp(req);

  try {
    const { slug } = await params;
    const kegiatan = await prisma.kegiatan.findUnique({ where: { slug } });
    if (!kegiatan) return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });

    const status = computeKegiatanStatus(kegiatan);
    if (status !== "open") {
      return NextResponse.json(
        { error: status === "upcoming" ? "Kegiatan belum dibuka" : "Kegiatan sudah ditutup" },
        { status: 409 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = kehadiranLookupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    const { tipe, nim } = parsed.data;

    const already = await prisma.kehadiran.findUnique({
      where: { kegiatanId_nim: { kegiatanId: kegiatan.id, nim } },
    });
    if (already) {
      return NextResponse.json({
        alreadyRecorded: true,
        nama: already.nama,
        waktuKonfirmasi: formatWita(already.waktuKonfirmasi),
      });
    }

    await consumeRateLimit(limiters.externalLookup, ip);

    const pertanyaan = await prisma.pertanyaan.findMany({
      where: { kegiatanId: kegiatan.id },
      orderBy: { urutan: "asc" },
      select: { id: true, teks: true },
    });

    if (tipe === "pegawai") {
      const pegawai = await fetchPegawai(nim);
      return NextResponse.json({
        alreadyRecorded: false,
        tipe,
        nim: pegawai.nip,
        nama: pegawai.nama,
        programStudi: null,
        pertanyaan,
      });
    }

    const mahasiswa = await fetchMahasiswa(nim);
    return NextResponse.json({
      alreadyRecorded: false,
      tipe,
      nim: mahasiswa.nim,
      nama: mahasiswa.nama,
      programStudi: mahasiswa.programStudi,
      pertanyaan,
    });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof SevimaError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "CONFIG_ERROR" ? 502 : 503;
      return NextResponse.json({ error: err.publicMessage }, { status });
    }
    console.error("[public/lookup] error", err);
    return NextResponse.json({ error: "Terjadi kesalahan, silakan coba lagi" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeKegiatanStatus } from "@/lib/kegiatan-status";
import { kehadiranConfirmSchema } from "@/lib/validation/kehadiran";
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
    // Hanya `tipe`+`nim` yang dipakai — nama/prodi dari body (jika ada) diabaikan;
    // keduanya SELALU diambil ulang dari Sevima di sini, tidak pernah dipercaya dari klien.
    const parsed = kehadiranConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    const { tipe, nim, jawaban } = parsed.data;

    const pertanyaan = await prisma.pertanyaan.findMany({ where: { kegiatanId: kegiatan.id } });
    const jawabanByPertanyaanId = new Map(jawaban.map((j) => [j.pertanyaanId, j.jawaban]));
    const missing = pertanyaan.some((p) => !jawabanByPertanyaanId.get(p.id)?.trim());
    if (missing) {
      return NextResponse.json({ error: "Semua pertanyaan kuisioner wajib diisi" }, { status: 400 });
    }

    await consumeRateLimit(limiters.externalLookup, ip);

    const identitas =
      tipe === "pegawai"
        ? await fetchPegawai(nim).then((p) => ({
            nim: p.nip,
            nama: p.nama,
            programStudi: null as string | null,
            programStudiSevimaId: null as string | null,
          }))
        : await fetchMahasiswa(nim).then((m) => ({
            nim: m.nim,
            nama: m.nama,
            programStudi: m.programStudi as string | null,
            programStudiSevimaId: (m.programStudiSevimaId || null) as string | null,
          }));

    const userAgent = req.headers.get("user-agent") ?? undefined;

    const kehadiran = await prisma.kehadiran.create({
      data: {
        kegiatanId: kegiatan.id,
        tipePeserta: tipe === "pegawai" ? "PEGAWAI" : "MAHASISWA",
        nim: identitas.nim,
        nama: identitas.nama,
        programStudi: identitas.programStudi,
        programStudiSevimaId: identitas.programStudiSevimaId,
        ipAddress: ip,
        userAgent,
        jawaban: {
          create: pertanyaan.map((p) => ({
            pertanyaanId: p.id,
            jawaban: jawabanByPertanyaanId.get(p.id)!.trim(),
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      nama: kehadiran.nama,
      waktuKonfirmasi: formatWita(kehadiran.waktuKonfirmasi),
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Anda sudah tercatat hadir untuk kegiatan ini" }, { status: 409 });
    }
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    if (err instanceof SevimaError) {
      const status = err.code === "NOT_FOUND" ? 404 : err.code === "CONFIG_ERROR" ? 502 : 503;
      return NextResponse.json({ error: err.publicMessage }, { status });
    }
    console.error("[public/confirm] error", err);
    return NextResponse.json({ error: "Terjadi kesalahan, silakan coba lagi" }, { status: 500 });
  }
}

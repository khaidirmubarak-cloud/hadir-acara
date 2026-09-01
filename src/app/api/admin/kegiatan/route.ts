import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateKegiatanSlug } from "@/lib/slug";
import { kegiatanInputSchema } from "@/lib/validation/kegiatan";
import { parseWitaLocalInput } from "@/lib/timezone";
import { limiters, consumeRateLimit, getClientIp, RateLimitExceededError } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const kegiatan = await prisma.kegiatan.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { kehadiran: true } } },
  });

  return NextResponse.json({
    kegiatan: kegiatan.map((k) => ({
      id: k.id,
      slug: k.slug,
      nama: k.nama,
      lokasi: k.lokasi,
      waktuMulai: k.waktuMulai,
      waktuSelesai: k.waktuSelesai,
      ditutupManual: k.ditutupManual,
      jumlahHadir: k._count.kehadiran,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await consumeRateLimit(limiters.adminMutation, getClientIp(req));

    const body = await req.json().catch(() => null);
    const parsed = kegiatanInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }

    const { nama, deskripsi, lokasi, waktuMulai, waktuSelesai, pertanyaan } = parsed.data;

    let slug = generateKegiatanSlug();
    for (let attempt = 0; attempt < 3; attempt++) {
      const existing = await prisma.kegiatan.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateKegiatanSlug();
    }

    const kegiatan = await prisma.kegiatan.create({
      data: {
        slug,
        nama,
        deskripsi: deskripsi || null,
        lokasi,
        waktuMulai: parseWitaLocalInput(waktuMulai),
        waktuSelesai: parseWitaLocalInput(waktuSelesai),
        createdById: session.adminId,
        pertanyaan: {
          create: pertanyaan.map((p, index) => ({ teks: p.teks, urutan: index })),
        },
      },
    });

    return NextResponse.json({ kegiatan }, { status: 201 });
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    throw err;
  }
}

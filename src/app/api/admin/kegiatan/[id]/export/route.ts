import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildKehadiranExcel } from "@/lib/export/kehadiran-excel";
import { buildKehadiranPdf } from "@/lib/export/kehadiran-pdf";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "xlsx";

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id },
    include: {
      kehadiran: { orderBy: { waktuKonfirmasi: "asc" }, include: { jawaban: true } },
      pertanyaan: { orderBy: { urutan: "asc" } },
    },
  });
  if (!kegiatan) return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });

  const info = {
    nama: kegiatan.nama,
    lokasi: kegiatan.lokasi,
    waktuMulai: kegiatan.waktuMulai,
    waktuSelesai: kegiatan.waktuSelesai,
  };
  const pertanyaan = kegiatan.pertanyaan.map((p) => ({ id: p.id, teks: p.teks }));
  const rows = kegiatan.kehadiran.map((k) => {
    const jawabanById = new Map(k.jawaban.map((j) => [j.pertanyaanId, j.jawaban]));
    return {
      tipePeserta: k.tipePeserta,
      nim: k.nim,
      nama: k.nama,
      programStudi: k.programStudi,
      waktuKonfirmasi: k.waktuKonfirmasi,
      jawaban: pertanyaan.map((p) => jawabanById.get(p.id) ?? ""),
    };
  });

  const safeName = kegiatan.nama.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60);

  if (format === "pdf") {
    const buffer = await buildKehadiranPdf(info, rows, pertanyaan);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="daftar-hadir-${safeName}.pdf"`,
      },
    });
  }

  const buffer = await buildKehadiranExcel(info, rows, pertanyaan);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="daftar-hadir-${safeName}.xlsx"`,
    },
  });
}

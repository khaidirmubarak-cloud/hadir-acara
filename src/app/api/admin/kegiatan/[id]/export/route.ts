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
    include: { kehadiran: { orderBy: { waktuKonfirmasi: "asc" } } },
  });
  if (!kegiatan) return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });

  const info = {
    nama: kegiatan.nama,
    lokasi: kegiatan.lokasi,
    waktuMulai: kegiatan.waktuMulai,
    waktuSelesai: kegiatan.waktuSelesai,
  };
  const rows = kegiatan.kehadiran.map((k) => ({
    nim: k.nim,
    nama: k.nama,
    programStudi: k.programStudi,
    waktuKonfirmasi: k.waktuKonfirmasi,
  }));

  const safeName = kegiatan.nama.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60);

  if (format === "pdf") {
    const buffer = await buildKehadiranPdf(info, rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="daftar-hadir-${safeName}.pdf"`,
      },
    });
  }

  const buffer = await buildKehadiranExcel(info, rows);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="daftar-hadir-${safeName}.xlsx"`,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const kegiatan = await prisma.kegiatan.findUnique({ where: { id }, select: { slug: true, nama: true } });
  if (!kegiatan) return NextResponse.json({ error: "Kegiatan tidak ditemukan" }, { status: 404 });

  const url = `${env.APP_URL}/k/${kegiatan.slug}`;
  const buffer = await generateQrPngBuffer(url);
  const safeName = kegiatan.nama.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${safeName}.png"`,
    },
  });
}

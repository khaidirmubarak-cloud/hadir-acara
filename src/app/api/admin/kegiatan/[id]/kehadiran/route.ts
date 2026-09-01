import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const kehadiran = await prisma.kehadiran.findMany({
    where: { kegiatanId: id },
    orderBy: { waktuKonfirmasi: "desc" },
  });

  return NextResponse.json({ kehadiran, total: kehadiran.length });
}

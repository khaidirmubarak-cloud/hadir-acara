import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatWita } from "@/lib/timezone";
import { computeKegiatanStatus } from "@/lib/kegiatan-status";
import AttendanceFlow from "./attendance-flow";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicKegiatanPage({ params }: Props) {
  const { slug } = await params;
  const kegiatan = await prisma.kegiatan.findUnique({ where: { slug } });
  if (!kegiatan) notFound();

  const status = computeKegiatanStatus(kegiatan);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Daftar Hadir Digital</p>
          <h1 className="mt-1 text-lg font-semibold text-gray-900">{kegiatan.nama}</h1>
          <p className="mt-1 text-sm text-gray-500">{kegiatan.lokasi}</p>
          <p className="text-xs text-gray-400">
            {formatWita(kegiatan.waktuMulai)} — {formatWita(kegiatan.waktuSelesai)}
          </p>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6">
          {status === "upcoming" && (
            <p className="text-center text-sm text-gray-600">
              Kegiatan ini belum dibuka. Silakan kembali saat waktu kegiatan dimulai.
            </p>
          )}
          {status === "closed" && (
            <p className="text-center text-sm text-gray-600">
              Kegiatan ini sudah selesai. Pengisian kehadiran telah ditutup.
            </p>
          )}
          {status === "open" && <AttendanceFlow slug={slug} />}
        </div>
      </div>
    </main>
  );
}

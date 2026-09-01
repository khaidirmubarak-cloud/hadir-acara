import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeKegiatanStatus } from "@/lib/kegiatan-status";
import { TicketHeader } from "../ticket-header";
import AttendanceFlow from "../attendance-flow";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicKegiatanPegawaiPage({ params }: Props) {
  const { slug } = await params;
  const kegiatan = await prisma.kegiatan.findUnique({ where: { slug } });
  if (!kegiatan) notFound();

  const status = computeKegiatanStatus(kegiatan);

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-green-50 to-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <TicketHeader
          nama={kegiatan.nama}
          lokasi={kegiatan.lokasi}
          waktuMulai={kegiatan.waktuMulai}
          waktuSelesai={kegiatan.waktuSelesai}
          label="Daftar Hadir Dosen/Tenaga Kependidikan"
        />

        <div className="rounded-b-3xl bg-white px-6 pt-7 pb-7 shadow-lg">
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
          {status === "open" && (
            <AttendanceFlow
              slug={slug}
              tipe="pegawai"
              belowAction={
                <Link
                  href={`/k/${slug}`}
                  className="mt-3 block w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Saya Mahasiswa
                </Link>
              }
            />
          )}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { formatWita } from "@/lib/timezone";
import { computeKegiatanStatus } from "@/lib/kegiatan-status";
import CopyLinkButton from "./copy-link-button";
import CloseEarlyButton from "./close-early-button";
import AttendanceTable from "./attendance-table";

type Props = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Akan Datang",
  open: "Berlangsung",
  closed: "Selesai",
};

export default async function KegiatanDetailPage({ params }: Props) {
  const { id } = await params;
  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id },
    include: {
      kehadiran: { orderBy: { waktuKonfirmasi: "desc" }, include: { jawaban: true } },
      pertanyaan: { orderBy: { urutan: "asc" } },
    },
  });
  if (!kegiatan) notFound();

  const status = computeKegiatanStatus(kegiatan);
  const publicUrl = `${env.APP_URL}/k/${kegiatan.slug}`;
  const rows = kegiatan.kehadiran.map((k) => ({
    id: k.id,
    tipePeserta: k.tipePeserta,
    nim: k.nim,
    nama: k.nama,
    programStudi: k.programStudi,
    waktuKonfirmasi: k.waktuKonfirmasi.toISOString(),
    jawaban: k.jawaban.map((j) => ({ pertanyaanId: j.pertanyaanId, jawaban: j.jawaban })),
  }));
  const pertanyaan = kegiatan.pertanyaan.map((p) => ({ id: p.id, teks: p.teks }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-gray-400">{STATUS_LABEL[status]}</p>
          <h1 className="text-xl font-semibold text-gray-900">{kegiatan.nama}</h1>
          <p className="mt-1 text-sm text-gray-500">{kegiatan.lokasi}</p>
          <p className="text-sm text-gray-500">
            {formatWita(kegiatan.waktuMulai)} — {formatWita(kegiatan.waktuSelesai)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/kegiatan/${kegiatan.id}/edit`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <CloseEarlyButton kegiatanId={kegiatan.id} ditutupManual={kegiatan.ditutupManual} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/admin/kegiatan/${kegiatan.id}/qr`}
            alt={`QR kegiatan ${kegiatan.nama}`}
            width={160}
            height={160}
            className="rounded-md"
          />
          <Link
            href={`/admin/kegiatan/${kegiatan.id}/qr`}
            className="mt-3 block text-center text-xs font-medium text-gray-700 hover:underline"
          >
            Buka halaman cetak
          </Link>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-gray-400">Link Publik</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-gray-50 px-2 py-1.5 text-xs text-gray-700">{publicUrl}</code>
            <CopyLinkButton url={publicUrl} />
          </div>

          <p className="mt-4 text-xs font-medium uppercase text-gray-400">Export Laporan</p>
          <div className="mt-2 flex gap-2">
            <a
              href={`/api/admin/kegiatan/${kegiatan.id}/export?format=xlsx`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Unduh Excel
            </a>
            <a
              href={`/api/admin/kegiatan/${kegiatan.id}/export?format=pdf`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Unduh PDF
            </a>
          </div>
        </div>
      </div>

      <AttendanceTable kegiatanId={kegiatan.id} initialRows={rows} pertanyaan={pertanyaan} />
    </div>
  );
}

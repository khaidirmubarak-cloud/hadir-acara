import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { formatWita } from "@/lib/timezone";
import { generateQrSvgString } from "@/lib/qr";
import PrintButton from "./print-button";

type Props = { params: Promise<{ id: string }> };

export default async function KegiatanQrPage({ params }: Props) {
  const { id } = await params;
  const kegiatan = await prisma.kegiatan.findUnique({ where: { id } });
  if (!kegiatan) notFound();

  const publicUrl = `${env.APP_URL}/k/${kegiatan.slug}`;
  const qrSvg = await generateQrSvgString(publicUrl);

  return (
    <div className="flex flex-col items-center px-4 py-10 print:mx-auto print:w-full print:py-0">
      <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-xl border border-gray-200 bg-white p-8 text-center print:mx-auto print:border-none print:p-0 print:shadow-none">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Daftar Hadir Digital</p>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">{kegiatan.nama}</h1>
        <p className="mt-1 text-sm text-gray-500">{kegiatan.lokasi}</p>
        <p className="text-sm text-gray-500">
          {formatWita(kegiatan.waktuMulai)} — {formatWita(kegiatan.waktuSelesai)}
        </p>

        <div
          className="mx-auto mt-6 w-64 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />

        <p className="mt-4 text-xs text-gray-500">Scan kode QR atau kunjungi:</p>
        <code className="mt-1 text-xs text-gray-700">{publicUrl}</code>
      </div>

      <div className="mt-6">
        <PrintButton />
      </div>
    </div>
  );
}

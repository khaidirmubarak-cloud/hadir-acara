import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { formatWita } from "@/lib/timezone";
import { generateQrSvgString } from "@/lib/qr";
import PrintButton from "./print-button";

type Props = { params: Promise<{ id: string }> };

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export default async function KegiatanQrPage({ params }: Props) {
  const { id } = await params;
  const kegiatan = await prisma.kegiatan.findUnique({ where: { id } });
  if (!kegiatan) notFound();

  const publicUrl = `${env.APP_URL}/k/${kegiatan.slug}`;
  const qrSvg = await generateQrSvgString(publicUrl);

  return (
    <div className="flex flex-col items-center bg-gradient-to-b from-green-50 to-gray-50 px-4 py-10 print:bg-none print:py-0 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
      <div className="w-full max-w-sm">
        <div className="rounded-t-3xl bg-gradient-to-br from-green-600 to-green-800 px-6 pt-7 pb-8 text-white shadow-lg print:shadow-none">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-green-100">
            Tiket Daftar Hadir Digital
          </p>
          <h1 className="mt-2 text-center text-xl font-bold leading-snug">{kegiatan.nama}</h1>

          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                <LocationIcon />
              </span>
              <span className="text-sm text-green-50">{kegiatan.lokasi}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                <ClockIcon />
              </span>
              <span className="text-sm text-green-50">
                {formatWita(kegiatan.waktuMulai)} — {formatWita(kegiatan.waktuSelesai)}
              </span>
            </div>
          </div>
        </div>

        <div className="relative h-0">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-gradient-to-b from-green-50 to-gray-50 print:bg-white" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-gradient-to-b from-green-50 to-gray-50 print:bg-white" />
        </div>
        <div className="mx-6 border-t-2 border-dashed border-gray-300" />

        <div className="rounded-b-3xl bg-white px-6 pt-7 pb-7 text-center shadow-lg print:shadow-none">
          <div
            className="mx-auto w-56 [&>svg]:mx-auto [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />

          <p className="mt-4 text-xs text-gray-500">Scan kode QR atau kunjungi:</p>
          <code className="mt-1 break-all text-xs text-gray-700">{publicUrl}</code>
        </div>
      </div>

      <div className="mt-6">
        <PrintButton />
      </div>
    </div>
  );
}

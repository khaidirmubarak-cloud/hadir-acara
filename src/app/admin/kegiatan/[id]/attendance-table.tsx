"use client";

import { useEffect, useState } from "react";

type KehadiranRow = {
  id: string;
  nim: string;
  nama: string;
  programStudi: string;
  waktuKonfirmasi: string;
};

const POLL_INTERVAL_MS = 12_000;

function formatWaktu(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Makassar",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function AttendanceTable({
  kegiatanId,
  initialRows,
}: {
  kegiatanId: string;
  initialRows: KehadiranRow[];
}) {
  const [rows, setRows] = useState<KehadiranRow[]>(initialRows);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/admin/kegiatan/${kegiatanId}/kehadiran`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setRows(data.kehadiran);
      } catch {
        // biarkan, coba lagi di interval berikutnya
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [kegiatanId]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Daftar Peserta Hadir</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {rows.length} peserta
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Belum ada peserta yang mengisi kehadiran.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">NIM</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Program Studi</th>
                <th className="px-4 py-2">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-gray-500">{r.nim}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{r.nama}</td>
                  <td className="px-4 py-2 text-gray-500">{r.programStudi}</td>
                  <td className="px-4 py-2 text-gray-500">{formatWaktu(r.waktuKonfirmasi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

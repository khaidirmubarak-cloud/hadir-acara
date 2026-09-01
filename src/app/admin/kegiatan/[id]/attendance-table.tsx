"use client";

import { useEffect, useState } from "react";

type JawabanRow = { pertanyaanId: string; jawaban: string };

type KehadiranRow = {
  id: string;
  nim: string;
  nama: string;
  programStudi: string;
  waktuKonfirmasi: string;
  jawaban: JawabanRow[];
};

type Pertanyaan = { id: string; teks: string };

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
  pertanyaan,
}: {
  kegiatanId: string;
  initialRows: KehadiranRow[];
  pertanyaan: Pertanyaan[];
}) {
  const [rows, setRows] = useState<KehadiranRow[]>(initialRows);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(row: KehadiranRow) {
    if (!confirm(`Hapus data kehadiran ${row.nama} (${row.nim})? Tindakan ini tidak bisa dibatalkan.`)) return;

    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/kegiatan/${kegiatanId}/kehadiran/${row.id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error ?? "Gagal menghapus data kehadiran");
      }
    } finally {
      setDeletingId(null);
    }
  }

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
                {pertanyaan.map((p) => (
                  <th key={p.id} className="px-4 py-2">
                    {p.teks}
                  </th>
                ))}
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-gray-500">{r.nim}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{r.nama}</td>
                  <td className="px-4 py-2 text-gray-500">{r.programStudi}</td>
                  <td className="px-4 py-2 text-gray-500">{formatWaktu(r.waktuKonfirmasi)}</td>
                  {pertanyaan.map((p) => (
                    <td key={p.id} className="max-w-xs px-4 py-2 text-gray-500">
                      {r.jawaban.find((j) => j.pertanyaanId === p.id)?.jawaban ?? "—"}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === r.id ? "Menghapus..." : "Hapus"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

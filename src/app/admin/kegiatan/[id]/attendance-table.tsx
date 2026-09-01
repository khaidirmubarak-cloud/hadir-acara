"use client";

import { useEffect, useMemo, useState } from "react";

type JawabanRow = { pertanyaanId: string; jawaban: string };

type KehadiranRow = {
  id: string;
  tipePeserta: "MAHASISWA" | "PEGAWAI";
  nim: string;
  nama: string;
  programStudi: string | null;
  waktuKonfirmasi: string;
  jawaban: JawabanRow[];
};

function TipeBadge({ tipe }: { tipe: KehadiranRow["tipePeserta"] }) {
  const isPegawai = tipe === "PEGAWAI";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        isPegawai ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
      }`}
    >
      {isPegawai ? "Dosen/Tendik" : "Mahasiswa"}
    </span>
  );
}

type Pertanyaan = { id: string; teks: string };

const POLL_INTERVAL_MS = 12_000;
const PAGE_SIZE = 20;

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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.nama.toLowerCase().includes(q) || r.nim.toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Daftar Peserta Hadir</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
          {rows.length} peserta
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">Belum ada peserta yang mengisi kehadiran.</p>
      ) : (
        <>
          <div className="mt-3">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari nama atau NIM/NIP..."
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none sm:w-64"
            />
          </div>

          {filteredRows.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Tidak ada peserta yang cocok dengan pencarian.</p>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Tipe</th>
                      <th className="px-4 py-2">NIM/NIP</th>
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
                    {pageRows.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2">
                          <TipeBadge tipe={r.tipePeserta} />
                        </td>
                        <td className="px-4 py-2 text-gray-500">{r.nim}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{r.nama}</td>
                        <td className="px-4 py-2 text-gray-500">{r.programStudi ?? "—"}</td>
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

              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Halaman {currentPage} dari {totalPages} ({filteredRows.length} hasil)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

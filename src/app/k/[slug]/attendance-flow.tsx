"use client";

import { useState } from "react";

type Props = {
  slug: string;
};

type LookupResult =
  | { alreadyRecorded: true; nama: string; waktuKonfirmasi: string }
  | { alreadyRecorded: false; nim: string; nama: string; programStudi: string };

export default function AttendanceFlow({ slug }: Props) {
  const [nim, setNim] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [success, setSuccess] = useState<{ nama: string; waktuKonfirmasi: string } | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/public/kegiatan/${slug}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memeriksa NIM");
        return;
      }
      setLookup(data);
    } catch {
      setError("Terjadi kesalahan jaringan, silakan coba lagi");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/public/kegiatan/${slug}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mencatat kehadiran");
        return;
      }
      setSuccess({ nama: data.nama, waktuKonfirmasi: data.waktuKonfirmasi });
    } catch {
      setError("Terjadi kesalahan jaringan, silakan coba lagi");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setNim("");
    setLookup(null);
    setSuccess(null);
    setError(null);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          ✓
        </div>
        <h2 className="mt-3 text-lg font-semibold text-gray-900">Kehadiran Tercatat</h2>
        <p className="mt-1 text-sm text-gray-600">
          Terima kasih, <span className="font-medium">{success.nama}</span>.
        </p>
        <p className="text-xs text-gray-400">{success.waktuKonfirmasi}</p>
      </div>
    );
  }

  if (lookup?.alreadyRecorded) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">Anda Sudah Tercatat Hadir</h2>
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-medium">{lookup.nama}</span> tercatat hadir pada {lookup.waktuKonfirmasi}.
        </p>
        <button onClick={reset} className="mt-4 text-sm text-gray-500 underline">
          Kembali
        </button>
      </div>
    );
  }

  if (lookup && !lookup.alreadyRecorded) {
    return (
      <div>
        <h2 className="text-center text-lg font-semibold text-gray-900">Konfirmasi Kehadiran</h2>
        <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">NIM</span>
            <span className="font-medium text-gray-900">{lookup.nim}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nama</span>
            <span className="font-medium text-gray-900">{lookup.nama}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Program Studi</span>
            <span className="font-medium text-gray-900">{lookup.programStudi}</span>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Konfirmasi Hadir"}
          </button>
          <button
            onClick={reset}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleLookup}>
      <label htmlFor="nim" className="block text-sm font-medium text-gray-700">
        NIM
      </label>
      <input
        id="nim"
        type="text"
        inputMode="numeric"
        required
        autoFocus
        value={nim}
        onChange={(e) => setNim(e.target.value)}
        placeholder="Masukkan NIM Anda"
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Memeriksa..." : "Lanjutkan"}
      </button>
    </form>
  );
}

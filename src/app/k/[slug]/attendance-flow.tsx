"use client";

import { useState } from "react";

type Props = {
  slug: string;
};

type Pertanyaan = { id: string; teks: string };

type LookupResult =
  | { alreadyRecorded: true; nama: string; waktuKonfirmasi: string }
  | { alreadyRecorded: false; nim: string; nama: string; programStudi: string; pertanyaan: Pertanyaan[] };

function CheckBadge() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-green-600">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </div>
  );
}

export default function AttendanceFlow({ slug }: Props) {
  const [nim, setNim] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
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

    if (lookup && !lookup.alreadyRecorded) {
      const belumDiisi = lookup.pertanyaan.some((p) => !jawaban[p.id]?.trim());
      if (belumDiisi) {
        setError("Semua pertanyaan kuisioner wajib diisi");
        return;
      }
    }

    setLoading(true);
    try {
      const jawabanPayload =
        lookup && !lookup.alreadyRecorded
          ? lookup.pertanyaan.map((p) => ({ pertanyaanId: p.id, jawaban: jawaban[p.id]?.trim() ?? "" }))
          : [];
      const res = await fetch(`/api/public/kegiatan/${slug}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim, jawaban: jawabanPayload }),
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
    setJawaban({});
    setSuccess(null);
    setError(null);
  }

  if (success) {
    return (
      <div className="text-center">
        <CheckBadge />
        <h2 className="mt-4 text-lg font-bold text-gray-900">Kehadiran Tercatat!</h2>
        <p className="mt-1 text-sm text-gray-600">
          Terima kasih, <span className="font-semibold">{success.nama}</span>.
        </p>
        <p className="mt-1 text-xs text-gray-400">{success.waktuKonfirmasi}</p>
      </div>
    );
  }

  if (lookup?.alreadyRecorded) {
    return (
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">Anda Sudah Tercatat Hadir</h2>
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-semibold">{lookup.nama}</span> tercatat hadir pada {lookup.waktuKonfirmasi}.
        </p>
        <button onClick={reset} className="mt-4 text-sm font-medium text-green-700 underline">
          Kembali
        </button>
      </div>
    );
  }

  if (lookup && !lookup.alreadyRecorded) {
    return (
      <div>
        <h2 className="text-center text-lg font-bold text-gray-900">Konfirmasi Kehadiran</h2>
        <div className="mt-4 space-y-2 rounded-xl bg-green-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">NIM</span>
            <span className="font-semibold text-gray-900">{lookup.nim}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nama</span>
            <span className="font-semibold text-gray-900">{lookup.nama}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Program Studi</span>
            <span className="font-semibold text-gray-900">{lookup.programStudi}</span>
          </div>
        </div>

        {lookup.pertanyaan.length > 0 && (
          <div className="mt-4 space-y-3">
            {lookup.pertanyaan.map((p) => (
              <div key={p.id}>
                <label htmlFor={`pertanyaan-${p.id}`} className="block text-sm font-medium text-gray-700">
                  {p.teks}
                </label>
                <textarea
                  id={`pertanyaan-${p.id}`}
                  required
                  rows={2}
                  value={jawaban[p.id] ?? ""}
                  onChange={(e) => setJawaban((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Konfirmasi Hadir"}
          </button>
          <button
            onClick={reset}
            disabled={loading}
            className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
        Nomor Induk Mahasiswa (NIM)
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
        className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-3 text-base focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? "Memeriksa..." : "Lanjutkan"}
      </button>
    </form>
  );
}

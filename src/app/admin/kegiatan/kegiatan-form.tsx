"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type KegiatanFormValues = {
  nama: string;
  deskripsi: string;
  lokasi: string;
  waktuMulai: string;
  waktuSelesai: string;
};

type Props = {
  mode: "create" | "edit";
  kegiatanId?: string;
  initialValues?: KegiatanFormValues;
};

const EMPTY: KegiatanFormValues = { nama: "", deskripsi: "", lokasi: "", waktuMulai: "", waktuSelesai: "" };

export default function KegiatanForm({ mode, kegiatanId, initialValues }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<KegiatanFormValues>(initialValues ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof KegiatanFormValues>(key: K, value: KegiatanFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = mode === "create" ? "/api/admin/kegiatan" : `/api/admin/kegiatan/${kegiatanId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan kegiatan");
        return;
      }

      const id = mode === "create" ? data.kegiatan.id : kegiatanId;
      router.push(`/admin/kegiatan/${id}`);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nama Kegiatan</label>
        <input
          required
          value={values.nama}
          onChange={(e) => update("nama", e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Deskripsi (opsional)</label>
        <textarea
          value={values.deskripsi}
          onChange={(e) => update("deskripsi", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Lokasi</label>
        <input
          required
          value={values.lokasi}
          onChange={(e) => update("lokasi", e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Waktu Mulai</label>
          <input
            required
            type="datetime-local"
            value={values.waktuMulai}
            onChange={(e) => update("waktuMulai", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Waktu Selesai</label>
          <input
            required
            type="datetime-local"
            value={values.waktuSelesai}
            onChange={(e) => update("waktuSelesai", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

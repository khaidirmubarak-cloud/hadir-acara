"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CloseEarlyButton({ kegiatanId, ditutupManual }: { kegiatanId: string; ditutupManual: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !ditutupManual;
    if (next && !confirm("Tutup kegiatan ini lebih awal? Peserta tidak akan bisa mengisi kehadiran lagi.")) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/kegiatan/${kegiatanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ditutupManual: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {ditutupManual ? "Buka Kembali" : "Tutup Lebih Awal"}
    </button>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatWita } from "@/lib/timezone";
import { computeKegiatanStatus } from "@/lib/kegiatan-status";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Akan Datang",
  open: "Berlangsung",
  closed: "Selesai",
};

const STATUS_CLASS: Record<string, string> = {
  upcoming: "bg-amber-100 text-amber-800",
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

export default async function AdminDashboardPage() {
  const kegiatanList = await prisma.kegiatan.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { kehadiran: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Daftar Kegiatan</h1>
        <Link
          href="/admin/kegiatan/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Kegiatan Baru
        </Link>
      </div>

      {kegiatanList.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">Belum ada kegiatan. Buat kegiatan pertama Anda.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama Kegiatan</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Hadir</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {kegiatanList.map((k) => {
                const status = computeKegiatanStatus(k);
                return (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{k.nama}</td>
                    <td className="px-4 py-3 text-gray-500">{formatWita(k.waktuMulai)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_CLASS[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{k._count.kehadiran}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/kegiatan/${k.id}`} className="text-sm font-medium text-gray-900 hover:underline">
                        Kelola
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

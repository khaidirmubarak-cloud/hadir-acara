import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { toWitaLocalInputValue } from "@/lib/timezone";
import KegiatanForm from "../../kegiatan-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditKegiatanPage({ params }: Props) {
  const { id } = await params;
  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id },
    include: { pertanyaan: { orderBy: { urutan: "asc" } } },
  });
  if (!kegiatan) notFound();

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Edit Kegiatan</h1>
      <KegiatanForm
        mode="edit"
        kegiatanId={kegiatan.id}
        initialValues={{
          nama: kegiatan.nama,
          deskripsi: kegiatan.deskripsi ?? "",
          lokasi: kegiatan.lokasi,
          waktuMulai: toWitaLocalInputValue(kegiatan.waktuMulai),
          waktuSelesai: toWitaLocalInputValue(kegiatan.waktuSelesai),
          pertanyaan: kegiatan.pertanyaan.map((p) => ({ id: p.id, teks: p.teks })),
        }}
      />
    </div>
  );
}

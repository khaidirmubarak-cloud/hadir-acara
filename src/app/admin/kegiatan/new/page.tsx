import KegiatanForm from "../kegiatan-form";

export default function NewKegiatanPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Kegiatan Baru</h1>
      <KegiatanForm mode="create" />
    </div>
  );
}

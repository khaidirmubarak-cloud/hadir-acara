import ExcelJS from "exceljs";
import { formatWita } from "@/lib/timezone";

export type ExportKehadiranRow = {
  nim: string;
  nama: string;
  programStudi: string;
  waktuKonfirmasi: Date;
  // Satu jawaban per pertanyaan, urutan mengikuti `pertanyaan` di bawah.
  jawaban: string[];
};

export type ExportKegiatanInfo = {
  nama: string;
  lokasi: string;
  waktuMulai: Date;
  waktuSelesai: Date;
};

export type ExportPertanyaan = {
  id: string;
  teks: string;
};

export async function buildKehadiranExcel(
  kegiatan: ExportKegiatanInfo,
  rows: ExportKehadiranRow[],
  pertanyaan: ExportPertanyaan[] = [],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Daftar Hadir");

  sheet.addRow(["UNIVERSITAS ISLAM NEGERI (UIN) PALOPO"]).font = { bold: true, size: 13 };
  sheet.addRow(["Laporan Daftar Hadir Kegiatan"]).font = { bold: true, size: 11 };
  sheet.addRow([]);
  sheet.addRow(["Kegiatan", kegiatan.nama]);
  sheet.addRow(["Lokasi", kegiatan.lokasi]);
  sheet.addRow(["Waktu", `${formatWita(kegiatan.waktuMulai)} — ${formatWita(kegiatan.waktuSelesai)}`]);
  sheet.addRow(["Jumlah Peserta", String(rows.length)]);
  sheet.addRow([]);

  const header = sheet.addRow([
    "No",
    "NIM",
    "Nama",
    "Program Studi",
    "Waktu Konfirmasi",
    ...pertanyaan.map((p) => p.teks),
  ]);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8E8E8" } };
  });

  rows.forEach((row, index) => {
    const r = sheet.addRow([
      index + 1,
      row.nim,
      row.nama,
      row.programStudi,
      formatWita(row.waktuKonfirmasi),
      ...row.jawaban,
    ]);
    r.eachCell((cell) => {
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
  });

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 32;
  sheet.getColumn(4).width = 32;
  sheet.getColumn(5).width = 22;
  pertanyaan.forEach((_, i) => {
    sheet.getColumn(6 + i).width = 36;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

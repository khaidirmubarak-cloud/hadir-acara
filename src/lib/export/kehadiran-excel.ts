import ExcelJS from "exceljs";
import { formatWita } from "@/lib/timezone";

export type ExportKehadiranRow = {
  nim: string;
  nama: string;
  programStudi: string;
  waktuKonfirmasi: Date;
};

export type ExportKegiatanInfo = {
  nama: string;
  lokasi: string;
  waktuMulai: Date;
  waktuSelesai: Date;
};

export async function buildKehadiranExcel(
  kegiatan: ExportKegiatanInfo,
  rows: ExportKehadiranRow[],
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

  const header = sheet.addRow(["No", "NIM", "Nama", "Program Studi", "Waktu Konfirmasi"]);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8E8E8" } };
  });

  rows.forEach((row, index) => {
    const r = sheet.addRow([index + 1, row.nim, row.nama, row.programStudi, formatWita(row.waktuKonfirmasi)]);
    r.eachCell((cell) => {
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
  });

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 32;
  sheet.getColumn(4).width = 32;
  sheet.getColumn(5).width = 22;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

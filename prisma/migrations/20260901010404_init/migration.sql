-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kegiatan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "lokasi" TEXT NOT NULL,
    "waktuMulai" TIMESTAMP(3) NOT NULL,
    "waktuSelesai" TIMESTAMP(3) NOT NULL,
    "ditutupManual" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kehadiran" (
    "id" TEXT NOT NULL,
    "kegiatanId" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "programStudi" TEXT NOT NULL,
    "programStudiSevimaId" TEXT,
    "waktuKonfirmasi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Kehadiran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Kegiatan_slug_key" ON "Kegiatan"("slug");

-- CreateIndex
CREATE INDEX "Kegiatan_waktuMulai_waktuSelesai_idx" ON "Kegiatan"("waktuMulai", "waktuSelesai");

-- CreateIndex
CREATE INDEX "Kehadiran_kegiatanId_idx" ON "Kehadiran"("kegiatanId");

-- CreateIndex
CREATE INDEX "Kehadiran_nim_idx" ON "Kehadiran"("nim");

-- CreateIndex
CREATE UNIQUE INDEX "Kehadiran_kegiatanId_nim_key" ON "Kehadiran"("kegiatanId", "nim");

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kehadiran" ADD CONSTRAINT "Kehadiran_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

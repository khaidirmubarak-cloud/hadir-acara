-- CreateTable
CREATE TABLE `Pertanyaan` (
    `id` VARCHAR(191) NOT NULL,
    `kegiatanId` VARCHAR(191) NOT NULL,
    `teks` VARCHAR(191) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Pertanyaan_kegiatanId_idx`(`kegiatanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JawabanKuisioner` (
    `id` VARCHAR(191) NOT NULL,
    `kehadiranId` VARCHAR(191) NOT NULL,
    `pertanyaanId` VARCHAR(191) NOT NULL,
    `jawaban` TEXT NOT NULL,

    INDEX `JawabanKuisioner_pertanyaanId_idx`(`pertanyaanId`),
    UNIQUE INDEX `JawabanKuisioner_kehadiranId_pertanyaanId_key`(`kehadiranId`, `pertanyaanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pertanyaan` ADD CONSTRAINT `Pertanyaan_kegiatanId_fkey` FOREIGN KEY (`kegiatanId`) REFERENCES `Kegiatan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JawabanKuisioner` ADD CONSTRAINT `JawabanKuisioner_kehadiranId_fkey` FOREIGN KEY (`kehadiranId`) REFERENCES `Kehadiran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JawabanKuisioner` ADD CONSTRAINT `JawabanKuisioner_pertanyaanId_fkey` FOREIGN KEY (`pertanyaanId`) REFERENCES `Pertanyaan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

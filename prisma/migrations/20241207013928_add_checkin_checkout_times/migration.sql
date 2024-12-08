-- AlterTable
ALTER TABLE `Attendance` ADD COLUMN `checkInTime` DATETIME(3) NULL,
    ADD COLUMN `checkOutTime` DATETIME(3) NULL;

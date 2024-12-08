/*
  Warnings:

  - You are about to alter the column `status` on the `Attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - You are about to drop the column `parentName` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `parentPhonenumber_1` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `parentPhonenumber_2` on the `Child` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `Child` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - Added the required column `parentId` to the `Child` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Attendance` MODIFY `status` ENUM('PRESENT', 'ABSENT') NOT NULL;

-- AlterTable
ALTER TABLE `Child` DROP COLUMN `parentName`,
    DROP COLUMN `parentPhonenumber_1`,
    DROP COLUMN `parentPhonenumber_2`,
    ADD COLUMN `parentId` VARCHAR(191) NOT NULL,
    MODIFY `status` ENUM('ABSENT', 'PRESENT', 'PICKUP_REQUESTED', 'PICKED_UP') NOT NULL DEFAULT 'ABSENT';

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'PARENT') NOT NULL DEFAULT 'PARENT',
    `phoneNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Attendance_childId_idx` ON `Attendance`(`childId`);

-- AddForeignKey
ALTER TABLE `Child` ADD CONSTRAINT `Child_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

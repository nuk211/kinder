/*
  Warnings:

  - Added the required column `childId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `childId` VARCHAR(191) NOT NULL,
    ADD COLUMN `parentId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Notification_childId_idx` ON `Notification`(`childId`);

-- CreateIndex
CREATE INDEX `Notification_parentId_idx` ON `Notification`(`parentId`);

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

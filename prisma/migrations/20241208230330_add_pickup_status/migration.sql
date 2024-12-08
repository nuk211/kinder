-- AlterTable
ALTER TABLE `Attendance` MODIFY `status` ENUM('PRESENT', 'ABSENT', 'PICKED_UP') NOT NULL;

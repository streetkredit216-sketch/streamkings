/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Photo` MODIFY `imageUrl` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `PhotoComment` MODIFY `content` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Playlist` MODIFY `coverImage` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Song` MODIFY `audioUrl` VARCHAR(191) NOT NULL,
    MODIFY `coverImage` VARCHAR(191) NULL,
    MODIFY `videoUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `email` VARCHAR(191) NOT NULL,
    MODIFY `profilePic` VARCHAR(191) NULL,
    MODIFY `profileBanner` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_email_key` ON `User`(`email`);

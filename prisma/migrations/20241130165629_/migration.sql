/*
  Warnings:

  - The primary key for the `Upvotes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `voteId` on the `Upvotes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Upvotes_UserId_SongId_key";

-- AlterTable
ALTER TABLE "Upvotes" DROP CONSTRAINT "Upvotes_pkey",
DROP COLUMN "voteId",
ADD CONSTRAINT "Upvotes_pkey" PRIMARY KEY ("UserId", "SongId");

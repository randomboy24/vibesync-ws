/*
  Warnings:

  - Added the required column `SpaceId` to the `Upvotes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Upvotes" ADD COLUMN     "SpaceId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Upvotes" ADD CONSTRAINT "Upvotes_SpaceId_fkey" FOREIGN KEY ("SpaceId") REFERENCES "Spaces"("spacesId") ON DELETE RESTRICT ON UPDATE CASCADE;

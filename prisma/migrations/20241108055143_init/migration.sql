-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Spaces" (
    "spacesId" TEXT NOT NULL,
    "name" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Spaces_pkey" PRIMARY KEY ("spacesId")
);

-- CreateTable
CREATE TABLE "Songs" (
    "songId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,

    CONSTRAINT "Songs_pkey" PRIMARY KEY ("songId")
);

-- CreateTable
CREATE TABLE "Upvotes" (
    "voteId" TEXT NOT NULL,
    "SongId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,

    CONSTRAINT "Upvotes_pkey" PRIMARY KEY ("voteId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Upvotes_UserId_SongId_key" ON "Upvotes"("UserId", "SongId");

-- AddForeignKey
ALTER TABLE "Spaces" ADD CONSTRAINT "Spaces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Songs" ADD CONSTRAINT "Songs_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Spaces"("spacesId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvotes" ADD CONSTRAINT "Upvotes_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upvotes" ADD CONSTRAINT "Upvotes_SongId_fkey" FOREIGN KEY ("SongId") REFERENCES "Songs"("songId") ON DELETE RESTRICT ON UPDATE CASCADE;

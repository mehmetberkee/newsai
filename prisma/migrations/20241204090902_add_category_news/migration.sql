/*
  Warnings:

  - Added the required column `category` to the `News` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "RelatedArticle_url_key";

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "originalTitle" TEXT;

-- AlterTable
ALTER TABLE "RelatedArticle" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "originalTitle" TEXT;

-- CreateTable
CREATE TABLE "CategoryNews" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "description" TEXT,
    "content" TEXT,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryNews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryNews_url_key" ON "CategoryNews"("url");

-- CreateIndex
CREATE INDEX "CategoryNews_category_idx" ON "CategoryNews"("category");

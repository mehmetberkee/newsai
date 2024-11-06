/*
  Warnings:

  - You are about to drop the column `category` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `fullContent` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `sentiment` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `News` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "News_category_idx";

-- DropIndex
DROP INDEX "News_publishedAt_idx";

-- DropIndex
DROP INDEX "News_title_idx";

-- DropIndex
DROP INDEX "News_title_key";

-- AlterTable
ALTER TABLE "News" DROP COLUMN "category",
DROP COLUMN "fullContent",
DROP COLUMN "sentiment",
DROP COLUMN "viewCount",
ADD COLUMN     "analysis" TEXT;

-- CreateTable
CREATE TABLE "RelatedArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "newsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelatedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RelatedArticle_url_key" ON "RelatedArticle"("url");

-- AddForeignKey
ALTER TABLE "RelatedArticle" ADD CONSTRAINT "RelatedArticle_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

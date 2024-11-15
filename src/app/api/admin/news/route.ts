import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [news, relatedArticles] = await Promise.all([
      prisma.news.findMany({
        include: {
          _count: {
            select: {
              comments: true,
              savedBy: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
      }),
      prisma.relatedArticle.findMany({
        include: {
          news: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
      }),
    ]);

    return NextResponse.json({
      news,
      relatedArticles,
    });
  } catch (error) {
    console.error("Error fetching admin news data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

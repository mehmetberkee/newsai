import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      orderBy: {
        publishedAt: "desc",
      },
      include: {
        _count: {
          select: {
            comments: true,
            savedBy: true,
          },
        },
      },
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

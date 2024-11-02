import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// OpenAI istemcisini başlat
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Özet oluşturma fonksiyonu
async function generateDetailedAnalysis(title: string, content: string) {
  try {
    const prompt = `Title: ${title}\n\nContent: ${content}\n\nPlease provide a comprehensive analysis of this news article in a professional journalistic style. Write a flowing narrative that thoroughly examines the story, its context, and implications. Focus on creating a cohesive, detailed report that reads like a well-written news analysis piece. Include relevant background information, key developments, and potential impacts, all woven together in clear, engaging paragraphs.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim();
  } catch (error) {
    console.error("Error generating analysis:", error);
    return null;
  }
}

async function fetchAndProcessNews(
  query: string,
  fromDate: string,
  toDate: string
) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&from=${fromDate}&to=${toDate}&sortBy=popularity&pageSize=5&apiKey=${
    process.env.NEWSAPI_KEY
  }`;

  const newsResponse = await axios.get(url);
  const articles = newsResponse.data.articles;

  return Promise.all(
    articles.map(async (article: any) => {
      try {
        const articleResponse = await axios.get(article.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
          maxRedirects: 5,
        });

        let fullContent = "";
        const contentType = articleResponse.headers["content-type"];

        if (contentType && contentType.includes("text/html")) {
          const dom = new JSDOM(articleResponse.data, { url: article.url });
          const reader = new Readability(dom.window.document);
          const parsedArticle = reader.parse();
          fullContent = parsedArticle ? parsedArticle.textContent : "";
        }

        // Özet oluştur
        const analysis = await generateDetailedAnalysis(
          article.title,
          fullContent || article.content || article.description
        );

        return {
          title: article.title,
          description: article.description,
          content: article.content,
          fullContent,
          analysis,
          url: article.url,
          imageUrl: article.urlToImage,
          publishedAt: new Date(article.publishedAt),
          source: article.source.name,
          category: query,
        };
      } catch (error) {
        console.error(`Error processing article: ${article.url}`, error);
        return null;
      }
    })
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "trending";

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fromDate = yesterday.toISOString().split("T")[0];
    const toDate = now.toISOString().split("T")[0];

    const cachedNews = await prisma.news.findMany({
      where: {
        category: query,
        publishedAt: {
          gte: yesterday,
          lte: now,
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    if (cachedNews.length > 5) {
      return NextResponse.json({ articles: cachedNews.slice(0, 5) });
    }

    const articles = await fetchAndProcessNews(query, fromDate, toDate);
    const validArticles = articles.filter((article) => article !== null);

    await prisma.$transaction(
      validArticles.map((article: any) =>
        prisma.news.upsert({
          where: { url: article.url },
          update: article,
          create: article,
        })
      )
    );

    return NextResponse.json({ articles: validArticles });
  } catch (error) {
    console.error("Error in news API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

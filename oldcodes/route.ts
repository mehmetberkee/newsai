import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "florida hurricane helene";
    const fromDate = searchParams.get("fromDate") || "2024-09-29";

    // Bugünün tarihini YYYY-MM-DD formatında al
    const today = new Date().toISOString().split("T")[0];
    const toDate = searchParams.get("toDate") || today;

    // Build the NewsAPI URL
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      query
    )}&from=${fromDate}&to=${toDate}&sortBy=popularity&apiKey=${
      process.env.NEWSAPI_KEY
    }`;

    // Fetch articles from NewsAPI
    const newsResponse = await axios.get(url);
    const articles = newsResponse.data.articles;

    // Initialize an array to hold full article content
    const fullArticles: Array<any> = [];

    // Fetch and parse each article
    await Promise.all(
      articles.map(async (article: any) => {
        try {
          // Fetch the article's HTML content with headers
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

          const contentType = articleResponse.headers["content-type"];
          if (contentType && contentType.includes("text/html")) {
            // Parse the HTML content
            const dom = new JSDOM(articleResponse.data, { url: article.url });
            const reader = new Readability(dom.window.document);
            const parsedArticle = reader.parse();

            // Add the full content to the article object
            fullArticles.push({
              ...article,
              fullContent: parsedArticle ? parsedArticle.textContent : "",
            });
          } else {
            console.error(`Skipped non-HTML content at ${article.url}`);
            // Optionally add the article without fullContent
            fullArticles.push(article);
          }
        } catch (error) {
          console.error(
            `Error fetching article at ${article.url}:`,
            (error as Error).message
          );
          // Optionally add the article without fullContent
          fullArticles.push(article);
        }
      })
    );

    return NextResponse.json({ articles: fullArticles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching articles:", (error as Error).message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

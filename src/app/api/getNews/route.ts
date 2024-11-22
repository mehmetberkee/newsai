import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import prisma from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CATEGORIES = [
  "US",
  "World",
  "Business",
  "Technology",
  "Science",
  "Health",
  "Sports",
  "Lifestyle",
  "Travel",
];

async function fetchAndProcessNews() {
  try {
    const preferredSources = [
      "bbc-news",
      "wall-street-journal",
      "forbes",
      "abc-news",
      "reuters",
      "associated-press",
      "cbs-news",
      "time",
      "espn",
      "cnn",
      "nbc-news",
      "the-new-york-times",
      "the-washington-post",
      "usa-today",
      "financial-times",
      "business-insider",
      "newsweek",
      "the-guardian",
      "the-economist",
      "bloomberg",
      "politico",
      "fox-news",
      "msnbc",
      "axios",
      "independent",
      "propublica",
    ].join(",");

    const topHeadlinesUrl = `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=${process.env.NEWSAPI_KEY}`;

    // Fallback to US news if no results from preferred sources
    const fallbackUrl = `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=${process.env.NEWSAPI_KEY}`;

    let headlinesResponse = await axios.get(topHeadlinesUrl);

    if (headlinesResponse.data.articles.length === 0) {
      headlinesResponse = await axios.get(fallbackUrl);
    }

    const getOneWeekAgo = () => {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      return date.toISOString().split("T")[0];
    };

    // Sadece general kategorisinden 5 haber al
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=general&pageSize=7&apiKey=${process.env.NEWSAPI_KEY}`;
    console.log("Fetching general news...");
    const response = await axios.get(url);

    const allArticles = response.data.articles
      .filter((article: any) => article.urlToImage)
      .map((article: any) => ({
        ...article,
      }))
      .slice(0, 5);

    // Debug log
    console.log(
      "Fetched articles with images:",
      allArticles.map((a: any) => ({
        title: a.title,
        hasImage: !!a.urlToImage,
      }))
    );

    const topArticles = await Promise.all(
      allArticles.map(async (article: any) => {
        const keywords = await extractKeywordsFromTitle(article.title);
        const relatedUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
          keywords
        )}&language=en&sources=${preferredSources}&excludeDomains=${
          article.source.name
        }&from=${getOneWeekAgo()}&sortBy=relevancy&pageSize=5&apiKey=${
          process.env.NEWSAPI_KEY
        }`;

        const relatedResponse = await axios.get(relatedUrl);
        return {
          ...article,
          relatedArticlesCount: relatedResponse.data.articles.length,
        };
      })
    );

    console.log(
      "Top articles categories:",
      topArticles.map((a) => a.category)
    );

    const selectedArticles = topArticles;

    const enrichedArticles = (
      await Promise.allSettled(
        selectedArticles.map(async (mainArticle: any) => {
          try {
            const keywords = await extractKeywordsFromTitle(mainArticle.title);
            console.log("keywords:", keywords);
            const relatedUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
              keywords
            )}&language=en&sources=${preferredSources}&excludeDomains=${
              mainArticle.source.name
            }&from=${getOneWeekAgo()}&sortBy=relevancy&pageSize=5&apiKey=${
              process.env.NEWSAPI_KEY
            }`;

            const relatedResponse = await axios.get(relatedUrl);
            const relatedArticles = relatedResponse.data.articles;

            const analysis = await generateComprehensiveAnalysis(
              mainArticle,
              relatedArticles
            );

            const improvedTitle = await generateImprovedTitle(mainArticle);

            return {
              mainArticle: {
                title: cleanTitle(improvedTitle),
                description: mainArticle.description,
                content: mainArticle.content,
                url: mainArticle.url || `${Date.now()}`,
                imageUrl: mainArticle.urlToImage,
                publishedAt: new Date(mainArticle.publishedAt),
                source: mainArticle.source.name,
                category: mainArticle.category,
                originalTitle: cleanTitle(mainArticle.title),
              },
              relatedArticles: await Promise.all(
                relatedArticles.map(async (article: any) => {
                  const fullContent = await scrapeArticleContent(article.url);
                  const improvedRelatedTitle = await generateImprovedTitle({
                    ...article,
                    content: fullContent,
                  });

                  return {
                    title: cleanTitle(improvedRelatedTitle),
                    source: article.source.name,
                    url: article.url || `${Date.now()}`,
                    publishedAt: new Date(article.publishedAt),
                    content: fullContent || article.content,
                    description: article.description,
                    imageUrl: article.urlToImage,
                    originalTitle: cleanTitle(article.title),
                  };
                })
              ),
              analysis,
            };
          } catch (error) {
            console.error(
              `Error processing article: ${mainArticle.title}`,
              error
            );
            return null;
          }
        })
      )
    )
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value)
      .slice(0, 5);

    return enrichedArticles;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
}

async function generateComprehensiveAnalysis(
  mainArticle: any,
  relatedArticles: any[]
) {
  try {
    const relatedArticlesWithContent = await Promise.all(
      relatedArticles.map(async (article) => ({
        ...article,
        fullContent: await scrapeArticleContent(article.url),
      }))
    );

    // Önce kategori belirle
    const categoryPrompt = `
    Given this news article information, categorize it into ONE of these categories: ${CATEGORIES.join(
      ", "
    )}

    Title: ${mainArticle.title}
    Description: ${mainArticle.description || ""}
    Content: ${mainArticle.content || ""}

    Return ONLY the category name, nothing else.`;

    const categoryResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: categoryPrompt }],
      temperature: 0.3,
      max_tokens: 10,
    });

    const category = categoryResponse.choices[0].message.content
      ?.trim()
      .split(" ")[0]
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace(/^US$/i, "US");

    // Sonra analiz yap
    const analysisPrompt = `
    Main Article Analysis Request:

    Title: ${mainArticle.title}
    Content: ${mainArticle.content || mainArticle.description}
    Category: ${category}

    Related Coverage:
    ${relatedArticlesWithContent
      .map(
        (article) => `
    - ${article.title} (${article.source})
      Content: ${article.fullContent || article.content || article.description}`
      )
      .join("\n")}

    Please provide a comprehensive news analysis addressing the following elements:

    1. Summary (2-3 paragraphs, max 20 sentences):
       - Who, What, When, Where, Why, and How with specific details
       - Include relevant numbers, proper nouns, and concrete examples
       - Historical context and background information

    2. Multiple Perspectives:
       - Present diverse viewpoints from different news sources
       - Highlight any contrasting opinions or interpretations
       - Include expert opinions when available

    3. Impact Analysis:
       - Immediate effects
       - Potential long-term consequences
       - Who is affected and how

    4. Supporting Context:
       - Related historical events
       - Previous developments
       - Relevant statistics or data

    Writing Guidelines:
    - Maintain warm, accessible language while adhering to journalistic standards
    - Ensure objectivity and neutrality
    - Avoid sensationalism and emotional manipulation
    - Use clear, concise language
    - Include verified information only
    - Acknowledge any limitations in available information
    - End with a constructive or forward-looking perspective`;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: analysisPrompt }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    // Duygu analizi yap
    const sentimentPrompt = `${analysisResponse.choices[0].message.content}`;
    const sentimentResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Given a news article, analyze its sentiment and provide a percentage breakdown with careful consideration of specific content markers:

          NEGATIVE markers (weight heavily):
          - Deaths, accidents, disasters
          - Violence, crime, conflict
          - Economic losses, bankruptcies
          - Environmental damage
          - Social problems, discrimination
          - Health crises, illnesses

          POSITIVE markers (weight heavily):
          - Achievements, successes, victories
          - Scientific/medical breakthroughs
          - Economic growth, job creation
          - Environmental improvements
          - Social progress, unity
          - Health improvements, recoveries
          - Aid, rescue, support actions

          NEUTRAL markers:
          - Factual statements
          - Statistical reports
          - Procedural updates
          - Policy announcements
          - General information

          Return ONLY a JSON object with three percentage values that sum to 100:
          {
            "positive": N,
            "neutral": N,
            "negative": N
          }`,
        },
        { role: "user", content: sentimentPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
      temperature: 0.3,
    });

    const sentimentAnalysis =
      JSON.parse(sentimentResponse.choices[0].message.content || "{}") || {};

    return {
      analysis: analysisResponse.choices[0].message.content?.trim(),
      sentiment: sentimentAnalysis,
      category: category, // Yeni kategori bilgisini ekle
    };
  } catch (error) {
    console.error("Error generating analysis:", error);
    return null;
  }
}

async function scrapeArticleContent(url: string) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const content = $('article, [class*="article"], [class*="content"]')
      .find("p")
      .map((_, el) => $(el).text())
      .get()
      .join("\n");

    return content;
  } catch (error) {
    console.error(`Error scraping content from ${url}:`, error);
    return null;
  }
}

async function extractKeywordsFromTitle(title: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Extract 2-3 most essential search terms from the news title that would yield the best search results. 
          Guidelines:
          - Focus on core topics, entities, or events
          - Remove unnecessary words (articles, conjunctions)
          - Keep proper nouns and specific terms
          - For numbers or statistics, keep only if crucial to the story
          - Avoid overly specific details that might limit search results
          
          Return only the keywords separated by spaces, no punctuation.
          
          Examples:
          Input: "U.S. Senate approves $95 billion aid package for Ukraine and Israel"
          Output: Ukraine Israel aid
          
          Input: "Tesla reports record quarterly earnings despite market challenges"
          Output: Tesla earnings record`,
        },
        {
          role: "user",
          content: title,
        },
      ],
      temperature: 0.3,
      max_tokens: 50,
    });

    const keywords =
      response.choices[0].message.content?.trim() ||
      title.split(" ").slice(0, 3).join(" ");

    console.log("Original title:", title);
    console.log("Extracted keywords:", keywords);

    return keywords;
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return title.split(" ").slice(0, 3).join(" ");
  }
}

function cleanTitle(title: string): string {
  const sourcesToRemove = [
    " - BBC News",
    " - Wall Street Journal",
    " - Forbes",
    " - ABC News",
    " - Reuters",
    " - Associated Press",
    " - CBS News",
    " - Time",
    " | ESPN",
    " | CNN",
    " | NBC News",
    " | The New York Times",
    " | The Washington Post",
    " | USA Today",
    " | Financial Times",
    " | Business Insider",
    " | Newsweek",
    " | The Guardian",
    " | The Economist",
    " | Bloomberg",
    " | Politico",
    " | Fox News",
    " | MSNBC",
    " | Axios",
    " | Independent",
    " | ProPublica",

    " | BBC News",
    " | Wall Street Journal",
    " | Forbes",
    " | ABC News",
    " | Reuters",
    " | Associated Press",
    " | CBS News",
    " | Time",
    " | ESPN",
    " | CNN",
    " | NBC News",
    " | The New York Times",
    " | The Washington Post",
    " | USA Today",
    " | Financial Times",
    " | Business Insider",
    " | Newsweek",
    " | The Guardian",
    " | The Economist",
    " | Bloomberg",
    " | Politico",
    " | Fox News",
    " | MSNBC",
    " | Axios",
    " | Independent",
    " | ProPublica",
  ];

  let cleanedTitle = title;
  sourcesToRemove.forEach((source) => {
    cleanedTitle = cleanedTitle.replace(source, "");
  });

  return cleanedTitle.trim();
}

async function generateImprovedTitle(article: any) {
  try {
    const prompt = `Given this news article information, create a clear, engaging, and informative title.

Original Title: ${article.title}
Description: ${article.description || "N/A"}
Content: ${article.content || "N/A"}
Category: ${article.category}

Guidelines:
- Keep it under 100 characters
- Be accurate and factual
- Include key information
- Avoid clickbait
- Maintain journalistic standards
- If it's breaking news, indicate that
- For numbers/statistics, use specific figures
- Include location if relevant
- Do not include quotation marks in the title

Return only the new title, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const title = response.choices[0].message.content?.trim() || article.title;
    return title.replace(/['"]+/g, "");
  } catch (error) {
    console.error("Error generating improved title:", error);
    return article.title;
  }
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function GET(request: NextRequest) {
  try {
    const cachedNews = await prisma.news.findMany({
      orderBy: {
        publishedAt: "desc",
      },
      take: 5,
      include: {
        relatedArticles: true,
      },
    });

    if (cachedNews.length > 0) {
      return NextResponse.json({ articles: cachedNews });
    }

    const enrichedArticles = await fetchAndProcessNews();

    const validArticles = enrichedArticles.filter((article: any) => {
      const isValidMain =
        article.mainArticle.title &&
        article.mainArticle.title !== "[Removed]" &&
        article.mainArticle.content !== "[Removed]";

      const validRelated = article.relatedArticles.filter(
        (related: any) =>
          related.title &&
          related.title !== "[Removed]" &&
          related.content !== "[Removed]"
      );

      article.relatedArticles = validRelated;
      return isValidMain;
    });

    const savedArticles = await Promise.all(
      validArticles.map(async (article: any) => {
        try {
          const existingArticles = await prisma.news.findMany({
            where: {
              url: article.mainArticle.url,
            },
            include: {
              relatedArticles: true,
            },
          });

          const existingArticle = existingArticles[0];

          if (existingArticle) {
            return await prisma.news.update({
              where: {
                id: existingArticle.id,
              },
              data: {
                title: article.mainArticle.title,
                description: article.mainArticle.description,
                content: article.mainArticle.content,
                imageUrl: article.mainArticle.imageUrl,
                publishedAt: article.mainArticle.publishedAt,
                source: article.mainArticle.source,
                analysis: article.analysis.analysis,
                category: article.analysis.category,
                sentiment: article.analysis.sentiment,
                relatedArticles: {
                  deleteMany: {},
                  create: article.relatedArticles.map((related: any) => ({
                    title: related.title,
                    source: related.source,
                    url: related.url,
                    publishedAt: related.publishedAt,
                    content: related.content,
                    description: related.description,
                    imageUrl: related.imageUrl || null,
                  })),
                },
              },
              include: {
                relatedArticles: true,
              },
            });
          } else {
            return await prisma.news.create({
              data: {
                title: article.mainArticle.title,
                description: article.mainArticle.description,
                content: article.mainArticle.content,
                url: article.mainArticle.url,
                imageUrl: article.mainArticle.imageUrl,
                category: article.analysis.category,
                publishedAt: article.mainArticle.publishedAt,
                source: article.mainArticle.source,
                analysis: article.analysis.analysis,
                sentiment: article.analysis.sentiment,
                relatedArticles: {
                  create: article.relatedArticles.map((related: any) => ({
                    title: related.title,
                    source: related.source,
                    url: related.url,
                    publishedAt: related.publishedAt,
                    content: related.content,
                    description: related.description,
                    imageUrl: related.imageUrl || null,
                  })),
                },
              },
              include: {
                relatedArticles: true,
              },
            });
          }
        } catch (error) {
          console.error(
            `Error saving article: ${article.mainArticle.url}`,
            error
          );
          return null;
        }
      })
    );

    const filteredSavedArticles = savedArticles.filter(
      (article) => article !== null
    );
    return NextResponse.json({ articles: filteredSavedArticles });
  } catch (error) {
    console.error("Error in news API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

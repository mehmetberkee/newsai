import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import prisma from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Önce veritabanından son 1 saat içinde eklenmiş haberleri kontrol et
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const cachedNews = await prisma.categoryNews.findMany({
      where: {
        category: category,
        createdAt: {
          gte: oneHourAgo,
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 5,
    });

    if (cachedNews.length >= 5) {
      return NextResponse.json({ articles: cachedNews });
    }

    // Yeni haberleri API'den çek
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=10&apiKey=${process.env.NEWSAPI_KEY}`;
    const response = await axios.get(url);

    const allArticles = response.data.articles
      .filter((article: any) => article.urlToImage)
      .map((article: any) => ({
        ...article,
        category: category,
      }));

    // AI Analizi için sıralama
    const rankingPrompt = `
    Please analyze these news articles and rank the top 5 most important ones based on:
    1. Global/national impact
    2. Timeliness
    3. Public interest
    4. Long-term significance
    
    Articles:
    ${allArticles
      .map(
        (article: any, index: number) => `
    ${index + 1}. Title: ${article.title}
       Description: ${article.description || "N/A"}
       Content: ${article.content || "N/A"}`
      )
      .join("\n")}

    Return only the numbers of the top 5 articles in order of importance, comma-separated (e.g., "3,1,7,4,2").`;

    const rankingResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: rankingPrompt }],
      temperature: 0.3,
      max_tokens: 50,
    });

    const topIndices = rankingResponse.choices[0].message.content
      ?.split(",")
      .map((num) => parseInt(num.trim()) - 1)
      .filter((index) => index >= 0 && index < allArticles.length)
      .slice(0, 5);

    const selectedArticles =
      topIndices?.map((index) => allArticles[index]) || allArticles.slice(0, 5);

    // Haberleri zenginleştir
    const enrichedArticles = await Promise.all(
      selectedArticles.map(async (article: any) => {
        try {
          const keywords = await extractKeywordsFromTitle(article.title);
          const relatedUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
            keywords
          )}&language=en&sources=${preferredSources}&excludeDomains=${
            article.source.name
          }&sortBy=relevancy&pageSize=5&apiKey=${process.env.NEWSAPI_KEY}`;

          const relatedResponse = await axios.get(relatedUrl);
          const relatedArticles = relatedResponse.data.articles;

          const analysis = await generateComprehensiveAnalysis(
            article,
            relatedArticles
          );

          const improvedTitle = await generateImprovedTitle(article);

          return {
            mainArticle: {
              title: cleanTitle(improvedTitle),
              description: article.description,
              content: article.content,
              url: article.url,
              imageUrl: article.urlToImage,
              publishedAt: new Date(article.publishedAt),
              source: article.source.name,
              category: category,
              originalTitle: cleanTitle(article.title),
            },
            relatedArticles: await Promise.all(
              relatedArticles.map(async (related: any) => {
                const fullContent = await scrapeArticleContent(related.url);
                const improvedRelatedTitle = await generateImprovedTitle({
                  ...related,
                  content: fullContent,
                });

                return {
                  title: cleanTitle(improvedRelatedTitle),
                  source: related.source.name,
                  url: related.url,
                  publishedAt: new Date(related.publishedAt),
                  content: fullContent || related.content,
                  description: related.description,
                  imageUrl: related.urlToImage,
                  originalTitle: cleanTitle(related.title),
                };
              })
            ),
            analysis,
          };
        } catch (error) {
          console.error(`Error processing article: ${article.title}`, error);
          return null;
        }
      })
    );

    const validArticles = enrichedArticles.filter(
      (article) => article !== null
    );

    // Veritabanına kaydet
    const savedArticles = await Promise.all(
      validArticles.map(async (article: any) => {
        try {
          const existingArticle = await prisma.categoryNews.findUnique({
            where: {
              url: article.mainArticle.url,
            },
          });

          if (existingArticle) {
            return await prisma.categoryNews.update({
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
                sentiment: article.analysis.sentiment,
                category: category,
                updatedAt: new Date(),
              },
            });
          } else {
            return await prisma.categoryNews.create({
              data: {
                title: article.mainArticle.title,
                description: article.mainArticle.description,
                content: article.mainArticle.content,
                url: article.mainArticle.url,
                imageUrl: article.mainArticle.imageUrl,
                publishedAt: article.mainArticle.publishedAt,
                source: article.mainArticle.source,
                analysis: article.analysis.analysis,
                sentiment: article.analysis.sentiment,
                category: category,
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
    console.error("Error in category news API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Yardımcı fonksiyonlar
async function extractKeywordsFromTitle(title: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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

    return keywords;
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return title.split(" ").slice(0, 3).join(" ");
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

    const categoryPrompt = `
    Given this news article information, categorize it into ONE of these categories: US, World, Business, Technology, Science, Health, Sports, Lifestyle

    Title: ${mainArticle.title}
    Description: ${mainArticle.description || ""}
    Content: ${mainArticle.content || ""}

    Return ONLY the category name, nothing else.`;

    const categoryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: categoryPrompt }],
      temperature: 0.3,
      max_tokens: 10,
    });

    const category = categoryResponse.choices[0].message.content
      ?.trim()
      .split(" ")[0]
      .replace(/^\w/, (c) => c.toUpperCase())
      .replace(/^US$/i, "US");

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
    - End with a constructive, positive, or forward-looking perspective if possible
    `;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: analysisPrompt }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const sentimentPrompt = `${analysisResponse.choices[0].message.content}`;
    const sentimentResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      category: category,
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
      model: "gpt-4o-mini",
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
  ];

  let cleanedTitle = title;
  sourcesToRemove.forEach((source) => {
    cleanedTitle = cleanedTitle.replace(source, "");
  });

  return cleanedTitle.trim();
}

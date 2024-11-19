import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import prisma from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// BBC'den başlıkları al ve diğer kaynaklardan ilgili haberleri getir
async function fetchAndProcessNews() {
  try {
    // Define preferred sources
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

    // 1. Get top headlines from preferred sources
    const topHeadlinesUrl = `https://newsapi.org/v2/top-headlines?sources=${preferredSources}&pageSize=10&apiKey=${process.env.NEWSAPI_KEY}`;

    // Fallback to US news if no results from preferred sources
    const fallbackUrl = `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=${process.env.NEWSAPI_KEY}`;

    let headlinesResponse = await axios.get(topHeadlinesUrl);

    // Use fallback if no articles found
    if (headlinesResponse.data.articles.length === 0) {
      headlinesResponse = await axios.get(fallbackUrl);
    }

    const topArticles = headlinesResponse.data.articles.slice(0, 5);

    // 2. Process each top headline
    const enrichedArticles = (
      await Promise.allSettled(
        topArticles.map(async (mainArticle: any) => {
          try {
            // AI ile anahtar kelimeleri çıkar
            const keywords = await extractKeywordsFromTitle(mainArticle.title);
            console.log("keywords:", keywords);
            const relatedUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
              keywords
            )}&language=en&sources=${preferredSources}&excludeDomains=${
              mainArticle.source.name
            }&sortBy=relevancy&pageSize=5&apiKey=${process.env.NEWSAPI_KEY}`;

            const relatedResponse = await axios.get(relatedUrl);
            const relatedArticles = relatedResponse.data.articles;

            // 3. ChatGPT ile kapsamlı bir analiz oluştur
            const analysis = await generateComprehensiveAnalysis(
              mainArticle,
              relatedArticles
            );

            return {
              mainArticle: {
                title: mainArticle.title,
                description: mainArticle.description,
                content: mainArticle.content,
                url: mainArticle.url,
                imageUrl: mainArticle.urlToImage,
                publishedAt: new Date(mainArticle.publishedAt),
                source: mainArticle.source.name,
              },
              relatedArticles: await Promise.all(
                relatedArticles.map(async (article: any) => {
                  const fullContent = await scrapeArticleContent(article.url);
                  return {
                    title: article.title,
                    source: article.source.name,
                    url: article.url,
                    publishedAt: new Date(article.publishedAt),
                    content: fullContent || article.content,
                    description: article.description,
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

// ChatGPT ile kapsamlı analiz oluştur
async function generateComprehensiveAnalysis(
  mainArticle: any,
  relatedArticles: any[]
) {
  try {
    const prompt = `
    Main Article Analysis Request:

Title: ${mainArticle.title}
Content: ${mainArticle.content || mainArticle.description}

Related Coverage:
${relatedArticles
  .map((article) => `- ${article.title} (${article.source})`)
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

5. Additional Resources:
   - Links to reputable sources for further reading
   - Fact-checking sources if applicable

Writing Guidelines:
- Maintain warm, accessible language while adhering to journalistic standards
- Ensure objectivity and neutrality
- Avoid sensationalism and emotional manipulation
- Use clear, concise language
- Include verified information only
- Acknowledge any limitations in available information
- End with a constructive or forward-looking perspective

Please write in a professional journalistic style that balances accessibility with authority, as if explaining to a well-informed friend.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    // Sentiment analizi için ikinci bir request yap
    const sentimentPrompt = `
    ${response.choices[0].message.content}`;

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
}

Guidelines:
- Death/tragedy content should heavily influence negative scoring (at least 60% negative)
- Major positive developments should score at least 50% positive
- Multiple deaths/injuries should increase negative percentage substantially
- Rescue/recovery efforts in negative situations should add some positive weight
- Pure informational content should weight toward neutral
- Consider both explicit and implicit sentiment indicators`,
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
      analysis: response.choices[0].message.content?.trim(),
      sentiment: sentimentAnalysis,
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

    // Her site için farklı HTML yapısı olacağından,
    // genellikle makale içeriği bulunan elementleri seçiyoruz
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

// Yeni fonksiyon ekleyelim
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

export async function GET(request: NextRequest) {
  try {
    // Son 5 haberi al
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

    // Yeni verileri getir
    const enrichedArticles = await fetchAndProcessNews();

    // Veritabanına kaydet
    const savedArticles = await Promise.all(
      enrichedArticles.map(async (article: any) => {
        try {
          // Önce bu URL'ye sahip bir kayıt var mı kontrol et
          const existingArticle = await prisma.news.findUnique({
            where: {
              url: article.mainArticle.url,
            },
            include: {
              relatedArticles: true,
            },
          });

          if (existingArticle) {
            // Kayıt varsa güncelle
            return await prisma.news.update({
              where: {
                url: article.mainArticle.url,
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
                relatedArticles: {
                  deleteMany: {},
                  create: article.relatedArticles.map((related: any) => ({
                    title: related.title,
                    source: related.source,
                    url: related.url,
                    publishedAt: related.publishedAt,
                    content: related.content,
                    description: related.description,
                  })),
                },
              },
              include: {
                relatedArticles: true,
              },
            });
          } else {
            // Kayıt yoksa yeni oluştur
            return await prisma.news.create({
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
                relatedArticles: {
                  create: article.relatedArticles.map((related: any) => ({
                    title: related.title,
                    source: related.source,
                    url: related.url,
                    publishedAt: related.publishedAt,
                    content: related.content,
                    description: related.description,
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
    ).then((articles) => articles.filter((article) => article !== null));

    return NextResponse.json({ articles: savedArticles });
  } catch (error) {
    console.error("Error in news API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

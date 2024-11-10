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
    // 1. BBC'den başlıkları al
    const bbcUrl = `https://newsapi.org/v2/top-headlines?sources=bbc-news&pageSize=5&apiKey=${process.env.NEWSAPI_KEY}`;
    const bbcResponse = await axios.get(bbcUrl);
    const bbcArticles = bbcResponse.data.articles;

    // 2. Her BBC haberi için diğer kaynakları tara
    const enrichedArticles = await Promise.all(
      bbcArticles.map(async (bbcArticle: any) => {
        // BBC başlığındaki anahtar kelimeleri kullanarak diğer kaynakları ara
        const keywords = bbcArticle.title.split(" ").slice(0, 3).join(" "); // İlk 3 kelimeyi al
        const relatedUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
          keywords
        )}&language=en&excludeDomains=bbc.co.uk&sortBy=relevancy&pageSize=3&apiKey=${
          process.env.NEWSAPI_KEY
        }`;

        const relatedResponse = await axios.get(relatedUrl);
        const relatedArticles = relatedResponse.data.articles;

        // 3. ChatGPT ile kapsamlı bir analiz oluştur
        const analysis = await generateComprehensiveAnalysis(
          bbcArticle,
          relatedArticles
        );

        return {
          mainArticle: {
            title: bbcArticle.title,
            description: bbcArticle.description,
            content: bbcArticle.content,
            url: bbcArticle.url,
            imageUrl: bbcArticle.urlToImage,
            publishedAt: new Date(bbcArticle.publishedAt),
            source: bbcArticle.source.name,
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
      })
    );

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
    console.log("response:");
    console.log(response.choices[0].message.content);

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
      console.log("cached:", cachedNews);
      return NextResponse.json({ articles: cachedNews });
    }

    // Yeni verileri getir
    const enrichedArticles = await fetchAndProcessNews();

    // Veritabanına kaydet
    const savedArticles = await Promise.all(
      enrichedArticles.map(async (article: any) => {
        const saved = await prisma.news.upsert({
          where: {
            url: article.mainArticle.url,
          },
          update: {
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
          create: {
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
        return saved;
      })
    );

    return NextResponse.json({ articles: savedArticles });
  } catch (error) {
    console.error("Error in news API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

"use client";
import React from "react";
import Image from "next/image";
import { useNews } from "@/hooks/useNews";
import { useCategoryNews } from "@/hooks/useCategoryNews";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams } from "next/navigation";

interface NewsDetailProps {
  title: string;
  category?: string;
}

function NewsDetail({ title }: NewsDetailProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const {
    news: regularNews,
    loading: regularLoading,
    error: regularError,
  } = useNews();

  const {
    news: categoryNews,
    loading: categoryLoading,
    error: categoryError,
  } = category
    ? useCategoryNews(category)
    : { news: [], loading: false, error: null };

  const news = category ? categoryNews : regularNews;
  const isLoading = category ? categoryLoading : regularLoading;
  const error = category ? categoryError : regularError;

  console.log("Debug Info:", {
    title,
    category,
    decodedTitle: decodeURIComponent(title),
  });

  console.log("Available News:", {
    regularNews,
    categoryNews,
    usingCategory: !!category,
    newsLength: news.length,
  });

  const newsItem = news.find((item) => {
    const normalizedItemTitle = item.title.toLowerCase().trim();
    const normalizedSearchTitle = decodeURIComponent(title)
      .toLowerCase()
      .trim();

    const cleanItemTitle = normalizedItemTitle.split(/\s+[-|]\s+/)[0].trim();
    const cleanSearchTitle = normalizedSearchTitle
      .split(/\s+[-|]\s+/)[0]
      .trim();

    console.log("Comparing titles:", {
      itemTitle: cleanItemTitle,
      searchTitle: cleanSearchTitle,
      matches: cleanItemTitle === cleanSearchTitle,
    });

    return cleanItemTitle === cleanSearchTitle;
  });

  const getSourceIcon = (source: string) => {
    const sourceIcons: { [key: string]: string } = {
      "ABC News": "/icons/abc.png",
      "BBC News": "/icons/bbcnews.png",
      "Business Insider": "/icons/businessinsider.png",
      "CBS News": "/icons/cbsnews.png",
      CNN: "/icons/cnn.png",
      ESPN: "/icons/espn.png",
      "Financial Times": "/icons/financialtimes.png",
      Fortune: "/icons/fortune.png",
      "Fox News": "/icons/foxnews.png",
      "NBC News": "/icons/nbcnews.png",
      Newsweek: "/icons/newsweek.png",
      "The New York Times": "/icons/newyorktimes.png",
      Time: "/icons/time.png",
      "USA Today": "/icons/usatoday.png",
      MSNBC: "/icons/MSNBC.png",
    };

    return sourceIcons[source] || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  if (!newsItem) return <div>News not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6 sm:py-12">
      <div className="w-full h-[250px] sm:h-[450px] relative rounded-xl overflow-hidden mb-4 sm:mb-8">
        <img
          src={newsItem.imageUrl || "/placeholder-image.jpg"}
          alt={newsItem.title}
          className="object-cover object-center w-full h-full"
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-20">
        {/* Sol Taraf - Ana İçerik */}
        <div className="space-y-4 w-full lg:w-1/2 mb-8 lg:mb-0">
          <h1 className="text-2xl sm:text-4xl font-bold">
            {newsItem.title.split(/\s+[-|]\s+/)[0]}
          </h1>
          <span className="text-lg sm:text-xl mt-4 text-purple-500 font-bold">
            {newsItem.category}
          </span>
          <p className="text-gray-700 text-base sm:text-lg">
            {newsItem.description}
          </p>
          <div className="prose prose-sm sm:prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {newsItem.analysis}
            </ReactMarkdown>
          </div>
        </div>

        {/* Sağ Taraf - Sentiment ve Reklam */}
        <div className="w-full lg:w-1/2 space-y-4">
          {/* Share/Save Buttons */}
          <div className="flex justify-end gap-2 mb-4">
            <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border border-gray-300 text-sm">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              Save
            </button>
            <button className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border border-gray-300 text-sm">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          </div>

          {/* Sentiment Box */}
          <div className="p-4 sm:p-6 bg-white rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h2 className="text-xl font-semibold">Sentiment</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              AI-powered sentiment analysis
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/positiveIcon.svg" alt="positive" />
                <span className="w-20">Positive</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-[#02542D] h-1 rounded-full"
                    style={{ width: `${newsItem.sentiment?.positive || 0}%` }}
                  ></div>
                </div>
                <span className="w-12 text-sm text-gray-600">
                  {newsItem.sentiment?.positive || 0}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img src="/neutralIcon.svg" alt="neutral" />
                <span className="w-20">Neutral</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-[#CEC8D4] h-1 rounded-full"
                    style={{ width: `${newsItem.sentiment?.neutral || 0}%` }}
                  ></div>
                </div>
                <span className="w-12 text-sm text-gray-600">
                  {newsItem.sentiment?.neutral || 0}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img src="/negativeIcon.svg" alt="negative" />
                <span className="w-20">Negative</span>
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-[#852221] h-1 rounded-full"
                    style={{ width: `${newsItem.sentiment?.negative || 0}%` }}
                  ></div>
                </div>
                <span className="w-12 text-sm text-gray-600">
                  {newsItem.sentiment?.negative || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Advertisement Box */}
          <div className="p-4 sm:p-6 bg-white rounded-lg shadow">
            <p className="text-xs text-gray-500 mb-4">ADVERTISEMENT</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src="/placeholder-furniture.jpg"
                alt="Advertisement"
                className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">
                  Discover our brand new line of designer furniture
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  From mid-century modern to lounge, find the right fit for your
                  home
                </p>
                <a
                  href="#"
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Visit Site
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sources Section */}
      <div className="w-full mt-8 sm:mt-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Sources</h2>
        <div className="stacked-cards-container space-y-4">
          {/* Main Article */}
          <a
            href={newsItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="stacked-card active"
          >
            <div className="flex flex-col sm:flex-row">
              <div className="w-full sm:w-[300px] aspect-[16/9] relative">
                <img
                  src={newsItem.imageUrl || "/placeholder-image.jpg"}
                  alt={newsItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 sm:p-4 flex-1">
                <h3 className="font-bold text-base sm:text-lg mb-2">
                  {newsItem.title.split(/\s+[-|]\s+/)[0]}
                </h3>
                <div className="flex items-center text-gray-500 text-xs sm:text-sm">
                  <span className="flex items-center">
                    {getSourceIcon(newsItem.source) && (
                      <Image
                        src={getSourceIcon(newsItem.source)!}
                        alt={`${newsItem.source} icon`}
                        width={16}
                        height={16}
                        className="inline-block mr-1"
                      />
                    )}
                    {newsItem.source}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {newsItem.publishedAt
                      ? new Date(newsItem.publishedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "7h ago"}
                  </span>
                </div>
              </div>
            </div>
          </a>

          {/* Related Articles */}
          {newsItem.relatedArticles
            ?.filter(
              (article) =>
                article.title?.toLowerCase() !== newsItem.title.toLowerCase() &&
                !article.title
                  ?.toLowerCase()
                  .startsWith(
                    newsItem.title.split(/\s+[-|]\s+/)[0].toLowerCase()
                  )
            )
            .map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="stacked-card"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-[300px] aspect-[16/9] relative">
                    <img
                      src={article.imageUrl || "/placeholder-image.jpg"}
                      alt={article.title || article.source}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 sm:p-4 flex-1">
                    <h3 className="font-bold text-base sm:text-lg mb-2">
                      {article.title || article.source}
                    </h3>
                    <div className="flex items-center text-gray-500 text-xs sm:text-sm">
                      <span className="flex items-center">
                        {getSourceIcon(article.source) && (
                          <Image
                            src={getSourceIcon(article.source)!}
                            alt={`${article.source} icon`}
                            width={16}
                            height={16}
                            className="inline-block mr-1"
                          />
                        )}
                        {article.source}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "7h ago"}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}

export default NewsDetail;

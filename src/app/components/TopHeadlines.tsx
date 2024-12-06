import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNews } from "@/hooks/useNews";
import Image from "next/image";

function TopHeadlines() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "home";
  const { news, loading, error } = useNews();
  const [categoryNews, setCategoryNews] = React.useState([]);
  const [loadingCategory, setLoadingCategory] = React.useState(false);

  // Kategori haberlerini çek
  React.useEffect(() => {
    const fetchCategoryNews = async () => {
      if (category === "home") {
        setCategoryNews([]);
        return;
      }

      setLoadingCategory(true);
      try {
        const response = await fetch(
          `/api/getCategoryNews?category=${category}`
        );
        const data = await response.json();
        setCategoryNews(data.articles);
      } catch (error) {
        console.error("Error fetching category news:", error);
      } finally {
        setLoadingCategory(false);
      }
    };

    fetchCategoryNews();
  }, [category]);

  // Gösterilecek haberleri belirle
  const displayNews = category === "home" ? news : categoryNews;

  const getCategoryPriority = (category: string) => {
    const priorities = {
      US: 0,
      World: 1,
      Business: 2,
      Technology: 3,
      Science: 4,
      Health: 5,
      Sports: 6,
      Lifestyle: 7,
    };
    const formattedCategory =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return priorities[formattedCategory as keyof typeof priorities] ?? 999;
  };

  const sortedNews = [...displayNews].sort(
    (a, b) => getCategoryPriority(a.category) - getCategoryPriority(b.category)
  );

  const loadingAnimation = function () {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-600">Loading the latest news...</p>
      </div>
    );
  };

  if (error)
    return <div className="text-red-500 text-center">Error: {error}</div>;

  const handleNewsClick = (newsItem: any) => {
    if (category === "home") {
      // Ana sayfa haberleri için kategori parametresi olmadan yönlendir
      router.push(`/news/${encodeURIComponent(newsItem.title)}`);
    } else {
      // Kategori haberleri için kategori parametresi ile yönlendir
      router.push(
        `/news/${encodeURIComponent(newsItem.title)}?category=${category}`
      );
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      US: "bg-blue-600",
      World: "bg-emerald-600",
      Business: "bg-purple-600",
      Technology: "bg-cyan-600",
      Science: "bg-indigo-600",
      Health: "bg-rose-600",
      Sports: "bg-orange-500",
      Lifestyle: "bg-amber-500",
    } as const;

    const formattedCategory =
      category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    return colors[formattedCategory as keyof typeof colors] || "bg-slate-500";
  };

  const getSourceIcon = (source: string) => {
    const sourceIcons: { [key: string]: string } = {
      "ABC News": "/icons/abc.png",
      "BBC News": "/icons/bbcnews.png",
      "Business Insider": "/icons/businessinsider.png",
      CNN: "/icons/cnn.png",
      ESPN: "/icons/espn.png",
      "Financial Times": "/icons/financialtimes.png",
      "Fox News": "/icons/foxnews.png",
      "NBC News": "/icons/nbcnews.png",
      Newsweek: "/icons/newsweek.png",
      "The New York Times": "/icons/newyorktimes.png",
      Time: "/icons/time.png",
      "USA Today": "/icons/usatoday.png",
    };

    return sourceIcons[source] || null;
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-12">
      <h1 className="text-3xl sm:text-5xl text-center mb-2">
        {category === "home" ? (
          <>
            Today is{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </>
        ) : (
          <>{category.charAt(0).toUpperCase() + category.slice(1)} News</>
        )}
      </h1>
      <h2 className="text-xl sm:text-2xl text-gray-600 text-center mb-6 sm:mb-12">
        {category === "home"
          ? "Breaking News Headlines"
          : `Latest ${category} Updates`}
      </h2>

      {loading || loadingCategory ? (
        loadingAnimation()
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {sortedNews.map((newsItem, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row gap-4 sm:gap-6 cursor-pointer hover:bg-gray-50 p-3 sm:p-4 rounded-lg transition-colors shadow-sm hover:shadow-md"
              onClick={() => handleNewsClick(newsItem)}
            >
              <div className="w-full md:w-1/2 h-[200px] sm:h-[350px] relative overflow-hidden">
                <img
                  src={newsItem.imageUrl || ""}
                  alt={newsItem.title}
                  className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl sm:text-[32px] tracking-[0%] leading-[120%] mb-2 hover:text-purple-600 transition-colors">
                  {newsItem.title.split(" - ")[0]}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <span
                    className={`
                    ${getCategoryColor(newsItem.category)}
                    text-white 
                    px-2 sm:px-3 
                    py-1 
                    rounded-full 
                    text-sm sm:text-md 
                    font-medium
                    tracking-wide
                  `}
                  >
                    {newsItem.category.charAt(0).toUpperCase() +
                      newsItem.category.slice(1).toLowerCase()}
                  </span>
                </div>
                <p className="text-[14px] sm:text-[16px] tracking-[0%] leading-[140%] text-[#1E1E1E] mt-4 sm:mt-7 mb-3 sm:mb-4">
                  {newsItem.description}
                </p>
                <p className="text-gray-500 text-xs sm:text-sm flex flex-wrap items-center gap-2">
                  Sources:{" "}
                  {Array.from(
                    new Set([
                      newsItem.source,
                      ...(newsItem.relatedArticles?.map(
                        (article) => article.source
                      ) || []),
                    ])
                  ).map((source, idx, arr) => (
                    <span key={source} className="flex items-center">
                      {getSourceIcon(source) && (
                        <Image
                          src={getSourceIcon(source)!}
                          alt={`${source} icon`}
                          width={16}
                          height={16}
                          className="inline-block mr-1"
                        />
                      )}
                      {source}
                      {idx < arr.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopHeadlines;

import React from "react";
import { useRouter } from "next/navigation";
import { useNews } from "@/hooks/useNews";
import Image from "next/image";

function TopHeadlines() {
  const router = useRouter();
  const { news, loading, error } = useNews();

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
    router.push(`/news/${encodeURIComponent(newsItem.title)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-5xl text-center mb-2">
        Today is{" "}
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </h1>
      <h2 className="text-2xl text-gray-600 text-center mb-12">
        Breaking News Headlines
      </h2>

      {loading ? (
        loadingAnimation()
      ) : (
        <div className="space-y-8">
          {news.map((newsItem, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row gap-6 cursor-pointer hover:bg-gray-50 p-4 rounded-lg transition-colors shadow-sm hover:shadow-md"
              onClick={() => handleNewsClick(newsItem)}
            >
              <div className="md:w-1/2 h-[350px] relative overflow-hidden">
                <img
                  src={newsItem.imageUrl || "/placeholder-image.jpg"}
                  alt={newsItem.title}
                  className="object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-[32px] tracking-[0%] leading-[120%] mb-2 hover:text-purple-600 transition-colors">
                  {newsItem.title}
                </h3>
                <span className="text-[20px] tracking-[0%] leading-[120%] text-purple-500 font-bold">
                  {newsItem.category}
                </span>
                <p className="text-[16px] tracking-[0%] leading-[140%] text-[#1E1E1E] mt-7 mb-4">
                  {newsItem.description}
                </p>
                <p className="text-gray-500 text-sm">
                  Source: {newsItem.source}
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

import { useQuery } from "@tanstack/react-query";

interface NewsItem {
  title: string;
  category: string;
  description: string;
  source: string;
  analysis: string;
  imageUrl?: string;
  sentiment: any;
  url: string;
  publishedAt: string;
  relatedArticles: {
    source: string;
    url: string;
  }[];
}

const fetchNews = async (query: string): Promise<NewsItem[]> => {
  const response = await fetch(`/api/getNews?query=${query}`);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error);

  return data.articles;
};

export function useNews(query: string = "latest news") {
  const {
    data: news,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["news", query],
    queryFn: () => fetchNews(query),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    select: (data) => data.slice(0, 5),
  });

  return {
    news: news ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

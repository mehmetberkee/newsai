import { useQuery } from "@tanstack/react-query";

interface CategoryNewsItem {
  title: string;
  category: string;
  description: string;
  source: string;
  analysis: string;
  imageUrl?: string;
  sentiment: any;
  url: string;
  publishedAt: string;
  relatedArticles?: {
    title: string;
    source: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    content?: string;
    description?: string;
  }[];
  content?: string;
}

const fetchCategoryNews = async (
  category: string
): Promise<CategoryNewsItem[]> => {
  const response = await fetch(`/api/getCategoryNews?category=${category}`);
  const data = await response.json();

  if (!response.ok) throw new Error(data.error);

  return data.articles;
};

export function useCategoryNews(category: string) {
  const {
    data: news,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categoryNews", category],
    queryFn: () => fetchCategoryNews(category),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  return {
    news: news ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

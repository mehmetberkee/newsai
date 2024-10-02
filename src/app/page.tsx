"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [input, setInput] = useState("");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Haberleri al
      const newsResponse = await fetch(
        `/api/getNews?query=${encodeURIComponent(input)}`
      );
      const newsData = await newsResponse.json();
      setArticles(newsData.articles);

      // AI analizi için haberleri hazırla
      const newsToAnalyze =
        newsData.articles.length > 10
          ? newsData.articles.slice(0, 10)
          : newsData.articles;

      const newsContent = newsToAnalyze
        .map(
          (article: any) =>
            `${article.title}\n${article.description}\n${
              article.fullContent || ""
            }`
        )
        .join("\n\n");

      // AI analizi yap
      const aiAnalysisResponse = await fetch("/api/aiAnalyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ news: newsContent, query: input }),
      });
      const aiData = await aiAnalysisResponse.json();
      setAiResponse(aiData.content);
    } catch (error) {
      console.error("Hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-6">News AI Assistant</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter news topic..."
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Query
        </button>
      </form>

      {loading && <p>Loading news and AI analysis...</p>}

      {aiResponse && (
        <div className="mb-8 bg-blue-100 p-6 rounded shadow-md">
          <h2 className="text-2xl font-bold mb-4">AI Analysis:</h2>
          <ReactMarkdown>{aiResponse}</ReactMarkdown>
        </div>
      )}

      {articles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">News:</h2>
          {articles.map((article: any, index: number) => (
            <div key={index} className="bg-gray-100 p-4 rounded">
              <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
              <p className="mb-2">{article.description}</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Haberi oku
              </a>
              {article.fullContent && (
                <details>
                  <summary className="cursor-pointer text-gray-600 mt-2">
                    Tam içerik
                  </summary>
                  <p className="mt-2">{article.fullContent}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

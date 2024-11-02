"use client";
import Categories from "@/app/components/Categories";
import Navbar from "@/app/components/Navbar";
import NewsDetail from "@/app/components/NewsDetail";

export default function NewsPage({ params }: { params: { title: string } }) {
  const decodedTitle = decodeURIComponent(params.title);
  return (
    <div>
      <Navbar />
      <Categories />
      <NewsDetail title={decodedTitle} />;
    </div>
  );
}

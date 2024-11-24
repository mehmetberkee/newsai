"use client";
import Categories from "@/app/components/Categories";
import Footer from "@/app/components/Footer";
import Navbar from "@/app/components/Navbar";
import NewsDetail from "@/app/components/NewsDetail";

export default function NewsPage({ params }: { params: { title: string } }) {
  const decodedTitle = decodeURIComponent(params.title);
  return (
    <div className="w-full sm:w-[1400px] mx-auto min-h-screen bg-white p-2 sm:p-8">
      <Navbar />
      <Categories />
      <NewsDetail title={decodedTitle} />
      <Footer />
    </div>
  );
}

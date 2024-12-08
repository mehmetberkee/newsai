//page.tsx
"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "./components/Navbar";
import Categories from "./components/Categories";
import Info from "./components/Info";
import TopHeadlines from "./components/TopHeadlines";
import Footer from "./components/Footer";

// Ana içerik komponenti
function HomeContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "home";

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-screen bg-white p-4 md:p-8">
      <Navbar />
      <Categories />
      {category === "home" && <Info />} <TopHeadlines />
      <Footer />
    </div>
  );
}

// Ana sayfa komponenti
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1400px] mx-auto min-h-screen bg-white p-4 md:p-8">
          <div>Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "./components/Navbar";
import Categories from "./components/Categories";
import Info from "./components/Info";
import TopHeadlines from "./components/TopHeadlines";
import Footer from "./components/Footer";

export default function Home() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "home";

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-screen bg-white p-4 md:p-8">
      <Navbar />
      <Categories />
      <Info />
      <TopHeadlines />
      <Footer />
    </div>
  );
}

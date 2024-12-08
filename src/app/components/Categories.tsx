"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Categories() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "home"
  );

  const categories = [
    { label: "Home", value: "home" },

    { label: "Business", value: "business" },
    { label: "Entertainment", value: "entertainment" },
    { label: "Health", value: "health" },
    { label: "Science", value: "science" },
    { label: "Sports", value: "sports" },
    { label: "Technology", value: "technology" },
  ];

  const handleCategoryChange = (value: string) => {
    setActiveCategory(value);
    router.push(`/?category=${value}`);
  };

  return (
    <nav className="w-full border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <ul className="flex space-x-4 sm:space-x-8 overflow-x-auto py-3 scrollbar-hide">
          {categories.map(({ label, value }) => (
            <li key={value} className="flex-shrink-0">
              <button
                onClick={() => handleCategoryChange(value)}
                className={`px-2 sm:px-3 py-1 rounded-md font-medium transition-colors text-sm sm:text-base whitespace-nowrap
                  ${
                    activeCategory === value
                      ? "bg-[#F5F5F5] text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Categories;

import React, { useState } from "react";

function Categories() {
  const [activeCategory, setActiveCategory] = useState("Top News");

  const categories = [
    "Top News",
    "US",
    "World",
    "Business",
    "Technology",
    "Science",
    "Health",
    "Sports",
    "Lifestyle",
    "Travel",
    "More",
  ];

  return (
    <nav className="w-full border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <ul className="flex space-x-4 sm:space-x-8 overflow-x-auto py-3 scrollbar-hide">
          {categories.map((category) => (
            <li key={category} className="flex-shrink-0">
              <button
                onClick={() => setActiveCategory(category)}
                className={`px-2 sm:px-3 py-1 rounded-md font-medium transition-colors text-sm sm:text-base whitespace-nowrap
                  ${
                    activeCategory === category
                      ? "bg-[#F5F5F5] text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                {category}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Categories;

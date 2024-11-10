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
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex space-x-8 overflow-x-auto py-3">
          {categories.map((category) => (
            <li key={category}>
              <button
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 rounded-md font-medium transition-colors
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

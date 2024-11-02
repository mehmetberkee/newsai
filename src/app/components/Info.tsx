import React from "react";

function Info() {
  const infoCards = [
    {
      title: "Discover what matters",
      description:
        "We read thousands of articles daily and deliver concise summaries so you can catch up on what's happening faster.",
      image: "/newspaper.webp",
    },
    {
      title: "Your questions answered from facts",
      description:
        "Search our extensive library of articles written by reputable publishers and get to the truth.",
      image: "/glass.webp",
    },
    {
      title: "Better AI analysis",
      description:
        "Gain rapid insights with our smart summaries, story sentiment, and consensus views.",
      image: "/ai.webp",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {infoCards.map((card, index) => (
          <div
            key={index}
            className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="bg-gray-100 w-full h-48 rounded-md mb-6 overflow-hidden">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
            <p className="text-gray-600 leading-relaxed">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Info;

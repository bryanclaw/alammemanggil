"use client";

import { useState } from "react";
import { destinations } from "@/app/data/destinations";
import DestinationCard from "../destination/DestinationCard";

const categories = ["All", "Mountain", "Camping", "Trekking", "Caving"];

export default function DestinationGrid() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredDestinations =
    selectedCategory === "All"
      ? destinations
      : destinations.filter(
          (item) => item.category === selectedCategory
        );

  return (
    <>
      {/* Category Buttons */}
      <div className="flex justify-center gap-4 mb-10 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full px-8 py-3 font-semibold transition ${
              selectedCategory === category
                ? "bg-[#7B5538] text-white"
                : "bg-white text-gray-700 hover:bg-[#7B5538] hover:text-white"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDestinations.map((destination) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
          />
        ))}
      </div>
    </>
  );
}
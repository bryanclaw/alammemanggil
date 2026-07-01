"use client";

import { useState } from "react";
import { destinations } from "@/app/data/destinations";
import DestinationCard from "@/components/destination/DestinationCard";

const categories = ["All", "Mountain", "Camping", "Trekking", "Caving"];

export default function DestinationGrid() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered =
    selectedCategory === "All"
      ? destinations
      : destinations.filter(
          (item) => item.category === selectedCategory
        );

  return (
    <section className="bg-[#F8F5F2] py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Filter */}
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-6 py-3 font-medium transition ${
                selectedCategory === category
                  ? "bg-[#7B5538] text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-[#7B5538] hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((destination) => (
            <DestinationCard
              key={destination.id}
              {...destination}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
import StatCard from "../../ui/StatCard";

const stats = [
  {
    value: "1K+",
    label: "Happy Adventurers",
    image: "/images/TESTIMONIICON.jpg",
  },
  {
    value: "4.5★",
    label: "Customer Rating",
    image: "/images/TESTIMONIICON.jpg",
  },
  {
    value: "100%",
    label: "Safety Commitment",
    image: "/images/TESTIMONIICON.jpg",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-white py-10 sm:py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6">
        <div className="mb-6 sm:mb-12">
          <p className="text-[11px] sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#7B5538]">
            Why Choose Us
          </p>

          <h2 className="mt-1.5 sm:mt-3 text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Why Choose The Outdoors
          </h2>

          <p className="mt-2 sm:mt-4 max-w-2xl text-xs sm:text-base text-gray-600 leading-relaxed">
            We create safe, exciting, and unforgettable outdoor
            experiences with professional guides and carefully
            curated destinations across Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 [&_h2]:text-base [&_h2]:sm:text-3xl [&_p]:text-[9px] [&_p]:sm:text-sm [&_p]:leading-tight"
            >
              <StatCard
                value={stat.value}
                label={stat.label}
                image={stat.image}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
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
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7B5538]">
            Why Choose Us
          </p>

          <h2 className="mt-3 text-4xl font-bold text-gray-900">
            Why Choose The Outdoors
          </h2>

          <p className="mt-4 max-w-2xl text-gray-600">
            We create safe, exciting, and unforgettable outdoor
            experiences with professional guides and carefully
            curated destinations across Indonesia.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              image={stat.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
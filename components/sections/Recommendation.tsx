import Link from "next/link";
import DestinationCard from "../ui/DestinationCard";
import { destinations } from "@/app/data/destinations";

export default function Recommendation() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] font-semibold text-[#7B5538]">
              Explore
            </p>

            <h2 className="mt-2 text-4xl font-bold">
              Recommended Destinations
            </h2>
          </div>

          <Link
            href="/destination"
            className="hidden rounded-full border border-[#7B5538] px-6 py-3 text-[#7B5538] transition hover:bg-[#7B5538] hover:text-white md:block"
          >
            View All
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              {...destination}
            />
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <Link
            href="/destination"
            className="rounded-full bg-[#7B5538] px-6 py-3 text-white"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}
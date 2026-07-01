import Image from "next/image";

export default function DestinationHero() {
  return (
    <section className="relative h-[50vh] overflow-hidden">
      <Image
        src="/images/hero/destination-banner.jpg"
        alt="Destinations"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/50" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-3 text-sm uppercase tracking-[0.3em]">
            Explore Indonesia
          </p>

          <h1 className="text-5xl font-bold md:text-6xl">
            Our Destinations
          </h1>

          <p className="mt-4 text-lg text-gray-200">
            Discover mountains, forests, beaches, and unforgettable adventures.
          </p>
        </div>
      </div>
    </section>
  );
}
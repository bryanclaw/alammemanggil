    import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/hero.jpg')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-6">
        <div className="max-w-2xl text-white">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-amber-200">
            Explore Indonesia
          </p>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-7xl">
            Nature Calls,
            <br />
            We Listen.
          </h1>

          <p className="mb-8 max-w-xl text-lg text-gray-200">
            Experience unforgettable adventures through mountains, forests,
            caves, and outdoor activities with professional guides.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/destination"
              className="rounded-full bg-[#7B5538] px-8 py-4 font-semibold text-white transition hover:bg-[#65442d]"
            >
              Explore Destinations
            </Link>

            <Link
              href="/information"
              className="rounded-full border border-white px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-white">
          <div className="mt-2 h-2 w-2 animate-bounce rounded-full bg-white" />
        </div>
      </div>
    </section>
  );
}
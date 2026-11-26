import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-[68vh] sm:h-[70vh] min-h-[430px] sm:min-h-[460px] overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/HomePoster1.png')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/35" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 py-8">
        <div className="max-w-2xl text-white">
          <p className="mb-2.5 sm:mb-3 text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/90">
            Explore Indonesia
          </p>

          <h1 className="mb-4 sm:mb-6 text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.08] md:leading-tight">
            Nature Calls
            <br />
            We Listen!
          </h1>

          <p className="mb-6 sm:mb-8 max-w-xl text-sm sm:text-lg leading-relaxed text-gray-200">
            Experience unforgettable adventures through mountains, forests,
            caves, and outdoor activities with professional guides.
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              href="/destination"
              className="rounded-full bg-[#6F4E37] px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-white transition hover:bg-[#65442d] shadow-xl"
            >
              Explore Destinations
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
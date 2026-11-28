import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-[46vh] sm:h-[70vh] min-h-[310px] sm:min-h-[460px] overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/HomePoster1.png')",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/45 sm:bg-black/35" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-2xl text-white">
          <p className="mb-1.5 sm:mb-3 text-[10px] sm:text-sm uppercase tracking-[0.16em] sm:tracking-[0.3em] text-white/90 font-medium">
            Explore Indonesia
          </p>

          <h1 className="mb-2 sm:mb-6 text-2xl sm:text-5xl md:text-7xl font-extrabold leading-[1.08] md:leading-tight">
            Nature Calls
            <br />
            We Listen!
          </h1>

          <p className="mb-3.5 sm:mb-8 max-w-xl text-[11px] sm:text-lg leading-snug sm:leading-relaxed text-gray-200 line-clamp-2 sm:line-clamp-none">
            Experience unforgettable adventures through mountains, forests,
            caves, and outdoor activities with professional guides.
          </p>

          <div className="flex flex-wrap gap-2.5 sm:gap-4">
            <Link
              href="/destination"
              className="rounded-full bg-[#6F4E37] px-4 py-2 sm:px-8 sm:py-4 text-xs sm:text-base font-semibold text-white transition hover:bg-[#65442d] shadow-xl active:scale-95"
            >
              Explore Destinations
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
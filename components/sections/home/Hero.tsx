    import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-[70vh] min-h-[100px] overflow-hidden">
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
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-6">
        <div className="max-w-2xl text-white">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white-200 ">
            Explore Indonesia
          </p>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-7xl">
            Nature Calls
            <br />
            We Listen!
          </h1>

          <p className="mb-8 max-w-xl text-lg text-gray-200">
            Experience unforgettable adventures through mountains, forests,
            caves, and outdoor activities with professional guides.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/destination"
              className="rounded-full bg-[#6F4E37] px-8 py-4 font-semibold text-white transition hover:bg-[#65442d] shadow-xl"
            >
              Explore Destinations
            </Link>

            
          </div>
        </div>
      </div>
    </section>
  );
}
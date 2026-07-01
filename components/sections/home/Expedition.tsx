import Image from "next/image";

export default function Expedition() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.3em] font-semibold text-[#7B5538]">
            Explore Indonesia
          </p>

          <h2 className="mt-3 text-4xl md:text-5xl font-bold">
            38 Provinces
            <br />
            38 Mountains
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-gray-600 leading-8">
            Our expeditions span Indonesia from west to east,
            bringing unforgettable adventures across mountains,
            forests, caves, and natural landscapes.
          </p>
        </div>

        <div className="relative mx-auto mt-16 h-[420px] max-w-5xl">
          <Image
            src="/images/indonesia-map.png"
            alt="Indonesia Map"
            fill
            className="object-contain"
          />
        </div>

      </div>
    </section>
  );
}
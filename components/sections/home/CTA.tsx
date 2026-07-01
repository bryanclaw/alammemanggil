import Image from "next/image";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="relative py-24">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/cta-bg.jpg"
          alt="Mountain"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="rounded-3xl bg-white/10 p-10 text-center backdrop-blur-md border border-white/20">

          <div className="flex justify-center">
            <Image
              src="/images/logo.png"
              alt="Alam Memanggil"
              width={110}
              height={110}
            />
          </div>

          <h2 className="mt-6 text-4xl font-bold text-white">
            Jawab Panggilan, Taklukkan Alam!
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-200">
            Bersama Alam Memanggil, nikmati pengalaman mendaki,
            camping, trekking, dan outbound yang aman, nyaman,
            dan penuh cerita. Mari jelajahi keindahan alam Indonesia
            bersama pemandu yang berpengalaman.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/destination"
              className="rounded-full bg-[#7B5538] px-8 py-4 font-semibold text-white transition hover:bg-[#5C4033]"
            >
              Explore Destinations
            </Link>

            <Link
              href="https://wa.me/6281238316963"
              target="_blank"
              className="rounded-full border border-white px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Contact Us
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
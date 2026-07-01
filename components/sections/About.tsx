import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <section className="bg-[#F6F4F1] py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
        {/* Left Image */}
        <div className="relative h-[500px] overflow-hidden rounded-3xl shadow-xl">
          <Image
            src="/images/about.jpg"
            alt="Outdoor Adventure"
            fill
            className="object-cover"
          />
        </div>

        {/* Right Content */}
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#7B5538]">
            About Us
          </p>

          <h2 className="mb-6 text-5xl font-bold leading-tight text-gray-900">
            Alam adalah
            <br />
            <span className="text-[#7B5538]">Panggung,</span>
            <br />
            Kami adalah
            <br />
            <span className="text-[#7B5538]">Pemandunya.</span>
          </h2>

          <p className="mb-5 text-lg leading-8 text-gray-600">
            Alam Memanggil menghadirkan pengalaman petualangan yang aman,
            menyenangkan, dan berkesan. Kami percaya bahwa setiap perjalanan
            bukan hanya tentang mencapai tujuan, tetapi juga menikmati proses,
            belajar dari alam, dan menciptakan cerita yang tak terlupakan.
          </p>

          <p className="mb-8 text-lg leading-8 text-gray-600">
            Bersama pemandu profesional, kami mengajak Anda menjelajahi gunung,
            hutan, gua, hingga berbagai destinasi alam Indonesia dengan tetap
            mengutamakan keselamatan dan kelestarian lingkungan.
          </p>

          <Link
            href="/information"
            className="inline-flex rounded-full bg-[#7B5538] px-8 py-4 font-semibold text-white transition hover:bg-[#5d412b]"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
}
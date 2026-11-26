"use client";

import Image from "next/image";

export default function AboutUs() {
  return (
    <section className="w-full py-10 sm:py-16 bg-neutral-50 antialiased select-none border-t border-neutral-200/40 overflow-x-clip">
      <div className="mx-auto max-w-[1350px] px-4 sm:px-6">
        {/* Tata Letak Split Grid Presisi Tinggi */}
        <div className="grid items-stretch gap-4 sm:gap-6 lg:grid-cols-[420px_1fr]">
          {/* KARTU KIRI: Cerita Singkat Berbentuk Frosted Glass Box */}
          <div className="flex flex-col justify-between p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] bg-black/6 border border-black/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.01)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)]">
            <div className="space-y-3 sm:space-y-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-[#6F4E37]/10 flex items-center justify-center border border-[#6F4E37]/5 shrink-0">
                <span className="text-base sm:text-lg">🏔️</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                Membangun Komunitas <br className="hidden sm:inline" />
                Pendaki Sejak Berdiri
              </h3>
              <p className="text-xs font-medium text-neutral-600 sm:text-neutral-500 leading-relaxed">
                Kami bukan sekadar penyedia jasa open trip. Kami adalah wadah
                bagi para pencinta alam untuk pulang, berbagi cerita, dan
                melangkah bersama menuju keindahan dengan aman dan penuh
                edukasi.
              </p>
            </div>

            <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-neutral-200/60 sm:border-neutral-100" />
          </div>

          {/* KARTU KANAN: Visual Poster dengan Masking Kristal */}
          <div className="relative h-[260px] sm:h-[380px] lg:h-auto overflow-hidden rounded-[24px] sm:rounded-[32px] group bg-neutral-100">
            {/* Smooth Zoom Image Canvas */}
            <div className="absolute inset-0 h-full w-full transition-transform duration-[1.5s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-[1.02]">
              <Image
                src="/images/about_us.png"
                alt="Poster Alam Memanggil"
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Apple Style Floating Glass Tag */}
            <div className="absolute right-3 top-3 sm:right-6 sm:top-6 rounded-xl sm:rounded-2xl bg-white/75 backdrop-blur-xl border border-white/50 px-3 py-1.5 sm:px-4 sm:py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] z-10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex -space-x-2">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-neutral-300 border-2 border-white" />
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-neutral-400 border-2 border-white" />
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-neutral-500 border-2 border-white" />
                </div>
                <span className="text-[10px] font-bold text-neutral-800 tracking-wide whitespace-nowrap">
                  +1,000 Summiters Joined
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
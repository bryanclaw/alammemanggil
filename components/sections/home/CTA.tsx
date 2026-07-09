"use client";

import Image from "next/image";
import Link from "next/link";

export default function AboutUs() {
  return (
    <section className="w-full py-16 bg-neutral-50 antialiased select-none border-t border-neutral-200/40">
      <div className="mx-auto max-w-[1350px] px-6">
        
        {/* Tata Letak Split Grid Presisi Tinggi */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[420px_1fr]">
          
          {/* KARTU KIRI: Cerita Singkat Berbentuk Frosted Glass Box */}
          <div className="flex flex-col justify-between p-8 rounded-[32px] bg-black/6 border border-black/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.01)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)]">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-2xl bg-[#6F4E37]/10 flex items-center justify-center border border-[#6F4E37]/5">
                <span className="text-lg">🏔️</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                Membangun Komunitas <br />Pendaki Sejak Berdiri
              </h3>
              <p className="text-xs font-medium text-neutral-500 leading-relaxed">
                Kami bukan sekadar penyedia jasa open trip. Kami adalah wadah bagi para pencinta alam untuk pulang, berbagi cerita, dan melangkah bersama menuju keindahan dengan aman dan penuh edukasi.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100">
            </div>
          </div>

          {/* KARTU KANAN: Visual Poster dengan Masking Kristal */}
          <div className="relative h-[380px] lg:h-auto overflow-hidden rounded-[32px] group bg-neutral-100">
            
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
            <div className="absolute right-6 top-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.02)] z-10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="h-6 w-6 rounded-full bg-neutral-300 border-2 border-white" />
                  <div className="h-6 w-6 rounded-full bg-neutral-400 border-2 border-white" />
                  <div className="h-6 w-6 rounded-full bg-neutral-500 border-2 border-white" />
                </div>
                <span className="text-[10px] font-bold text-neutral-800 tracking-wide">
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
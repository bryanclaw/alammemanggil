"use client";

import Image from "next/image";
import Link from "next/link";

export default function Expedition() {
  return (
    <section className="w-full py-8 bg-neutral-50 antialiased select-none">
      <div className="mx-auto max-w-[1350px] px-6">
        
        {/* Container Utama dengan Tinggi yang Dioptimalkan (Compact Apple Banner) */}
        <div className="relative h-[320px] md:h-[400px] w-full overflow-hidden rounded-[32px] border border-black/[0.01] shadow-[0_20px_50px_rgba(0,0,0,0.04)] group bg-neutral-900">
          
          {/* Zooming Poster Background */}
          <div className="absolute inset-0 h-full w-full transition-transform duration-[1.4s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-[1.03]">
            <Image
              src="/images/PosterHome3.jpeg"
              alt="Poster Alam Memanggil"
              fill
              priority
              className="object-cover object-center"
            />
          </div>
          
          {/* Lapisan Gradasi Ambient Tiruan Lensa Kamera */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-700 group-hover:opacity-90" />
          
          {/* Konten Teks & Aksi Terstruktur */}
          <div className="absolute inset-x-8 bottom-8 md:inset-x-10 md:bottom-8 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            {/* Bagian Kiri: Tipografi Premium (Ukuran Disesuaikan Proporsional) */}
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex rounded-full bg-white/10 backdrop-blur-md px-3 py-0.5 border border-white/20">
                <span className="text-[9px] font-bold tracking-[0.2em] text-white/90">
                  EXCLUSIVE EXPEDITION
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-[1.2] drop-shadow-sm">
                Alam Memanggil. <br />
                <span className="font-light text-neutral-300">Temukan Batas Kemampuan Dirimu.</span>
              </h2>
              <p className="text-xs font-medium text-neutral-400 max-w-md leading-relaxed">
                Jelajahi keindahan puncak tertinggi Indonesia melalui manajemen perjalanan profesional berstandar internasional.
              </p>
            </div>

            {/* Bagian Kanan: Tombol Kapsul Apple Style (Dipertahankan 100%) */}
            <div className="flex items-center shrink-0">
              <Link
                href="/destination "
                className="inline-flex items-center gap-4 rounded-full bg-white px-7 py-3.5 text-xs font-bold text-neutral-900 shadow-sm transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) hover:bg-neutral-100 hover:shadow-md active:scale-95 cursor-pointer group/btn"
              >
                <span>Mulai Petualangan</span>
                <svg 
                  width="20" 
                  height="10" 
                  viewBox="0 0 24 12" 
                  fill="none" 
                  className="transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) group-hover/btn:translate-x-1.5"
                >
                  <path d="M0 6H22M22 6L17 1M22 6L17 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
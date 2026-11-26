"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Data 4 konten slider
const destinations = [
  { id: 1, title: "Puncak Tertinggi", src: "/images/CARTENZ.jpeg" },
  { id: 2, title: "Gunung Terindah", src: "/images/RINJANI2.jpg" },
  { id: 3, title: "Medan Terekstrim", src: "/images/RAUNG.webp" },
  { id: 4, title: "Jalur Terpanjang", src: "/images/LEUSER.jpg" },
];

export default function DestinationSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Efek slider berjalan otomatis
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % destinations.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Lebar 250px + gap 12px di HP; lebar 300px + gap 16px di desktop
  const cardWidth = isMobile ? 250 : 300;
  const gapSize = isMobile ? 12 : 16;
  const stepPx = cardWidth + gapSize;

  return (
    <section className="relative w-full min-h-[540px] md:h-[450px] overflow-hidden flex items-center justify-center px-3.5 sm:px-4 py-6 md:py-0 antialiased">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/BROMO.jpg"
          alt="Adventure Background"
          fill
          priority
          className="object-cover brightness-[0.7] scale-105 transition-all duration-1000"
        />
      </div>

      {/* Container Utama Glassmorphism Premium */}
      <div className="relative z-10 w-full max-w-5xl h-auto md:h-[340px] bg-white/20 backdrop-blur-2xl rounded-[28px] md:rounded-[32px] border border-white/30 p-5 sm:p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-[0_32px_64px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* SISI KIRI: Teks Informasi Gaya Apple (Bold & Clean) */}
        <div className="w-full md:w-[40%] flex flex-col justify-center text-left z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-white font-black tracking-tight leading-[1.12] mb-2.5 md:mb-3">
            Buka Petualanganmu <br />
            <span className="text-white drop-shadow-sm font-extrabold">
              Bersama Kami!
            </span>
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm text-neutral-900 uppercase tracking-wider md:tracking-widest font-bold">
            kami hadir untuk membawa anda <br className="hidden sm:inline" /> ke
            destinasi impian
          </p>

          {/* Tambahan Apple Style Page Indicators */}
          <div className="mt-4 md:mt-8 flex gap-1.5">
            {destinations.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${
                  activeIndex === idx
                    ? "w-6 bg-neutral-900"
                    : "w-1.5 bg-neutral-900/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* SISI KANAN: Slider dengan iOS Fluid Motion */}
        <div className="w-full md:w-[60%] h-[195px] sm:h-[210px] md:h-full relative flex items-center overflow-hidden">
          <div
            className="flex gap-3 md:gap-4 h-[185px] sm:h-[200px] md:h-[220px]"
            style={{
              transform: `translateX(-${activeIndex * stepPx}px)`,
              transition: "transform 800ms cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {destinations.map((item, index) => {
              const isActive = activeIndex === index;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  style={{ width: `${cardWidth}px` }}
                  className={`h-full rounded-[20px] md:rounded-[24px] overflow-hidden relative border border-white/20 flex-shrink-0 cursor-pointer group shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-700 ease-out ${
                    isActive
                      ? "scale-100 opacity-100 shadow-xl"
                      : "scale-[0.94] md:scale-[0.93] opacity-55 hover:opacity-80"
                  }`}
                >
                  {/* Image Konten Slider */}
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 250px, 300px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Label Teks Transparan di bawah Image */}
                  <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 w-[88%] bg-white/40 backdrop-blur-xl py-2 md:py-2.5 px-3 rounded-[16px] md:rounded-[18px] text-center border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 group-hover:bg-white/60">
                    <span className="text-xs font-bold text-neutral-900 tracking-wide truncate block whitespace-nowrap">
                      {item.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Data 4 konten slider 
const destinations = [
  { id: 1, title: "Outbound Sekolah", src: "/images/sekolah2.jpeg" },
  { id: 2, title: "Gathering Kantor", src: "/images/flyingfox3.jpg" },
  { id: 3, title: "Event Komunitas", src: "/images/rapeling2.png" },
];

export default function DestinationSlider() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Efek slider berjalan otomatis (Diubah ke 3000ms agar user sempat menikmati konten)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % destinations.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-[450px] overflow-hidden flex items-center justify-center px-4 antialiased">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/flyingfox5.jpeg" 
          alt="Adventure Background"
          fill
          priority
          className="object-cover brightness-[0.7] scale-105 transition-all duration-1000"
        />
      </div>

      {/* Container Utama Glassmorphism Premium */}
      <div className="relative z-10 w-full max-w-5xl h-[340px] bg-white/20 backdrop-blur-2xl rounded-[32px] border border-white/30 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-[0_32px_64px_rgba(0,0,0,0.15)] overflow-hidden">
        
        {/* SISI KIRI: Teks Informasi Gaya Apple (Bold & Clean) */}
        <div className="w-full md:w-[40%] flex flex-col justify-center text-left z-10 font">
          <h2 className="text-3xl md:text-4xl text-white font-black tracking-tight text-neutral-900 leading-[1.1] mb-3">
            Seru Tanpa Ragu,<br />
            <span className="text-white drop-shadow-sm font-extrabold">Aman Nomor Satu!</span>
          </h2>
          <p className="text-xs md:text-sm text-black text-neutral-800 uppercase tracking-widest font-bold ">
            kami hadir untuk melayani jasa pemasangan flying fox dan rappeling <br />
          </p>
          
          {/* Tambahan Apple Style Page Indicators */}
          <div className="mt-8 flex gap-1.5">
            {destinations.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  activeIndex === idx ? "w-6 bg-neutral-900" : "w-1.5 bg-neutral-900/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* SISI KANAN: Slider dengan iOS Fluid Motion */}
        <div className="w-full md:w-[60%] h-full relative flex items-center overflow-hidden">
          <div 
            className="flex gap-4 h-[220px]"
            style={{ 
              transform: `translateX(-${activeIndex * 316}px)`, // Lebar 300px + gap 16px (gap-4) secara presisi
              transition: "transform 800ms cubic-bezier(0.25, 1, 0.5, 1)" // iOS fluid animation curve
            }} 
          >
            {destinations.map((item, index) => {
              const isActive = activeIndex === index;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveIndex(index)}
                  className={`w-[300px] h-full rounded-[24px] overflow-hidden relative border border-white/20 flex-shrink-0 cursor-pointer group shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-700 ease-out ${
                    isActive ? "scale-100 opacity-100 shadow-xl" : "scale-[0.93] opacity-50 hover:opacity-80"
                  }`}
                >
                  {/* Image Konten Slider */}
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="300px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Label Teks Transparan di bawah Image */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[88%] bg-white/40 backdrop-blur-xl py-2.5 px-3 rounded-[18px] text-center border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 group-hover:bg-white/60">
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
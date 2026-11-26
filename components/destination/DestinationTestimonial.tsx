"use client";

import { useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";

const testimonials = [
  {
    id: 1,
    name: "Rizky Pratama",
    role: "Mahasiswa",
    image: "/images/testi1.png",
    avatar: "/images/usericon.png",
    text: "Pendakian dengan Alam Memanggil sangat terorganisir! Guide ramah, makanan enak, dan pemandangan puncaknya luar biasa. Pasti ikut trip lagi!",
  },
  {
    id: 2,
    name: "Amanda Putri",
    role: "Karyawan",
    image: "/images/testi2.png",
    avatar: "/images/usericon.png",
    text: "Open trip terbaik yang pernah saya ikuti. Semua peserta terasa seperti keluarga baru. Recommended banget untuk pendaki pemula maupun yang sudah berpengalaman.",
  },
  {
    id: 3,
    name: "Fajar Nugraha",
    role: "Fotografer",
    image: "/images/testi3.png",
    avatar: "/images/usericon.png",
    text: "View gunungnya luar biasa and itinerary sangat rapi. Tim Alam Memanggil benar-benar profesional dari awal sampai selesai perjalanan.",
  },
];

export default function Testimonial() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      className="relative overflow-hidden bg-cover bg-center py-6 sm:py-8 flex flex-col items-center justify-center antialiased w-full"
      style={{
        backgroundImage: "url('/images/BROMO2.jpeg')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Main Container - Tinggi Dioptimalkan Agar Presisi Di Layar */}
      <div className="relative z-10 w-full max-w-3xl min-h-[340px] sm:h-[260px] px-3.5 sm:px-4 flex items-center justify-center mx-auto">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop
          speed={1000}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            setActiveIndex(swiper.realIndex);
          }}
          className="h-full w-full"
        >
          {testimonials.map((item) => (
            <SwiperSlide key={item.id} className="!h-auto sm:!h-full">
              {/* Card Container */}
              <div className="mx-auto min-h-[330px] sm:h-[240px] w-full rounded-[24px] sm:rounded-[28px] border border-white/30 bg-white/45 backdrop-blur-2xl overflow-hidden">
                {/* Grid Komposisi - Stack di HP, 2 Kolom di SM+ */}
                <div className="grid h-full grid-cols-1 sm:grid-cols-[1.4fr_220px] gap-2.5 sm:gap-3 p-3 sm:p-3.5 items-center">
                  {/* SISI KIRI: Teks & Profil */}
                  <div className="flex h-full flex-col justify-between p-1.5 sm:p-2 text-left">
                    <div>
                      {/* Quote Mark Besar Gaya Apple */}
                      <div className="text-4xl sm:text-6xl font-serif leading-none text-black select-none mb-0.5">
                        “
                      </div>

                      {/* Teks Testimoni */}
                      <p className="text-xs sm:text-[13px] md:text-[14px] font-medium leading-relaxed text-neutral-950 tracking-tight sm:line-clamp-4">
                        {item.text}
                      </p>
                    </div>

                    {/* Profil User */}
                    <div className="flex items-center gap-2.5 sm:gap-3 mt-3 sm:mt-auto pt-1.5 sm:pt-2">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 border-white/80 bg-white/20 object-cover shadow-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-xs sm:text-sm font-bold text-neutral-950 tracking-tight">
                          {item.name}
                        </h3>
                        <p className="truncate text-[10px] sm:text-[11px] font-semibold text-neutral-700">
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SISI KANAN: Gambar Besar Bento Style */}
                  <div className="relative h-36 sm:h-full w-full overflow-hidden rounded-[18px] sm:rounded-[20px] shadow-sm border border-white/20">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-[1200ms] scale-100"
                    />
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Apple Style Premium Pill Indicators */}
      <div className="relative z-10 mt-4 flex justify-center">
        <div className="flex items-center p-1 sm:p-1.5 bg-black/20 backdrop-blur-xl rounded-full gap-1.5 border border-white/10 shadow-lg">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => swiperRef.current?.slideToLoop(index)}
              className={`h-5 sm:h-6 rounded-full transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1) cursor-pointer ${
                activeIndex === index
                  ? "w-10 sm:w-16 bg-white shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
                  : "w-5 sm:w-8 bg-white/40 hover:bg-white/70 hover:scale-110 active:scale-95"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
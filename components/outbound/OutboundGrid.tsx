"use client";

import { useEffect, useMemo, useState } from "react";

const categories = ["All", "Flying Fox", "Rapeling", "Flying Fox & Rapeling"];

const trips = [
  {
    id: 1,
    category: "Flying Fox",
    image: "/images/flyingfox.jpg",
    title: "Flying Fox",
    location: "Lintasan Double Tali Kernmantel",
    schedule: "Jasa Pemasangan",
    duration: "Peralatan Safety",
    meetup: "Operator & Rescue Team",
    facility: "P3K Standart & Dokumentasi",
    price: "Rp. 2.000.000",
    status: "Pesan",
  },
  {
    id: 2,
    category: "Rapeling",
    image: "/images/rapeling7.jpeg",
    title: "Rapeling",
    location: "Lintasan Double Tali Kernmantel",
    schedule: "Jasa Pemasangan",
    duration: "Peralatan Safety",
    meetup: "Operator & Rescue Team",
    facility: "P3K Standart & Dokumentasi",
    price: "Rp. 1.500.000",
    status: "Pesan",
  },
  {
    id: 3,
    category: "Flying Fox & Rapeling",
    image: "/images/flyingfox&rapeling2.webp",
    title: "Flying Fox & Rapeling",
    location: "Lintasan Double Tali Kernmantel",
    schedule: "Jasa Pemasangan",
    duration: "Peralatan Safety",
    meetup: "Operator & Rescue Team",
    facility: "P3K Standart & Dokumentasi",
    price: "Rp. 3.000.000",
    status: "Pesan",
  },
];

export default function DestinationGrid() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [animate, setAnimate] = useState(true);

  const filtered = useMemo(() => {
    if (selectedCategory === "All") return trips;
    return trips.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategory) return;
    setAnimate(false);

    setTimeout(() => {
      setSelectedCategory(category);
      setAnimate(true);
    }, 180);
  };

  return (
    <section className="bg-[#FAFAFA] py-20 antialiased selection:bg-[#7B5538]/20">
      <div className="mx-auto max-w-[1350px] px-6">
        
        {/* HEADER */}
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
          <div className="inline-flex rounded-full bg-[#7B5538] px-8 py-3 shadow-lg">
          <h2 className="text-2xl font-extrabold tracking-[0.15em] text-white">
          OUTBOUND
          </h2>
          </div>
            <h3 className="mt-5 text-4xl md:text-[44px] font-black tracking-tight leading-[1.1] text-neutral-900">
              Setiap wahana siap digunakan dengan aman dan nyaman
            </h3>
          </div>
          <p className="max-w-[520px] justify-self-end text-[16px] leading-[1.65] text-neutral-500 font-medium">
            Pemasangan dilakukan oleh tim berpengalaman dengan peralatan keselamatan lengkap
          </p>
        </div>

        {/* CATEGORY (Apple Style Dock) */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 bg-neutral-200/60 backdrop-blur-xl rounded-2xl gap-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`rounded-xl px-5 py-2 text-[14px] font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-white text-neutral-900 shadow-sm scale-[1.02]"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-white/40"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* GRID ATAU NOTIFIKASI KOSONG */}
        {filtered.length === 0 ? (
          <div 
            className={`mt-16 flex flex-col items-center justify-center text-center py-20 px-6 bg-white border border-neutral-200/60 rounded-[32px] shadow-sm max-w-xl mx-auto transition-all duration-500 ${
              animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="w-16 h-16 bg-[#7B5538]/10 rounded-2xl flex items-center justify-center text-2xl mb-5">
              🏔️
            </div>
            <h4 className="text-xl font-bold text-neutral-900 mb-2">
              Trip Belum Tersedia
            </h4>
            <p className="text-neutral-500 font-medium text-sm max-w-xs leading-relaxed">
              trip ini belum tersedia, ditunggu yaa sobat
            </p>
          </div>
        ) : (
          <div
            className={`mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3 transition-all duration-500 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {filtered.map((trip) => (
              <div
                key={trip.id}
                style={{ transitionDelay: `${trip.id * 50}ms` }}
                className={`group relative overflow-hidden rounded-[28px] bg-white border border-neutral-200/50 shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_24px_50px_rgba(0,0,0,0.06)] ${
                  animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                {/* IMAGE */}
                <div className="relative overflow-hidden m-3 rounded-[20px] h-[180px]">
                  <img
                    src={trip.image}
                    alt={trip.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                {/* CONTENT */}
                <div className="px-6 pb-6 pt-3">
                  <h3 className="text-[20px] font-bold tracking-tight text-neutral-900 leading-snug">
                    {trip.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-neutral-400">
                    {trip.location}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="flex gap-2.5 items-center">
                      <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center">🛠️</span>
                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Instalasi</p>
                        <p className="text-xs font-semibold text-neutral-700 truncate max-w-[110px]">{trip.schedule}</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center">🛡️</span>
                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Kemananan</p>
                        <p className="text-xs font-semibold text-neutral-700 truncate max-w-[110px]">{trip.duration}</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center">👷</span>
                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Team</p>
                        <p className="text-xs font-semibold text-neutral-700 truncate max-w-[110px]">{trip.meetup}</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center">🎒</span>
                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Fasilitas</p>
                        <p className="text-xs font-semibold text-neutral-700 truncate max-w-[110px]">
                          {trip.facility.split("\n")[0]}...
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="my-5 border-t border-neutral-100" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[22px] font-black text-neutral-900 tracking-tight">
                        {trip.price}
                      </p>
                      <span className="text-[11px] font-medium text-neutral-400">/hari</span>
                    </div>

                    <button
                      disabled={trip.status !== "Pesan"}
                      className={`rounded-xl px-5 py-2 text-xs font-bold transition-all duration-300 active:scale-95 ${
                        trip.status === "Pesan"
                          ? "bg-[#7B5538] text-white hover:bg-[#5B3E28] shadow-sm shadow-[#7B5538]/20 cursor-pointer"
                          : "bg-red-500 text-white-600 cursor-not-allowed font-bold"
                      }`}
                    >
                      {trip.status}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
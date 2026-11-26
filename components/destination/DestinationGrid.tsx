"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const categories = ["All", "Hiking", "Tektok", "Rock Climbing", "Caving"];

interface DbProduct {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory?: string | null;
  price: number;
  description: string;
  image: string;
  metaData?: {
    location?: string;
    route?: string;
    duration?: string;
    schedule?: string;
    meetup?: string;
    facility?: string;
  } | null;
}

function normalizeSubCat(sub?: string | null) {
  if (!sub || sub === "ALL") return "Hiking";
  return sub
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DestinationGrid() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [animate, setAnimate] = useState(true);
  const [trips, setTrips] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/catalog?category=TRIP");
        const data = await res.json();
        setTrips(data.products || []);
      } catch (err) {
        console.error("Gagal memuat Open Trip:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, []);

  const filtered = useMemo(() => {
    if (selectedCategory === "All") return trips;
    return trips.filter(
      (item) =>
        normalizeSubCat(item.subCategory).toLowerCase() ===
        selectedCategory.toLowerCase()
    );
  }, [trips, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategory) return;
    setAnimate(false);

    setTimeout(() => {
      setSelectedCategory(category);
      setAnimate(true);
    }, 180);
  };

  const formatRupiah = (num: number) =>
    "Rp. " + new Intl.NumberFormat("id-ID").format(num);

  return (
    <section className="bg-[#FAFAFA] py-14 sm:py-20 antialiased selection:bg-[#7B5538]/20">
      <div className="mx-auto max-w-[1350px] px-4 sm:px-6">
        {/* HEADER */}
        <div className="grid items-center gap-5 sm:gap-8 lg:grid-cols-2">
          <div>
            <div className="inline-flex rounded-full bg-[#7B5538] px-6 sm:px-8 py-2.5 sm:py-3 shadow-lg">
              <h2 className="text-lg sm:text-2xl font-extrabold tracking-[0.15em] text-white">
                OPEN TRIP
              </h2>
            </div>
            <h3 className="mt-4 sm:mt-5 text-3xl sm:text-4xl md:text-[44px] font-black tracking-tight leading-[1.12] text-neutral-900">
              Temukan Trip Terbaik <br className="hidden sm:inline" /> Untuk Perjalanan Anda
            </h3>
          </div>
          <p className="max-w-[520px] justify-self-start lg:justify-self-end text-sm sm:text-[16px] leading-[1.65] text-neutral-500 font-medium">
            Jelajahi keindahan wisata alam Indonesia dan rencanakan perjalanan alam Anda
            dengan informasi perjalanan terbaik bersama Alam Memanggil yang mengarungi destinasi indonesia dari seluruh sabang sampai merauke .
          </p>
        </div>

        {/* CATEGORY (Apple Style Dock) */}
        <div className="mt-8 sm:mt-12 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 bg-neutral-200/60 backdrop-blur-xl rounded-2xl gap-1 max-w-full">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`rounded-xl px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-[14px] font-semibold transition-all duration-300 cursor-pointer ${
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
        {loading ? (
          <div className="mt-12 sm:mt-16 text-center text-sm font-semibold text-neutral-400">
            Memuat paket open trip...
          </div>
        ) : filtered.length === 0 ? (
          <div
            className={`mt-12 sm:mt-16 flex flex-col items-center justify-center text-center py-14 sm:py-20 px-5 sm:px-6 bg-white border border-neutral-200/60 rounded-[28px] sm:rounded-[32px] shadow-sm max-w-xl mx-auto transition-all duration-500 ${
              animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#7B5538]/10 rounded-2xl flex items-center justify-center text-2xl mb-4 sm:mb-5">
              🏔️
            </div>
            <h4 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">
              Trip Belum Tersedia
            </h4>
            <p className="text-neutral-500 font-medium text-xs sm:text-sm max-w-xs leading-relaxed">
              trip ini belum tersedia, ditunggu yaa sobat
            </p>
          </div>
        ) : (
          <div
            className={`mt-10 sm:mt-14 grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3 transition-all duration-500 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {filtered.map((trip, idx) => {
              const meta = trip.metaData || {};
              return (
                <div
                  key={trip.id}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                  className={`group relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-white border border-neutral-200/50 shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_24px_50px_rgba(0,0,0,0.06)] ${
                    animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                >
                  {/* IMAGE */}
                  <div className="relative overflow-hidden m-2.5 sm:m-3 rounded-[18px] sm:rounded-[20px] h-[175px] sm:h-[180px]">
                    <img
                      src={trip.image || "/images/gununggede.png"}
                      alt={trip.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 rounded-xl bg-white/80 px-3 py-1.5 text-[11px] font-bold backdrop-blur-md shadow-sm text-neutral-800 border border-white/20 max-w-[85%] truncate">
                      📍 {meta.route || normalizeSubCat(trip.subCategory)}
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-2 sm:pt-3">
                    <h3 className="text-lg sm:text-[20px] font-bold tracking-tight text-neutral-900 leading-snug">
                      {trip.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-neutral-400">
                      {meta.location || "Indonesia"}
                    </p>

                    <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex gap-2 items-center min-w-0">
                        <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                          📅
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                            Jadwal
                          </p>
                          <p className="text-xs font-semibold text-neutral-700 truncate">
                            {meta.schedule || "Sesuai Jadwal"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center min-w-0">
                        <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                          ⛺
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                            Durasi
                          </p>
                          <p className="text-xs font-semibold text-neutral-700 truncate">
                            {meta.duration || "2 Hari 1 Malam"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center min-w-0">
                        <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                          📍
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                            Mepo
                          </p>
                          <p className="text-xs font-semibold text-neutral-700 truncate">
                            {meta.meetup || "Meeting Point"}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center min-w-0">
                        <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                          🎒
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                            Fasilitas
                          </p>
                          <p className="text-xs font-semibold text-neutral-700 truncate">
                            {meta.facility || "Perlengkapan Standar"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="my-4 sm:my-5 border-t border-neutral-100" />

                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-lg sm:text-[22px] font-black text-neutral-900 tracking-tight truncate">
                          {formatRupiah(trip.price)}
                        </p>
                        <span className="text-[11px] font-medium text-neutral-400">
                          /orang
                        </span>
                      </div>

                      <Link
                        href={`/paket/trip/${trip.slug}`}
                        className="rounded-xl px-4 sm:px-5 py-2 text-xs font-bold bg-[#7B5538] text-white hover:bg-[#5B3E28] shadow-sm shadow-[#7B5538]/20 transition-all duration-300 active:scale-95 inline-block text-center cursor-pointer shrink-0"
                      >
                        Pesan
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Marquee from "react-fast-marquee";

interface TimeTripSlot {
  id: string;
  dateLabel: string;
  quota: number;
  sold?: boolean;
}

interface ProductMeta {
  isRecommended?: boolean;
  location?: string;
  elevation?: string;
  route?: string;
  duration?: string;
  timeTrips?: TimeTripSlot[];
  meetingPoints?: string[];
}

interface ApiProductItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory?: string | null;
  price: number;
  image: string;
  stock: number;
  metaData?: ProductMeta | null;
}

interface RecommendedTripCard {
  id: string;
  image: string;
  route: string;
  title: string;
  location: string;
  schedule: string;
  duration: string;
  meetup: string;
  price: string;
  status: "Pesan" | "Tutup";
  href: string;
}

function formatRupiah(num: number): string {
  return `Rp. ${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
  }).format(num)}`;
}

function getDetailTripUrl(prod: ApiProductItem): string {
  const key = prod.slug || prod.id;
  return `/paket/trip/${encodeURIComponent(key)}`;
}

function mapProductToTripCard(prod: ApiProductItem): RecommendedTripCard {
  const meta = (prod.metaData || {}) as ProductMeta;
  const slots = Array.isArray(meta.timeTrips) ? meta.timeTrips : [];

  const availableSlot = slots.find(
    (s) => !s.sold && Number(s.quota || 0) > 0
  );

  const isOpen =
    slots.length > 0 ? Boolean(availableSlot) : Number(prod.stock ?? 1) > 0;

  const scheduleText = availableSlot?.dateLabel
    ? availableSlot.dateLabel
    : slots[0]?.dateLabel
    ? slots[0].dateLabel
    : "Setiap Weekend";

  const firstMepo =
    Array.isArray(meta.meetingPoints) && meta.meetingPoints.length > 0
      ? meta.meetingPoints[0]
      : "Mepo Cawang Uki";

  const routeText = meta.route
    ? meta.route.replace(/^via\s+/i, "")
    : (prod.subCategory || "Hiking").replace(/_/g, " ");

  const titleWithElevation =
    meta.elevation &&
    !prod.title.toLowerCase().includes(meta.elevation.toLowerCase())
      ? `${prod.title} ${meta.elevation}`
      : prod.title;

  return {
    id: prod.id,
    image: prod.image || "/images/gununggede.png",
    route: routeText,
    title: titleWithElevation,
    location: meta.location || "Indonesia",
    schedule: scheduleText,
    duration: meta.duration || "2 Hari 1 Malam",
    meetup: firstMepo.toLowerCase().startsWith("mepo")
      ? firstMepo
      : `Mepo ${firstMepo}`,
    price: formatRupiah(prod.price),
    status: isOpen ? "Pesan" : "Tutup",
    href: getDetailTripUrl(prod),
  };
}

export default function Recommendation() {
  const [trips, setTrips] = useState<RecommendedTripCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadRecommendedTrips() {
      try {
        const res = await fetch("/api/catalog?category=TRIP", { cache: "no-store" });
        const data = await res.json();
        const allProducts: ApiProductItem[] = data.products || [];

        const recommendedOpenTrips = allProducts.filter(
          (p) =>
            String(p.category || "").toUpperCase() === "TRIP" &&
            Boolean(p.metaData?.isRecommended)
        );

        if (active) {
          setTrips(recommendedOpenTrips.map(mapProductToTripCard));
        }
      } catch {
        if (active) setTrips([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecommendedTrips();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-white py-10 overflow-hidden antialiased select-none">
      <div className="mx-auto max-w-[1350px] px-6">
        {/* HEADER AREA (Gaya Tipografi Premium Apple) */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full bg-[#7B5538] px-4 py-2 shadow-lg">
              <h2 className="text-1xl font-extrabold tracking-[0.15em] text-white">
                REKOMENDASI TRIP
              </h2>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 leading-none mt-5">
              Pilihan Populer Pekan Ini
            </h2>
          </div>
          <p className="max-w-md text-s font-high text-black leading-relaxed md:text-right">
            Destinasi alam terfavorit pilihan para petualang yang dikurasi khusus berdasarkan kenyamanan rute dan ulasan terbaik.
          </p>
        </div>

        {/* LAYOUT GRID UTAMA BENTO BOX */}
        <div className="grid items-stretch gap-6 lg:grid-cols-[380px_1fr]">
          {/* LEFT BANNER (Apple Inspired - Matched to Reference Image) */}
          <div className="relative h-[420px] overflow-hidden rounded-[32px] border border-white/10 shadow-lg group select-none">
            <img
              src="/images/SECTIONREKOMENDASI.png"
              alt="Destination Cover"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:bg-black/20" />

            <div className="absolute inset-x-8 bottom-10 z-10 flex flex-col items-start gap-6">
              <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-white leading-[1.25] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                Find Another Wonderful Destination In Indonesia
              </h2>

              <Link
                href="/destination"
                className="inline-flex items-center gap-4 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-lg px-8 py-3.5 text-xs font-bold text-neutral-900 border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out active:scale-95 cursor-pointer group/btn"
              >
                <span className="tracking-wide">See More Trips</span>

                <svg
                  width="24"
                  height="12"
                  viewBox="0 0 24 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform duration-300 ease-out group-hover/btn:translate-x-2"
                >
                  <path
                    d="M0 6H22M22 6L17 1M22 6L17 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* RIGHT MARQUEE SLIDER */}
          <div className="overflow-hidden py-3 flex items-center">
            {loading ? (
              <div className="flex gap-6 px-3.5">
                {[1, 2].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="w-[410px] h-[300px] rounded-[26px] bg-neutral-100 animate-pulse border border-neutral-200/60"
                  />
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="w-full h-[300px] rounded-[26px] border border-dashed border-neutral-200 bg-neutral-50/70 flex flex-col items-center justify-center text-center px-6">
                <p className="text-sm font-bold text-neutral-700">
                  Belum ada Open Trip yang ditandai sebagai Rekomendasi Trip.
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Admin dapat mencentang opsi &ldquo;Tampilkan di Section Rekomendasi Trip&rdquo; pada menu Etalase Paket.
                </p>
              </div>
            ) : (
              <Marquee
                speed={35}
                gradient={true}
                gradientColor="white"
                gradientWidth={40}
                pauseOnHover
                pauseOnClick
                autoFill
              >
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="mx-3.5 w-[410px] h-[300px] flex flex-col justify-between overflow-hidden rounded-[26px] bg-black/10 border border-neutral-200/50 transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1) hover:-translate-y-2 hover:bg-white hover:border-neutral-300/80 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] group"
                  >
                    {/* Bagian Atas: Cover Foto dengan Rute Float */}
                    <div className="relative m-1 rounded-[18px] h-[125px] overflow-hidden">
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 rounded-xl bg-white/80 px-3 py-1.5 text-[10px] font-bold backdrop-blur-md border border-white/20 text-neutral-800 shadow-sm">
                        📍 {trip.route}
                      </div>
                    </div>

                    {/* Bagian Bawah: Data & Metadata */}
                    <div className="flex flex-1 flex-col justify-between px-5 pb-5 pt-1">
                      <div>
                        <h3 className="line-clamp-1 text-[16px] font-bold tracking-tight text-neutral-900">
                          {trip.title}
                        </h3>
                        <p className="line-clamp-1 text-[11px] font-semibold text-neutral-400 mt-0.5">
                          {trip.location}
                        </p>

                        {/* Meta Info Bar Grid Minimalis */}
                        <div className="mt-3.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] font-bold text-neutral-500">
                          <span className="flex items-center gap-1 bg-neutral-200/50 px-2 py-0.5 rounded-md">
                            🗓️ {trip.schedule}
                          </span>
                          <span className="flex items-center gap-1 bg-neutral-200/50 px-2 py-0.5 rounded-md">
                            ⏳ {trip.duration}
                          </span>
                          <span className="flex items-center gap-1 bg-neutral-200/50 px-2 py-0.5 rounded-md max-w-[110px] truncate">
                            📍 {trip.meetup}
                          </span>
                        </div>
                      </div>

                      {/* Footer Card: Harga & Tombol Aksi */}
                      <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center justify-between">
                        <div>
                          <span className="text-[16px] font-black tracking-tight text-neutral-900 block leading-none">
                            {trip.price}
                          </span>
                          <span className="text-[9px] font-medium text-neutral-400">
                            /orang
                          </span>
                        </div>

                        {trip.status === "Pesan" ? (
                          <Link
                            href={trip.href}
                            className="rounded-xl px-5 py-2 text-xs font-bold bg-[#7B5538] text-white hover:bg-[#5B3E28] shadow-sm shadow-[#7B5538]/20 transition-all duration-300 active:scale-95 inline-block text-center cursor-pointer"
                          >
                            {trip.status}
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="rounded-xl px-5 py-2 text-xs font-bold bg-red-500 text-white cursor-not-allowed"
                          >
                            {trip.status}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </Marquee>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link"; // PERBAIKAN: Import Link dari Next.js

const categories = ["All", "Hiking", "Tektok", "Rock Climbing", "Caving"];

const trips = [
  {
    id: 1,
    category: "Hiking",
    image: "/images/RINJANI.jpg",
    route: "Sembalun - Torean",
    title: "Gunung Rinjani 3726 MDPL",
    location: "Lombok, Nusa Tenggara Barat",
    schedule: "Setiap Weekend",
    duration: "4 Hari 3 Malam",
    meetup: "Mepo Cawang Uki",
    facility: "Transport, Simaksi, Konsumsi,\nGuide & Sertifikat",
    price: "Rp. 2.350.000",
    status: "Tutup",
    slug: "/", 
  },
  {
    id: 2,
    category: "Hiking",
    image: "/images/gununggede.png",
    route: "Putri",
    title: "Gunung Gede 2958 MDPL",
    location: "Bogor, Jawa Barat",
    schedule: "Setiap Weekend",
    duration: "2 Hari 1 Malam",
    meetup: "Mepo Cawang Uki",
    facility: "Transport, Simaksi, Konsumsi,\nGuide & Sertifikat",
    price: "Rp. 650.000",
    status: "Pesan",
    slug: "/OpenTrip/GedeTrip",
  },
  {
    id: 3,
    category: "Hiking",
    image: "/images/gunungpapandayan.png",
    route: "Cisurupan",
    title: "Gunung Papandayan 2565 MDPL",
    location: "Garut, Jawa Barat",
    schedule: "Setiap Weekend",
    duration: "2 Hari 1 Malam",
    meetup: "Mepo Cawang Uki",
    facility: "Transport, Simaksi, Konsumsi,\nGuide & Sertifikat",
    price: "Rp. 400.000",
    status: "Pesan",
    slug: "/OpenTrip/PapandayanTrip", 
  },
  {
    id: 4,
    category: "Hiking",
    image: "/images/gunungprau.png",
    route: "Patak Banteng",
    title: "Gunung Prau 2565 MDPL",
    location: "Wonosobo, Jawa Tengah",
    schedule: "Setiap Weekend",
    duration: "2 Hari 1 Malam",
    meetup: "Mepo Cawang Uki",
    facility: "Transport, Simaksi, Konsumsi,\nGuide & Sertifikat",
    price: "Rp. 700.000",
    status: "Tutup",
    slug: "/open-trip-prau",
  },
  {
    id: 5,
    category: "Hiking",
    image: "/images/gununglawu.png",
    route: "Candi Cetho",
    title: "Gunung Lawu 3265 MDPL",
    location: "Karanganyar, Jawa Tengah",
    schedule: "Setiap Weekend",
    duration: "2 Hari 1 Malam",
    meetup: "Mepo Cawang Uki",
    facility: "Transport, Simaksi, Konsumsi,\nGuide & Sertifikat",
    price: "Rp. 750.000",
    status: "Tutup",
    slug: "/open-trip-lawu",
  },
  {
    id: 6,
    category: "Hiking",
    image: "/images/gunungmerbabu.png",
    route: "Suwanting",
    title: "Gunung Merbabu 3145 MDPL",
    location: "Magelang, Jawa Tengah",
    schedule: "Setiap Weekend",
    duration: "2 Hari 1 Malam",
    meetup: "Mepo Cawang Uki",
    facility: "Transport, Simaksi, Konsumsi,\nGuide & Sertifikat",
    price: "Rp. 800.000",
    status: "Tutup",
    slug: "/open-trip-merbabu",
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
                OPEN TRIP
              </h2>
            </div>
            <h3 className="mt-5 text-4xl md:text-[44px] font-black tracking-tight leading-[1.1] text-neutral-900">
              Temukan Trip Terbaik <br /> Untuk Perjalanan Anda
            </h3>
          </div>
          <p className="max-w-[520px] justify-self-end text-[16px] leading-[1.65] text-neutral-500 font-medium">
            Jelajahi keindahan wisata alam Indonesia dan rencanakan perjalanan alam Anda 
            dengan informasi perjalanan terbaik bersama Alam Memanggil yang mengarungi destinasi indonesia dari seluruh sabang sampai merauke .
          </p>
        </div>

        {/* CATEGORY (Apple Style Dock) */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center p-1.5 bg-neutral-200/60 backdrop-blur-xl rounded-2xl gap-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`rounded-xl px-5 py-2 text-[14px] font-semibold transition-all duration-300 cursor-pointer ${
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
                  <div className="absolute left-3 top-3 rounded-xl bg-white/80 px-3 py-1.5 text-[11px] font-bold backdrop-blur-md shadow-sm text-neutral-800 border border-white/20">
                    📍 {trip.route}
                  </div>
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
                      <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center">📅</span>
                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Jadwal</p>
                        <p className="text-xs font-semibold text-neutral-700 truncate max-w-[110px]">{trip.schedule}</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center">⛺</span>
                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Durasi</p>
                        <p className="text-xs font-semibold text-neutral-700 truncate max-w-[110px]">{trip.duration}</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-center">
                      <span className="text-base bg-neutral-100 w-8 h-8 rounded-lg flex items-center justify-center">📍</span>
                      <div>
                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Mepo</p>
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
                      <span className="text-[11px] font-medium text-neutral-400">/orang</span>
                    </div>

                    {/* PERBAIKAN UTAMA: Menggunakan Kondisi Validasi Link vs Button agar Sesuai Target Trip */}
                    {trip.status === "Pesan" ? (
                      <Link
                        href={trip.slug}
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
          </div>
        )}

      </div>
    </section>
  );
}
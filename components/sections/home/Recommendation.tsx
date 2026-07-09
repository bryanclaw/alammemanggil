"use client";

import Link from "next/link";
import Marquee from "react-fast-marquee";

const trips = [
  {
    id: 1,
    image: "/images/gunungrinjani.png",
    route: "Sembalun - Torean",
    title: "Gunung Rinjani 1726 MDPL",
    location: "Lombok, Nusa Tenggara Barat",
    schedule: "Setiap Weekend",
    duration: "4 Hari 3 Malam",
    meetup: "Mepo Jakarta Barat",
    price: "Rp. 2.350.000",
    status: "Tutup",
  },
  {
    id: 2,
    image: "/images/gununggede.png",
    route: "Putri",
    title: "Gunung Gede 2958 MDPL",
    location: "Bogor, Jawa Barat",
    schedule: "Setiap Weekend",
    duration: "2 Hari 1 Malam",
    meetup: "Mepo Jakarta",
    price: "Rp. 650.000",
    status: "Open",
  },
  {
    id: 3,
    image: "/images/gunungprau.png",
    route: "Patak Banteng",
    title: "Gunung Prau",
    location: "Wonosobo, Jawa Tengah",
    schedule: "Weekend",
    duration: "2 Hari 1 Malam",
    meetup: "Jakarta",
    price: "Rp. 550.000",
    status: "Open",
  },
  {
    id: 4,
    image: "/images/gununglawu.png",
    route: "Candhi Cetho",
    title: "Gunung Lawu",
    location: "Karanganyar, Jawa Tengah",
    schedule: "Open Trip",
    duration: "2 Hari 1 Malam",
    meetup: "Jakarta",
    price: "Rp. 1.750.000",
    status: "Open",
  },
  {
    id: 5,
    image: "/images/gunungmerbabu.png",
    route: "Suwanting",
    title: "Gunung Merbabu",
    location: "Magelang, Jawa Tengah",
    schedule: "Weekend",
    duration: "2 Hari 1 Malam",
    meetup: "Jakarta",
    price: "Rp. 650.000",
    status: "Open",
  },
];

export default function Recommendation() {
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
  {/* Background Image */}
  <img
    src="/images/SECTIONREKOMENDASI.png"
    alt="Destination Cover"
    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-105"
  />
  
  {/* Overlay Transparan Halus untuk Kontras Teks Semata */}
  <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 group-hover:bg-black/20" />
  
  {/* Konten Utama Tengah-Bawah */}
  <div className="absolute inset-x-8 bottom-10 z-10 flex flex-col items-start gap-6">
    {/* Typography Judul Sesuai Gambar */}
    <h2 className="text-[28px] md:text-[32px] font-bold tracking-tight text-white leading-[1.25] drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      Find Another Wonderful Destination In Indonesia
    </h2>
    
    {/* Button Glassmorphism Capsule dengan Animasi Hover */}
   <Link
  href="/destination"
  className="inline-flex items-center gap-4 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-lg px-8 py-3.5 text-xs font-bold text-neutral-900 border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out active:scale-95 cursor-pointer group/btn"
>
  <span className="tracking-wide">See More Trips</span>
  
  {/* SVG Panah Panjang Premium & Dinamis */}
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
                        <span className="flex items-center gap-1 bg-neutral-200/50 px-2 py-0.5 rounded-md">📅 {trip.schedule}</span>
                        <span className="flex items-center gap-1 bg-neutral-200/50 px-2 py-0.5 rounded-md">⏳ {trip.duration}</span>
                        <span className="flex items-center gap-1 bg-neutral-200/50 px-2 py-0.5 rounded-md max-w-[110px] truncate">📍 {trip.meetup}</span>
                      </div>
                    </div>

                    {/* Footer Card: Harga & Tombol Aksi */}
                    <div className="mt-4 pt-3.5 border-t border-neutral-100 flex items-center justify-between">
                      <div>
                        <span className="text-[16px] font-black tracking-tight text-neutral-900 block leading-none">
                          {trip.price}
                        </span>
                        <span className="text-[9px] font-medium text-neutral-400">/orang</span>
                      </div>

                      <button
                        disabled={trip.status !== "Open"}
                        className={`rounded-xl px-4 py-2 text-[11px] font-bold transition-all duration-300 active:scale-95 ${
                          trip.status === "Open"
                            ? "bg-[#6F4E37] text-white hover:bg-[#533927] shadow-sm cursor-pointer"
                            : "bg-red-500 text-white-600 cursor-not-allowed font-bold"
                        }`}
                      >
                        {trip.status === "Open" ? "Pesan" : "Tutup"}
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </Marquee>
          </div>

        </div>

      </div>
    </section>
  );
}
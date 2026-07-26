"use client";

import { useState, useEffect } from "react";


const informationData = {
  title: "Flying Fox & Rapeling",
  elevation: "Lintasan Double Tali Kernmantel",
  price: "Rp 7.000.000/Paket",
  description:
    "Kami menyediakan layanan profesional untuk perencanaan, perancangan, dan pemasangan instalasi Flying Fox & Rapeling standar keamanan tinggi. Cocok untuk area tempat wisata, tempat outbound, resort, sekolah, hingga area komersial",
  includes: [
    "Jasa Pemasangan",
    "Operator & Rescue Team",
    "Peralatan Safety Standar Internasional",
    "P3K Standar",
    "Dokumentasi",
    "Transportasi Team (Area Jakarta)",
    "Konsumsi Team",
  ],
  dates: [
    { date: "Juli 2026", isFull: true },
    { date: "Agustus 2026", isFull: false },
    { date: "September 2026", isFull: false },
  ],
};


const rulesData = [
  "Seluruh peserta dan pihak penyelenggara wajib mengikuti prosedur, arahan, serta tata tertib yang telah ditentukan oleh tim Alam Memanggil demi menjaga keamanan dan kelancaran kegiatan.",
  "Perubahan konsep kegiatan, lokasi, jumlah peserta, atau waktu pelaksanaan setelah proses kesepakatan dapat memengaruhi biaya dan teknis pelaksanaan.",
  "Pihak Penyelenggara wajib menanggung kerusakan alat akibat tindakan dari peserta.",
  "Pihak Penyelenggara tidak mengubah instalasi alat tanpa izin.",
  "Alam Memanggil memiliki hak untuk menghentikan sementara atau membatalkan aktivitas apabila ditemukan kondisi yang dapat membahayakan peserta.",
  "Alam Memanggil berhak menentukan kelayakan suatu lokasi pemasangan berdasarkan standar keamanan operasional yang berlaku.",
  "Setiap peserta wajib mengikuti briefing keselamatan sebelum melakukan aktivitas.",
  "Peserta harus memenuhi batas usia ( 6th - 60th ) dan berat badan ( < 100 kg ) yang telah ditentukan oleh operator.",
  "Peserta wajib dalam kondisi sehat saat mengikuti aktivitas.",
  "Peserta dengan kondisi khusus (contoh: riwayat penyakit jantung, tekanan darah tinggi, cedera tulang/sendi) wajib memberikan informasi kepada operator.",
  "Peserta tidak diperbolehkan melakukan aktivitas apabila sedang mengalami cedera, mengalami gangguan kesehatan yang dapat membahayakan keselamatan, dalam pengaruh alkohol atau zat terlarang.",
  "Peserta wajib menggunakan pakaian dan alas kaki yang aman.",
  "Peserta wajib menjaga sikap dan tidak melakukan tindakan yang dapat membahayakan diri sendiri maupun orang lain.",
  "Peserta wajib mengikuti seluruh arahan dari instruktur/operator.",
  "DP minimal 50% dari total biaya untuk mengunci jadwal.",
  "Pelunasan maksimal dilakukan sebelum hari pelaksanaan atau sesuai kesepakatan.",
  "Pembayaran hanya dilakukan melalui transfer bank BCA 7445357324 A/N Dimas Alifio.",
  "Bukti pembayaran wajib dikirimkan kepada pihak Alam Memanggil untuk proses administrasi.",
  "Pembatalan kegiatan tidak bisa pengembalian uang namun bisa digantikan tanggal lain dengan diskusi bersama.",
  "Perubahan tanggal kegiatan wajib diinformasikan minimal 7 hari sebelum acara.",
  "Perubahan jadwal menyesuaikan ketersediaan tim Alam Memanggil."];

const documentationImages = {
  slider1: ["/images/flyingfox&rapeling.avif", "/images/rapeling3.jpeg", "/images/flyingfox5.jpeg"],
  slider2: ["/images/flyingfox&rapeling2.webp", "/images/rapeling6.jpeg","/images/flyingfox6.jpeg"], 
};


export default function OpenTripGedeDetail() {
  const [activeTab, setActiveTab] = useState("INFORMATION");
  const [currentSlide1, setCurrentSlide1] = useState(0);
  const [currentSlide2, setCurrentSlide2] = useState(0);

  const tabs = ["INFORMATION", "RULES"];

  const nextSlide1 = () => {
    setCurrentSlide1((prev) => (prev + 1) % documentationImages.slider1.length);
  };
  const prevSlide1 = () => {
    setCurrentSlide1(
      (prev) =>
        (prev - 1 + documentationImages.slider1.length) %
        documentationImages.slider1.length
    );
  };

  const nextSlide2 = () => {
    setCurrentSlide2((prev) => (prev + 1) % documentationImages.slider2.length);
  };
  const prevSlide2 = () => {
    setCurrentSlide2(
      (prev) =>
        (prev - 1 + documentationImages.slider2.length) %
        documentationImages.slider2.length
    );
  };

  // Autoplay Slider effect with smooth Timing like Apple
  useEffect(() => {
    const timer1 = setInterval(nextSlide1, 4000);
    const timer2 = setInterval(nextSlide2, 4500);
    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans antialiased text-xs md:text-sm selection:bg-[#8C6239]/20 selection:text-[#8C6239]">
      {/* FLOATING GLASSMORPHIC NAVIGATION BAR */}
      <div className="sticky top-0 z-10 w-full bg-white/20 backdrop-blur-md py-4 px-4 flex justify-left border-b border-neutral-200/50 shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="inline-flex relative rounded-full bg-black/20 p-1 border border-neutral-200/40 shadow-inner">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-2.5 text-[10px] md:text-xs font-black tracking-widest rounded-full transition-all duration-300 ease-out transform active:scale-95 cursor-pointer z-10 uppercase ${
                  isSelected
                    ? "bg-[#6F4E37] text-white shadow-[0_4px_14px_rgba(250,250,250,0.3)] scale-100"
                    : "text-neutral-400 hover:text-white hover:bg-[#6F4E37]"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-[1140px] px-4 py-8 space-y-12">
        <div
          className={`grid gap-8 transition-all duration-500 ease-in-out ${
            activeTab === "INFORMATION" ? "lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {/* COLUMN KIRI (KONTEN UTAMA) */}
          <div
            className={`${
              activeTab === "INFORMATION" ? "lg:col-span-2" : "col-span-1"
            } space-y-6`}
          >
            {/* TAB: INFORMATION */}
            {activeTab === "INFORMATION" && (
              <div className="space-y-6 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* HERO TITLE BLOCK */}
              <div className="bg-black/20 backdrop-blur-2xl rounded-[30px] p-8 border border-neutral-200/60 shadow-sm hover:border-[#8C6239]/20 transition-all duration-300">
                {/* Judul Utama (Flying Fox) - Sudah benar di tengah */}
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-black text-center">
                  {informationData.title}
                </h1>

                <p className="mt-2 text-black font-bold text-[12px] block text-center">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-neutral-300">•</span>
                    <span>{informationData.elevation}</span>
                  </span>
                </p>
              </div>

              {/* DESCRIPTION BENTO BOX */}
                <div className="bg-black/20 backdrop-blur-2xl rounded-[24px] p-6 border border-neutral-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">
                    Jasa Pemasangan
                  </h3>
                  <p className="text-black leading-relaxed font-semibold text-l text-justify">
                    {informationData.description}
                  </p>
                </div>

                {/* INFOGRAFIS ALUR TIMELINE JALUR & MEETING POINT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 backdrop-blur-2xl border border-neutral-200/60 rounded-[24px] p-5 shadow-sm transition-all duration-300 hover:border-[#8C6239]/20">
                    <h4 className="text-[12px] font-black text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      📋 Layanan Kami
                    </h4>
                    <div className="space-y-4 pl-1 relative border-l border-neutral-200 ml-2">
                      <div className="relative pl-4">
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-neutral-400 " />
                        <p className="font-black text-xs text-black">
                          - Survey & Pemetaan Area
                        </p>
                      </div>
                      <div className="relative pl-4">
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-neutral-400 " />
                        <p className="font-black text-xs text-black">
                          - Desain & Konstruksi
                        </p>
                      </div>
                      <div className="relative pl-4">
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-[#8C6239]" />
                        <p className="font-black text-xs text-[#8C6239]">
                          - Pengadaan Material
                        </p>
                      </div>
                      <div className="relative pl-4">
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-[#8C6239]" />
                        <p className="font-black text-xs text-[#8C6239]">
                          - Uji Kelayakan Lintasan
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-2xl border border-neutral-200/60 rounded-[24px] p-5 shadow-sm transition-all duration-300 hover:border-[#8C6239]/20">
                    <h4 className="text-[12px] font-black text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      ⭐ Keunggulan Kami
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-xs font-extrabold text-black">
                      <div className="p-2.5 rounded-xl flex justify-between items-center">
                        <span>- Sistem Keamanan Ganda</span>
                      </div>
                      <div className="p-2.5 rounded-xl flex justify-between items-center">
                        <span>- Peralatan Standar Internasional</span>
                      </div>
                      <div className="p-2.5 rounded-xl flex justify-between items-center">
                        <span>- Instruktur & Operator Kompeten</span>
                      </div>
                      <div className="p-2.5 rounded-xl flex justify-between items-center">
                        <span>- Fasilitas Lengkap</span>
                      </div>
                      <div className="p-2.5 rounded-xl flex justify-between items-center">
                        <span>- Harga Paket Lebih Ekonomis</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FACILITIES: INCLUDE SECTION */}
                <div className="bg-black/20 backdrop-blur-2xl rounded-[24px] p-6 border border-neutral-200/60 shadow-sm">
                  <h3 className="text-[12px] font-black text-neutral-500 uppercase tracking-widest mb-3">
                    ✅ Include
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs font-semibold text-black">
                    {informationData.includes.map((inc, i) => (
                      <li
                        key={i}
                        className="flex gap-2.5 items-start hover:translate-x-1 transition-transform duration-200"
                      >
                        <span className="text-[#8C6239] font-black shrink-0">
                          ✓
                        </span>
                        <span className="leading-tight">{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
        
            {/* TAB: RULES */}
            {activeTab === "RULES" && (
              <div className="border border-neutral-200/60 rounded-[24px] p-6 bg-black/10 backdrop-blur-2xl shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <h3 className="text-sm font-black text-black tracking-wide mb-4 pb-2 border-b border-neutral-200">
                  TATA TERTIB & SOP KESELAMATAN
                </h3>
                <div className="space-y-2">
                  {rulesData.map((rule, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start p-3 rounded-xl hover:bg-neutral-50 transition-all duration-200 text-xs font-semibold text-black leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#8C6239]/10 text-[#8C6239] flex items-center justify-center text-[10px] font-black shrink-0">
                        {i + 1}
                      </span>
                      <p className="whitespace-pre-line">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN KANAN - BOOKING AREA */}
          {activeTab === "INFORMATION" && (
            <div className="lg:col-span-1 space-y-5 transition-all duration-500 animate-in fade-in slide-in-from-right-8 duration-500">
              {/* BOOKING CARD GRID */}
              <div className="border border-neutral-300 bg-black/10 backdrop-blur-2xl rounded-[24px] p-5 shadow-sm relative overflow-hidden">
                {/* PREMIUM MOUNTAIN IMAGE (Garut image kept per code) */}
                <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-neutral-200/80 relative bg-neutral-100">
                  <img
                    src="/images/flyingfox&rapeling2.webp"
                    alt="Flying Fox"
                    className="w-full h-full object-cover filter contrast-[1.01]"
                  />
                </div>

                {/* Header Info Destinasi (Garut info kept per code) */}
                <div className="text-center lg:text-left mb-3">
                  <h2 className="text-base font-black text-xl text-black tracking-tight">
                    Flying Fox & Rapeling
                  </h2>
                  <p className="text-neutral-500 text-l font-bold -mt-0.5">
                    Lintasan Double Tali Kernmantel
                  </p>
                </div>

                {/* Badge Header Time Trip */}
                <div className="w-full bg-[#6F4E37] text-white py-1.5 rounded-full text-center text-[15px] font-black tracking-widest uppercase shadow-xs">
                  🗓️ Time Schedule
                </div>

                {/* Grid Pilihan Tanggal */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {informationData.dates.map((d, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg py-2.5 px-1 text-center shadow-xs transition-all ${
                        d.isFull
                          ? "border-red-600 bg-red-600 text-white cursor-not-allowed"
                          : "border-black bg-white text-black cursor-pointer transform active:scale-95 hover:bg-neutral-50"
                      }`}
                    >
                      <p
                        className={`text-[15px] font-black tracking-tighter whitespace-nowrap ${
                          d.isFull ? "text-white" : "text-black"
                        }`}
                      >
                        {d.date} {d.isFull && "(FULL)"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Catatan Label Merah */}
                <p className="mt-2 text-[10px] font-black italic text-rose-600 text-center">
                  *Tanggal blok merah artinya sudah full
                </p>

                {/* Breakdown Invoice Rincian Harga */}
                <div className="mt-5 space-y-2 border-t border-dashed border-neutral-300 pt-4 text-xs font-black text-black">
                  <div className="flex justify-between">
                    <span className="font-bold text-neutral-500">
                      Total Harga Trip / PAX
                    </span>
                    <span>{informationData.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-neutral-500">
                      Biaya Admin
                    </span>
                    <span>RP 0.00</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm text-black">
                    <span>Total Harga</span>
                    <span className="text-[#8C6239]">
                      {informationData.price}
                    </span>
                  </div>
                </div>

                {/* Tombol Elips Oval Cokelat (Hover Putih-Teks Hitam) */}
                <div className="mt-5 flex flex-col items-center">
                  <button
                    onClick={() =>
                      window.open("https://wa.me/6281292548524", "_blank")
                    }
                    className="w-[100%] bg-white text-black border border-[#734A26] py-2.5 px-6 rounded-full font-black text-xs tracking-widest text-center shadow transform active:scale-95 transition-all duration-300 uppercase cursor-pointer hover:bg-[#734A26] hover:text-white"
                  >
                    KONFIRMASI
                  </button>
                  <p className="mt-2 text-[10px] text-black font-bold italic text-center">
                    *Untuk booking trip silahkan konfirmasi selanjutnya
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION DOKUMENTASI (Pindah ke bawah dan FULL WIDTH) */}
        {activeTab === "INFORMATION" && (
          <div className="space-y-6 pt-10 border-t border-neutral-100 transition-all duration-500 max-w-[900px] mx-auto">
            <div>
              <h2 className="text-sm font-black tracking-widest text-[#8C6239] uppercase">
                Galeri Dokumentasi
              </h2>
              <p className="text-xs text-neutral-400 mt-1 font-medium">
                Keseruan Kegiatan Flying Fox & Rapeling
              </p>
            </div>

            {/* GRID CONTAINER UNTUK 2 SLIDER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SLIDER 1 */}
              <div className="relative rounded-[28px] overflow-hidden aspect-[16/10] md:aspect-auto md:h-[380px] bg-neutral-900 border border-neutral-200/30 group shadow-lg">
                <div className="w-full h-full relative">
                  {documentationImages.slider1.map((img, i) => (
                    <div
                      key={i}
                      className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
                        i === currentSlide1
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-105 pointer-events-none"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Slider 1 - Image ${i + 1}`}
                        className="w-full h-full object-cover filter brightness-[0.9] contrast-[1.02]"
                      />
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-10 right-6 z-10 flex gap-1.5 bg-black/20 backdrop-blur-xl px-2.5 py-1.5 rounded-full border border-white/10">
                  {documentationImages.slider1.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide1(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === currentSlide1
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* SLIDER 2 */}
              <div className="relative rounded-[28px] overflow-hidden aspect-[16/10] md:aspect-auto md:h-[380px] bg-neutral-900 border border-neutral-200/30 group shadow-lg">
                <div className="w-full h-full relative">
                  {documentationImages.slider2.map((img, i) => (
                    <div
                      key={i}
                      className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] transform ${
                        i === currentSlide2
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-105 pointer-events-none"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Slider 2 - Image ${i + 1}`}
                        className="w-full h-full object-cover filter brightness-[0.9] contrast-[1.02]"
                      />
                    </div>
                  ))}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-100 pointer-events-none" />

                <div className="absolute bottom-10 right-6 z-10 flex gap-1.5 bg-black/20 backdrop-blur-xl px-2.5 py-1.5 rounded-full border border-white/10">
                  {documentationImages.slider2.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide2(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === currentSlide2
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
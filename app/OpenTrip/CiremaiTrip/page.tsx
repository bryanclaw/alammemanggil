"use client";

import { useState } from "react";

const informationData = {
  title: "Open Trip Gunung Gede",
  location: "Bogor, Jawa Barat",
  elevation: "2958 MDPL",
  temperature: "Suhu Siang 20°C, Malam 5°C",
  humidity: "Kelembapan 80 - 90%",
  price: "Rp 650.000/Pax",
  route: "Via Putri",
  duration: "2 Hari 1 Malam",
  quota: "Maksimal 12 Orang",
  description:
    "Gunung Gede merupakan salah satu gunung favorit pendaki di Jawa Barat dengan ketinggian sekitar 2.958 mdpl. Gunung ini berada dalam kawasan Taman Nasional Gunung Gede Pangrango dan dikenal memiliki jalur pendakian yang ramah bagi pendaki pemula hingga berpengalaman. Keindahan alamnya terlihat dari hutan tropis, padang edelweiss Surya Kencana, serta kawah aktif di puncaknya. Gunung Gede menawarkan pengalaman pendakian yang memadukan petualangan, panorama alam, dan kesejukan udara pegunungan.",
  includes: [
    "Transportasi PP dari meeting point",
    "Simaksi, Tiket Masuk dan Asuransi Taman Nasional",
    "Basecamp Tempat Singgah",
    "Tour Crew Berpengalaman",
    "Porter Kelompok",
    "Tenda Kapasitas 4 orang ( Pria Dan Wanita dipisah jika Ganjil di sesuaikan )",
    "Tenda Toilet",
    "Alat masak dan makan",
    "Makan di Basecamp 1x",
    "Makan di area Camp 3x",
    "Kopi dan teh selama camp",
    "Buah - Buahan",
    "Dokumentasi",
    "P3K Kelompok Standart Pendakian",
    "Sertifikat Apresiasi Digital",
  ],
  excludes: [
    "Perlengkapan Pribadi",
    "Obat Obatan Pribadi",
    "Cemilan & Air Mineral Pribadi",
    "Tips Crew",
  ],
  optionals: [
    "Porter Pribadi Selama Pendakian Rp 600.000",
    "Tenda Privasi Rp. 150.000 / Pax khusus pasangan menikah / sesama jenis kelamin",
  ],
  dates: [
    { date: "Juli 2026", isFull: true },
    { date: "Agustus 2026", isFull: false },
    { date: "September 2026", isFull: false }
  ],
};

const itineraryData = [
  {
    day: "DAY 1",
    activities: [
      { time: "20.00 - 20.30", desc: "Berkumpul di Meeting Point Cawang Uki" },
      { time: "20.30 - 22.00", desc: "Perjalanan Menuju Stasiun Bogor" },
      { time: "22.00 - 22.30", desc: "Berkumpul di Meeting Point Stasiun Bogor" },
      { time: "22.30 - 23.30", desc: "Perjalanan Menuju Basecamp Gunung Gede" },
      { time: "23.30 - 06.00", desc: "Istirahat di Basecamp" },
    ],
  },
  {
    day: "DAY 2",
    activities: [
      { time: "06.00 - 08.00", desc: "Berkumpul Persiapan Pendakian" },
      { time: "08.00 - 16.00", desc: "Pendakian menuju Camp Area Surya Kencana Barat" },
      { time: "16.00 - 18.00", desc: "Menikmati Suasana Sabana Surya Kencana" },
      { time: "18.00 - 19.00", desc: "Menikmati Makan Malam" },
      { time: "19.00 - 04.00", desc: "Istirahat di Tenda" },
    ],
  },
  {
    day: "DAY 3",
    activities: [
      { time: "04.00 - 05.00", desc: "Persiapan Summit dan Sarapan" },
      { time: "05.00 - 07.00", desc: "Pendakian Summit Puncak Gunung Gede" },
      { time: "07.00 - 09.00", desc: "Menikmati Suasana Puncak Gunung Gede" },
      { time: "09.00 - 10.30", desc: "Pendakian Turun menuju Surya Kencana" },
      { time: "10.30 - 12.00", desc: "Istirahat dan Makan di Tenda" },
      { time: "12.00 - 18.00", desc: "Pendakian Turun Menuju Basecamp" },
      { time: "18.00 - 20.30", desc: "Istirahat, Bersih - Bersih, Makan ( biaya pribadi )" },
      { time: "20.30 - 21.30", desc: "Perjalanan Menuju Stasiun Bogor" },
      { time: "21.30 - 23.00", desc: "Berkumpul di Meeting Point Cawang Uki" },
    ],
  },
];

const essentialData = [
  { no: 1, item: "Tas Carrier", qty: "1", note: "Ukuran 45 - 60 L" },
  { no: 2, item: "Raincover", qty: "1", note: "Sesuai Ukuran Carrier" },
  { no: 3, item: "Baju Ganti", qty: "minimal 2", note: "Disarankan bahan olahraga" },
  { no: 4, item: "Celana Ganti", qty: "minimal 2", note: "Disarankan panjang, tidak boleh jeans" },
  { no: 5, item: "Pakaian Dalam", qty: "minimal 2", note: "" },
  { no: 6, item: "Kaos Kaki", qty: "minimal 3", note: "Disarankan kaos kaki tebal dan panjang" },
  { no: 7, item: "Jaket", qty: "1", note: "Disarankan jaket tebal atau windbreaker" },
  { no: 8, item: "Sepatu Gunung", qty: "1", note: "Dilarang mengenakan sandal gunung" },
  { no: 9, item: "Ponco/Jas Hujan", qty: "1", note: "" },
  { no: 10, item: "Sleeping Bag", qty: "1", note: "" },
  { no: 11, item: "Matras Gulung", qty: "1", note: "" },
  { no: 12, item: "Sarung Tangan", qty: "1", note: "Untuk menahan dingin" },
  { no: 13, item: "Buff", qty: "1", note: "Untuk menahan debu" },
  { no: 14, item: "Air mineral", qty: "2 ( 600 ml )", note: "Untuk minum pribadi selama di gunung" },
  { no: 15, item: "Air mineral", qty: "2 ( 1,5 L )", note: "Untuk minum pribadi selama di gunung" },
  { no: 16, item: "Headlamp", qty: "1", note: "Headlamp kepala agar memudahkan tangan memegang yang lain" },
  { no: 17, item: "Baterai Ganti", qty: "1 set", note: "Jumlah dan ukuran disesuaikan dengan baterai headlamp" },
  { no: 18, item: "Plastik Sampah", qty: "sesuaikan", note: "Untuk Sampah Pribadi" },
  { no: 19, item: "Snack Pribadi", qty: "sesuaikan", note: "Jumlah dibebaskan" },
  { no: 20, item: "Handwarmer", qty: "1", note: "" },
  { no: 21, item: "Thermal Blanket", qty: "1", note: "" },
  { no: 22, item: "Dompet", qty: "1", note: "Berisi uang cash dan KTP" },
  { no: 23, item: "Powerbank", qty: "1", note: "Beserta kabel cas" },
];

const rulesData = [
  "Harga hanya berlaku untuk WNI (Warga Negara Indonesia) dan harga ini tidak berlaku untuk WNA (Warga Negara Asing).",
  "Open Trip merupakan Trip Gabungan, dimana selama trip nanti peserta akan di gabung dengan peserta/group lainnya.",
  "Minimal Peserta 12 orang. Apabila peserta Open Trip kurang dari minimal Kuota, maka trip akan tetap berjalan dengan menyesuaikan harga dengan jumlah pesertanya.",
  "Peserta di harapkan untuk mempersiapkan Fisik dan memastikan dalam keadaan sehat sebelum melakukan pendakian. Bagi yang kurang sehat di harapkan untuk tidak memaksakan pendakian.",
  "Bagi Peserta yang memiliki penyakit khusus di harapkan untuk melakukan konsultasi terlebih dahulu dengan Dokter.",
  "Pembookingan Open Trip konfirmasi melalui WA kami.",
  "Pembookingan bisa di lakukan dengan melakukan pembayaran DP 50% dan Pelunasan bisa di lakukan H-7 sebelum trip berlangsung.",
  "Alam Memanggil tidak menerima booking tanpa adanya pembayaran DP terlebih dahulu.",
  "Setelah melakukan Pembayaran di harapkan untuk melakukan konfirmasi ke nomor WA Alam Memanggil.",
  "Peserta Open Trip di anggap fix apabila sudah melakukan pembayaran sejumlah yang tertera di form booking.",
  "Pembatalan Trip dari pihak Peserta secara sepihak, maka tidak ada pengembalian uang.",
  "Pembatalan keberangkatan tidak bisa pengembalian uang namun bisa digantikan oleh orang lain ( keluarga atau teman ).",
  "Alam Memanggil berhak untuk membatalkan trip dengan pertimbangan tertentu di luar kemampuan seperti cuaca buruk, condition atau situasi dimana membahayakan peserta akan tetapi ada pengembalian (refund) sebesar 50% atau tapi bisa pindah ke tanggal atau destinasi (gunung) lainnya.",
  "Pembayaran via Transfer hanya dikirimkan ke Nomor Rekening dibawah ini: Bank Central Asia (BCA) - No Rek: 1672456708 - Atas Nama: Micheal Chandra",
];

export default function OpenTripGedeDetail() {
  const [activeTab, setActiveTab] = useState("INFORMATION");
  const tabs = ["INFORMATION", "ITINERARY", "ESSENTIAL", "RULES"];

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
      <main className="mx-auto max-w-[1140px] px-4 py-8">
        <div className={`grid gap-8 transition-all duration-500 ease-in-out ${activeTab === "INFORMATION" ? "lg:grid-cols-3" : "grid-cols-1"}`}>
          
          {/* COLUMN KIRI (KONTEN UTAMA) */}
          <div className={`${activeTab === "INFORMATION" ? "lg:col-span-2" : "col-span-1"} space-y-6`}>
            
            {/* TAB: INFORMATION */}
            {activeTab === "INFORMATION" && (
              <div className="space-y-6 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-500">
                
                {/* HERO TITLE BLOCK */}
                <div className="bg-black/20 backdrop-blur-2xl rounded-[30px] p-8 border border-neutral-200/60 shadow-sm hover:border-[#8C6239]/20 transition-all duration-300">
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight text-black">
                    {informationData.title}
                  </h1>
                  <p className="mt-2 text-black font-bold text-10px flex items-center gap-2">
                    <span>📍 {informationData.location}</span>
                    <span className="text-neutral-300">•</span>
                    <span>🏔️ {informationData.elevation}</span>
                  </p>
                </div>

                {/* INLINE BENTO SPECS */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/20 backdrop-blur-2xl rounded-[20px] p-4 border border-neutral-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <p className="font-bold text-neutral-500 text-[10px] uppercase tracking-wider">Jalur Pendakian</p>
                    <p className="font-black text-black text-l mt-1">🗺️ {informationData.route}</p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-2xl rounded-[20px] p-4 border border-neutral-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <p className="font-bold text-neutral-500 text-[10px] uppercase tracking-wider">Durasi</p>
                    <p className="font-black text-black text-l mt-1">⏱️ {informationData.duration}</p>
                  </div>
                  <div className="bg-black/20 backdrop-blur-2xl rounded-[20px] p-4 border border-neutral-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                    <p className="font-bold text-neutral-500 text-[10px] uppercase tracking-wider">Kondisi Cuaca</p>
                    <p className="font-black text-black text-l mt-0.5 leading-tight text-ellipsis overflow-hidden whitespace-nowrap">🌡️ {informationData.temperature}</p>
                  </div>
                </div>

                {/* DESCRIPTION BENTO BOX */}
                <div className="bg-black/20 backdrop-blur-2xl rounded-[24px] p-6 border border-neutral-200/60 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Destinasi</h3>
                  <p className="text-black leading-relaxed font-semibold text-l text-justify">
                    {informationData.description}
                  </p>
                </div>

                {/* INFOGRAFIS ALUR TIMELINE JALUR & MEETING POINT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/20 backdrop-blur-2xl border border-neutral-200/60 rounded-[24px] p-5 shadow-sm transition-all duration-300 hover:border-[#8C6239]/20">
                    <h4 className="text-xs font-black text-[#8C6239] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      📍 Titik Kumpul (Meeting Point)
                    </h4>
                    <div className="space-y-4 pl-1 relative border-l border-neutral-200 ml-2">
                      <div className="relative pl-4">
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-neutral-400 " />
                        <p className="font-black text-xs text-black">- Cawang Uki</p>
                      </div>
                      <div className="relative pl-4">
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-neutral-400 " />
                        <p className="font-black text-xs text-black">- Stasiun Bogor</p>
                      </div>
                      <div className="relative pl-4">
                        <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-[#8C6239]" />
                        <p className="font-black text-xs text-[#8C6239]">- Basecamp Gunung Gede</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-2xl border border-neutral-200/60 rounded-[24px] p-5 shadow-sm transition-all duration-300 hover:border-[#8C6239]/20">
                    <h4 className="text-xs font-black text-[#8C6239] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      🗺️ Pos Alur Pendakian Via Putri
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-xs font-bold text-black">
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🏁 Basecamp Utama Gede</span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🚩 Pos Simaksi </span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🚩 Legok Leunca</span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🚩 Buntunt Lutung</span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🚩 Pos Simaksi </span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🚩 Lawang Saketeng</span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🚩 Simpang Maleber</span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🚩 Surya Kencana Timur </span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>🚩 Surya Kencana Timur</span></div>
                      <div className="p-2.5  rounded-xl flex justify-between items-center"><span>⛰️ Puncak 2958 MDPL</span></div>
                    </div>
                  </div>
                </div>

                {/* FACILITIES: INCLUDE SECTION */}
                <div className="bg-black/20 backdrop-blur-2xl rounded-[24px] p-6 border border-neutral-200/60 shadow-sm">
                  <h3 className="text-[10px] font-black text-neutral-500 tracking-widest uppercase mb-4">
                  ✅ Include
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs font-semibold text-black">
                    {informationData.includes.map((inc, i) => (
                      <li key={i} className="flex gap-2.5 items-start hover:translate-x-1 transition-transform duration-200">
                        <span className="text-[#8C6239] font-black shrink-0">✓</span>
                        <span className="leading-tight">{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB: ITINERARY */}
            {activeTab === "ITINERARY" && (
              <div className="grid gap-4 md:grid-cols-3 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {itineraryData.map((dayData, index) => (
                  <div key={index} className="border border-neutral-200/60 rounded-[24px] p-6 bg-black/20 backdrop-blur-2xl shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="inline-block bg-[#8C6239] text-white px-3 py-1 rounded-full text-[15px] font-black tracking-widest mb-4 uppercase">
                      {dayData.day}
                    </div>
                    <div className="space-y-4 relative border-l border-neutral-200 pl-3 ml-1.5">
                      {dayData.activities.map((act, i) => (
                        <div key={i} className="text-xs relative group/item">
                          <div className="absolute -left-[18px] top-1 w-2 h-2 rounded-full  group-hover/item:bg-[#8C6239] transition-colors" />
                          <span className="font-black text-[#8C6239] tracking-wider text-[15px] block">{act.time}</span>
                          <p className="font-bold text-black mt-0.5 leading-tight">{act.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: ESSENTIAL */}
            {activeTab === "ESSENTIAL" && (
              <div className="border border-neutral-200/60 rounded-[24px] overflow-hidden bg-black/10 backdrop-blur-2xl shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="border-b border-neutral-200 px-6 py-4">
                  <h3 className="font-black text-black text-xl tracking-wide">Daftar Rekomendasi Perlengkapan Wajib Mandiri</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-l border-collapse">
                    <thead>
                      <tr className="bg-black/10 backdrop-blur-2xl text-neutral-500 font-black border-b border-neutral-200/60 uppercase text-[15px] tracking-wider">
                        <th className="py-3.5 px-4 w-12 text-center">NO</th>
                        <th className="py-3.5 px-4">NAMA BARANG WAJIB</th>
                        <th className="py-3.5 px-4 text-center w-24">KUANTITAS</th>
                        <th className="py-3.5 px-4 text-center ">CATATAN KHUSUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-bold text-black">
                      {essentialData.map((item, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 px-4 text-center text-neutral-500 font-bold border-r border-neutral-200/60">{item.no || i+1}</td>
                          <td className="py-3 px-4 text-black font-black">{item.item}</td>
                          <td className="py-3 px-4 text-center border-l border-r border-neutral-200/60">
                            <span className="px-2 py-0.5 rounded-md font-black text-[15px]">{item.qty}</span>
                          </td>
                          <td className="py-3 px-4 font-black text-center font-bold text-[15px]">{item.note || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: RULES */}
            {activeTab === "RULES" && (
              <div className="border border-neutral-200/60 rounded-[24px] p-6 bg-black/10 backdrop-blur-2xl shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <h3 className="text-sm font-black text-black tracking-wide mb-4 pb-2 border-b border-neutral-200">
                  Syarat & Ketentuan Open Trip
                </h3>
                <div className="space-y-2">
                  {rulesData.map((rule, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 rounded-xl hover:bg-neutral-50 transition-all duration-200 text-xs font-semibold text-black leading-relaxed">
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
              
              {/* GOOGLE MAPS CARD */}
              <div className="border border-neutral-200 rounded-[24px] p-1.5 bg-white/60 backdrop-blur-md shadow-sm h-[150px] overflow-hidden group">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15844.246473129593!2d106.9696001!3d-6.76239!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69b5962f9eb8cd%3A0x6b306a4b18471b05!2sTaman%20Nasional%20Gunung%20Gede%20Pangrango!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                  className="w-full h-full border-0 rounded-[18px] filter grayscale duration-500 group-hover:grayscale-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

              {/* BOOKING CARD GRID */}
              <div className="border border-neutral-300 bg-black/10 backdrop-blur-2xl rounded-[24px] p-5 shadow-sm relative overflow-hidden">
                
                {/* PREMIUM MOUNTAIN IMAGE (SEKARANG BERADA DI PALING ATAS DENGAN UKURAN SEDANG PROPORSIAL) */}
                <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-neutral-200/80 relative bg-neutral-100">
                  <img 
                    src="/images/GEDE2.jpg" 
                    alt="Gunung Gede Pangrango"
                    className="w-full h-full object-cover filter contrast-[1.01]"
                  />
                </div>

                {/* Header Info Destinasi */}
                <div className="text-center lg:text-left mb-3">
                  <h2 className="text-base font-black text-xl text-black tracking-tight">Gunung Gede 2958 MDPL</h2>
                  <p className="text-neutral-500 text-l font-bold -mt-0.5">Bogor, Jawa Barat</p>
                </div>

                {/* Badge Header Time Trip */}
                <div className="w-full bg-[#6F4E37] text-white py-1.5 rounded-full text-center text-[15px] font-black tracking-widest uppercase shadow-xs">
                  🗓️ Time Trip
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
      <p className={`text-[15px] font-black tracking-tighter whitespace-nowrap ${
        d.isFull ? "text-white" : "text-black"
      }`}>
        {d.date} {d.isFull && "(Close)"}
      </p>
    </div>
  ))}
</div>

                {/* Catatan Label Merah */}
                <p className="mt-2 text-[10px] font-black italic text-rose-600 text-center">
                  *Tanggal blok merah artinya sudah close / penuh
                </p>

                {/* Breakdown Invoice Rincian Harga */}
                <div className="mt-5 space-y-2 border-t border-dashed border-neutral-300 pt-4 text-xs font-black text-black">
                  <div className="flex justify-between">
                    <span className="font-bold text-neutral-500">Total Harga Trip / PAX</span>
                    <span>{informationData.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-neutral-500">Biaya Admin</span>
                    <span>RP 0.00</span>
                  </div>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 text-sm text-black">
                    <span>Total Harga</span>
                    <span className="text-[#8C6239]">{informationData.price}</span>
                  </div>
                </div>

                {/* Tombol Elips Oval Cokelat (Hover Putih-Teks Hitam) */}
                <div className="mt-5 flex flex-col items-center">
                  <button
                    onClick={() => window.open("https://wa.me/6281292548524", "_blank")}
                    className="w-[100%] bg-white text-black  border border-[#734A26] py-2.5 px-6 rounded-full font-black text-xs tracking-widest text-center shadow transform active:scale-95 transition-all duration-300 uppercase cursor-pointer"
                  >
                    KONFIRMASI
                  </button>
                  <p className="mt-2 text-[10px] text-black font-bold italic  text-center">
                    *Untuk booking trip silahkan konfirmasi selanjutnya
                  </p>
                </div>

              </div>

              {/* EXCLUDES SECTION */}
              <div className="border border-neutral-200/60 rounded-[20px] p-4 bg-black/20 backdrop-blur-2xl space-y-3 shadow-xs">
                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">❌ Exclude</h4>
                <ul className="space-y-1.5 text-xs font-bold text-black">
                  {informationData.excludes.map((exc, i) => (
                    <li key={i} className="flex gap-2 items-center"><span className="text-neutral-300">▪</span><span>{exc}</span></li>
                  ))}
                </ul>
              </div>

              {/* OPTIONAL SECTION */}
              <div className="border border-neutral-200/60 rounded-[20px] p-4 bg-black/10 backdrop-blur-2xl space-y-3 shadow-xs">
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">💡 Optional</h4>
                <ul className="space-y-2 text-[11px] font-bold text-black leading-tight">
                  {informationData.optionals.map((opt, i) => (
                    <li key={i} className="flex gap-2 items-start"><span className="text-[#8C6239]">▪</span><span>{opt}</span></li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
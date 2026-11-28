"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";

interface ItineraryEntry {
  day: number;
  startTime: string;
  endTime: string;
  activity: string;
}

interface EssentialEntry {
  no: number;
  itemName: string;
  quantity: string;
  note: string;
}

interface RuleEntry {
  no: number;
  rule: string;
}

interface TimeTripSlot {
  id: string;
  dateLabel: string;
  quota: number;
  sold?: boolean;
}

interface TripMeta {
  location?: string;
  elevation?: string;
  grade?: string;
  route?: string;
  duration?: string;
  quota?: string;
  mapsUrl?: string;
  documentationImages?: string[];
  documentationCaptions?: string[];
  timeTrips?: TimeTripSlot[];
  meetingPoints?: string[];
  trailPosts?: string[];
  includeItems?: string[];
  itineraryItems?: ItineraryEntry[];
  essentialItems?: EssentialEntry[];
  rulesItems?: RuleEntry[];
  includesText?: string;
  rulesText?: string;
}

interface TripProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  stock?: number;
  description: string;
  image: string;
  metaData?: TripMeta | null;
}

function extractEmbedSrc(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) return iframeMatch[1];
  return trimmed;
}

export default function DynamicOpenTripDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [product, setProduct] = useState<TripProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("INFORMATION");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [currentSlide1, setCurrentSlide1] = useState(0);
  const [currentSlide2, setCurrentSlide2] = useState(0);

  const tabs = ["INFORMATION", "ITINERARY", "ESSENTIAL", "RULES"];

  useEffect(() => {
    if (!slug) return;
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/catalog?category=TRIP&_t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        const found = (data.products || []).find(
          (p: TripProduct) => p.slug === slug
        );
        setProduct(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [slug]);

  const meta = (product?.metaData || {}) as TripMeta;
  const timeSlots = meta.timeTrips || [];

  useEffect(() => {
    const firstAvailable = timeSlots.find(
      (s) => !s.sold && Number(s.quota) > 0
    );
    if (firstAvailable && !selectedSlotId) {
      setSelectedSlotId(firstAvailable.id);
    }
  }, [timeSlots, selectedSlotId]);

  const activeSlot = useMemo(
    () => timeSlots.find((s) => s.id === selectedSlotId) || null,
    [timeSlots, selectedSlotId]
  );

  // Simpan pilihan jadwal ke localStorage agar bisa dibaca saat checkout & pengurangan kuota
  useEffect(() => {
    if (!product || !activeSlot) return;
    try {
      const raw = localStorage.getItem("alam_memanggil_selected_schedules");
      const map = raw ? JSON.parse(raw) : {};
      map[product.slug] = activeSlot.dateLabel;
      map[product.id] = activeSlot.dateLabel;
      localStorage.setItem(
        "alam_memanggil_selected_schedules",
        JSON.stringify(map)
      );
    } catch {
      // abaikan error storage
    }
  }, [product, activeSlot]);

  const docImages = meta.documentationImages || [];
  const docCaptions = meta.documentationCaptions || [];

  const slider1Cards = useMemo(() => {
    if (docImages.length === 0) return [];
    const half = Math.ceil(docImages.length / 2);
    return docImages.slice(0, half).map((src, i) => ({
      src,
      badge: i === 0 ? "SOROTAN UTAMA" : "DOKUMENTASI",
      caption: docCaptions[i] || product?.title || "Dokumentasi Trip",
    }));
  }, [docImages, docCaptions, product?.title]);

  const slider2Cards = useMemo(() => {
    if (docImages.length <= 1) return [];
    const half = Math.ceil(docImages.length / 2);
    return docImages.slice(half).map((src, i) => {
      const actualIdx = half + i;
      return {
        src,
        badge: i === 0 ? "MOMEN TRIP" : "DOKUMENTASI",
        caption: docCaptions[actualIdx] || product?.title || "Dokumentasi Trip",
      };
    });
  }, [docImages, docCaptions, product?.title]);

  useEffect(() => {
    if (slider1Cards.length <= 1) return;
    const t1 = setInterval(() => {
      setCurrentSlide1((prev) => (prev + 1) % slider1Cards.length);
    }, 4500);
    return () => clearInterval(t1);
  }, [slider1Cards.length]);

  useEffect(() => {
    if (slider2Cards.length <= 1) return;
    const t2 = setInterval(() => {
      setCurrentSlide2((prev) => (prev + 1) % slider2Cards.length);
    }, 5000);
    return () => clearInterval(t2);
  }, [slider2Cards.length]);

  const groupedItinerary = useMemo(() => {
    const items = meta.itineraryItems || [];
    const map = new Map<number, ItineraryEntry[]>();
    for (const item of items) {
      const d = Number(item.day) || 1;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [meta.itineraryItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm font-bold text-neutral-500 px-4 text-center">
        Memuat detail paket Open Trip...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm font-bold text-neutral-700 px-4 text-center">
        Paket Open Trip belum tersedia atau sudah dihapus oleh Admin.
      </div>
    );
  }

  const formattedPrice = `Rp ${new Intl.NumberFormat("id-ID").format(
    product.price
  )}/Pax`;
  const embedSrc = extractEmbedSrc(meta.mapsUrl);
  const meetingPoints = meta.meetingPoints || [];
  const trailPosts = meta.trailPosts || [];
  const includesList =
    meta.includeItems && meta.includeItems.length > 0
      ? meta.includeItems
      : (meta.includesText || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
  const essentialRows = meta.essentialItems || [];

  const rulesRows: RuleEntry[] =
    meta.rulesItems && meta.rulesItems.length > 0
      ? meta.rulesItems
      : (meta.rulesText || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((rule, idx) => ({ no: idx + 1, rule }));

  const hasAvailableSlot = timeSlots.some(
    (s) => !s.sold && Number(s.quota) > 0
  );
  const isTripSoldOut =
    (timeSlots.length > 0 && !hasAvailableSlot) ||
    (typeof product.stock === "number" && product.stock <= 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-neutral-900 font-sans antialiased text-xs md:text-sm selection:bg-[#8C6239]/20 selection:text-[#8C6239]">
      {/* TAB BAR */}
      <div className="sticky top-0 z-10 w-full bg-white/80 backdrop-blur-md py-2.5 sm:py-4 px-3 sm:px-4 flex justify-start border-b border-neutral-200/50">
        <div className="inline-flex max-w-full overflow-x-auto no-scrollbar relative rounded-full bg-neutral-200/80 p-1 shrink-0">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-3 sm:px-6 py-1.5 sm:py-2.5 text-[10px] md:text-xs font-black tracking-wider sm:tracking-widest rounded-full transition-all duration-300 cursor-pointer uppercase whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-[#6F4E37] text-white shadow"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-[1140px] px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-12">
        <div
          className={`grid gap-4 sm:gap-8 ${
            activeTab === "INFORMATION" ? "lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {/* KOLOM KIRI */}
          <div
            className={`${
              activeTab === "INFORMATION" ? "lg:col-span-2" : "col-span-1"
            } space-y-3.5 sm:space-y-6 min-w-0`}
          >
            {activeTab === "INFORMATION" && (
              <div className="space-y-3.5 sm:space-y-6">
                <div className="bg-neutral-200/80 rounded-[20px] sm:rounded-[28px] p-4 sm:p-8">
                  <h1 className="text-lg sm:text-2xl md:text-4xl font-black tracking-tight text-neutral-900 break-words leading-tight">
                    {product.title}
                  </h1>
                  <p className="mt-1.5 sm:mt-2 text-neutral-700 font-bold text-[11px] sm:text-xs flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>📍 {meta.location || "Indonesia"}</span>
                    {meta.elevation && (
                      <>
                        <span className="text-neutral-400">•</span>
                        <span>▲ {meta.elevation}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* 3 CARD BERJEJER DALAM 1 BARIS */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-neutral-200/80 rounded-[16px] sm:rounded-[20px] p-2.5 sm:p-4 min-w-0">
                    <p className="font-bold text-neutral-500 text-[8px] sm:text-[10px] uppercase tracking-wider truncate">
                      Jalur
                    </p>
                    <p className="font-black text-neutral-900 text-[11px] sm:text-sm mt-0.5 sm:mt-1 truncate">
                      🗺️ {meta.route || "-"}
                    </p>
                  </div>

                  <div className="bg-neutral-200/80 rounded-[16px] sm:rounded-[20px] p-2.5 sm:p-4 min-w-0">
                    <p className="font-bold text-neutral-500 text-[8px] sm:text-[10px] uppercase tracking-wider truncate">
                      Durasi
                    </p>
                    <p className="font-black text-neutral-900 text-[11px] sm:text-sm mt-0.5 sm:mt-1 truncate">
                      ⏱️ {meta.duration || "-"}
                    </p>
                  </div>

                  <div className="bg-neutral-200/80 rounded-[16px] sm:rounded-[20px] p-2.5 sm:p-4 min-w-0">
                    <p className="font-bold text-neutral-500 text-[8px] sm:text-[10px] uppercase tracking-wider truncate">
                      Grade
                    </p>
                    <p className="font-black text-[#6F4E37] text-[11px] sm:text-sm mt-0.5 sm:mt-1 truncate">
                      ⛰️ {meta.grade || "2"}/5
                    </p>
                  </div>
                </div>

                <div className="bg-neutral-200/80 rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-6">
                  <h3 className="text-[10px] sm:text-[11px] font-black text-neutral-600 uppercase tracking-widest mb-1.5 sm:mb-3">
                    Destinasi
                  </h3>
                  <p className="text-neutral-900 leading-relaxed font-medium text-[11px] sm:text-xs md:text-sm whitespace-pre-line break-words">
                    {product.description}
                  </p>
                </div>

                {/* MEETING POINT & POS ALUR BERJEJER 2 KOLOM */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-5">
                  <div className="bg-neutral-200/80 rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-6 min-w-0">
                    <h4 className="text-[9px] sm:text-[11px] font-black text-[#6F4E37] uppercase tracking-wider sm:tracking-widest mb-2 sm:mb-4 flex items-center gap-1">
                      <span>📍</span>
                      <span className="truncate">Meeting Point</span>
                    </h4>
                    {meetingPoints.length === 0 ? (
                      <p className="text-[10px] sm:text-xs text-neutral-500 font-medium">
                        Belum ditambahkan oleh Admin.
                      </p>
                    ) : (
                      <ul className="space-y-1.5 sm:space-y-2.5 text-[11px] sm:text-xs font-bold text-neutral-900">
                        {meetingPoints.map((mp, i) => (
                          <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                            <span className="text-[#6F4E37] font-black shrink-0">
                              •
                            </span>
                            <span className="break-words leading-snug">{mp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="bg-neutral-200/80 rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-6 min-w-0">
                    <h4 className="text-[9px] sm:text-[11px] font-black text-[#6F4E37] uppercase tracking-wider sm:tracking-widest mb-2 sm:mb-4 flex items-center gap-1">
                      <span>🚩</span>
                      <span className="truncate">Pos Alur</span>
                    </h4>
                    {trailPosts.length === 0 ? (
                      <p className="text-[10px] sm:text-xs text-neutral-500 font-medium">
                        Belum ditambahkan oleh Admin.
                      </p>
                    ) : (
                      <ul className="space-y-1.5 sm:space-y-2.5 text-[11px] sm:text-xs font-bold text-neutral-900">
                        {trailPosts.map((post, i) => (
                          <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                            <span className="text-rose-600 font-black shrink-0">
                              ▸
                            </span>
                            <span className="break-words leading-snug">{post}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {includesList.length > 0 && (
                  <div className="bg-neutral-200/80 rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-6">
                    <h3 className="text-[10px] sm:text-[11px] font-black text-neutral-700 tracking-widest uppercase mb-2.5 sm:mb-4 flex items-center gap-1.5">
                      <span className="text-emerald-700">☑</span>
                      <span>Include</span>
                    </h3>
                    <ul className="grid grid-cols-2 gap-x-3 sm:gap-x-8 gap-y-1.5 sm:gap-y-3 text-[11px] sm:text-xs font-bold text-neutral-900">
                      {includesList.map((inc, i) => (
                        <li key={i} className="flex gap-1.5 sm:gap-2.5 items-start">
                          <span className="text-[#6F4E37] font-black shrink-0">
                            ✓
                          </span>
                          <span className="leading-snug break-words">{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB ITINERARY */}
            {activeTab === "ITINERARY" && (
              <div className="space-y-6">
                {groupedItinerary.length === 0 ? (
                  <div className="border border-neutral-200 rounded-[24px] p-6 bg-neutral-100 text-xs font-semibold text-neutral-600">
                    Belum ada jadwal itinerary yang ditambahkan oleh Admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6">
                    {groupedItinerary.map(([dayNum, entries]) => (
                      <div
                        key={dayNum}
                        className="rounded-[18px] sm:rounded-[28px] bg-neutral-200/80 p-3 sm:p-6 space-y-2.5 sm:space-y-5"
                      >
                        <div className="inline-flex rounded-full bg-[#6F4E37] px-3 sm:px-5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black tracking-widest text-white uppercase">
                          DAY {dayNum}
                        </div>

                        <div className="space-y-2.5 sm:space-y-4">
                          {entries.map((row, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <p className="text-[10px] sm:text-xs font-black text-[#6F4E37]">
                                {row.startTime}
                                {row.endTime ? ` - ${row.endTime}` : ""}
                              </p>
                              <p className="text-[11px] sm:text-xs font-bold text-neutral-900 leading-snug break-words">
                                {row.activity}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB ESSENTIAL */}
            {activeTab === "ESSENTIAL" && (
              <div className="border border-neutral-200 rounded-[24px] overflow-hidden bg-neutral-200/70">
                <div className="px-4 sm:px-6 py-4 sm:py-5 bg-neutral-200/90 border-b border-neutral-300/70">
                  <h3 className="font-black text-neutral-900 text-base sm:text-lg md:text-xl tracking-wide">
                    Daftar Rekomendasi Perlengkapan Wajib Mandiri
                  </h3>
                </div>

                {essentialRows.length === 0 ? (
                  <p className="p-6 text-xs font-semibold text-neutral-600">
                    Belum ada daftar perlengkapan wajib yang ditambahkan oleh Admin.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-300/80 text-[11px] font-black uppercase tracking-wider text-neutral-700">
                          <th className="py-3.5 px-3.5 sm:px-5">NO</th>
                          <th className="py-3.5 px-3.5 sm:px-5">
                            NAMA BARANG WAJIB
                          </th>
                          <th className="py-3.5 px-3.5 sm:px-5 text-center">
                            KUANTITAS
                          </th>
                          <th className="py-3.5 px-3.5 sm:px-5 text-center">
                            CATATAN KHUSUS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-300/60 text-xs font-bold text-neutral-900">
                        {essentialRows.map((row, i) => (
                          <tr key={i} className="hover:bg-white/40 transition">
                            <td className="py-3.5 px-3.5 sm:px-5 text-neutral-600">
                              {row.no || i + 1}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-5 font-black">
                              {row.itemName}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-5 text-center">
                              {row.quantity}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-5 text-center">
                              {row.note || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB RULES TERPISAH: NO & KETENTUAN */}
            {activeTab === "RULES" && (
              <div className="border border-neutral-200 rounded-[24px] overflow-hidden bg-neutral-200/70">
                <div className="px-4 sm:px-6 py-4 sm:py-5 bg-neutral-200/90 border-b border-neutral-300/70">
                  <h3 className="font-black text-neutral-900 text-base sm:text-lg md:text-xl tracking-wide">
                    Syarat & Ketentuan Open Trip
                  </h3>
                </div>

                {rulesRows.length === 0 ? (
                  <p className="p-6 text-xs font-semibold text-neutral-600">
                    Belum ada syarat & ketentuan yang ditambahkan oleh Admin.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-300/80 text-[11px] font-black uppercase tracking-wider text-neutral-700">
                          <th className="py-3.5 px-3.5 sm:px-5 w-16 sm:w-20">
                            NO
                          </th>
                          <th className="py-3.5 px-3.5 sm:px-5">KETENTUAN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-300/60 text-xs font-bold text-neutral-900">
                        {rulesRows.map((row, i) => (
                          <tr key={i} className="hover:bg-white/40 transition">
                            <td className="py-3.5 px-3.5 sm:px-5 text-neutral-600">
                              {row.no || i + 1}
                            </td>
                            <td className="py-3.5 px-3.5 sm:px-5 leading-relaxed">
                              {row.rule}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* KOLOM KANAN */}
          {activeTab === "INFORMATION" && (
            <div className="lg:col-span-1 space-y-3.5 sm:space-y-5 min-w-0">
              {embedSrc && (
                <div className="border border-neutral-200 bg-white rounded-[18px] sm:rounded-[24px] overflow-hidden shadow-sm">
                  <iframe
                    src={embedSrc}
                    title={`Maps ${product.title}`}
                    className="w-full h-36 sm:h-44 border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="border border-neutral-200 bg-neutral-100/90 rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-5 shadow-sm">
                {product.image && (
                  <div className="w-full h-36 sm:h-44 rounded-xl overflow-hidden mb-3 sm:mb-4 border border-neutral-200 bg-white">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="mb-2.5 sm:mb-3">
                  <h2 className="text-sm sm:text-lg font-black text-neutral-900 tracking-tight break-words">
                    {product.title}
                  </h2>
                  <p className="text-neutral-500 text-[11px] sm:text-xs font-bold mt-0.5">
                    {meta.location || "Indonesia"}
                  </p>
                </div>

                <div className="w-full bg-[#6F4E37] text-white py-1.5 sm:py-2 rounded-full text-center text-[11px] sm:text-xs font-black tracking-widest uppercase">
                  🗓️ TIME TRIP
                </div>

                {timeSlots.length === 0 ? (
                  <p className="mt-2.5 text-[11px] font-semibold text-neutral-500 text-center">
                    Jadwal keberangkatan segera diinfokan.
                  </p>
                ) : (
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:gap-2">
                    {timeSlots.map((slot) => {
                      const isSold =
                        Boolean(slot.sold) || Number(slot.quota) <= 0;
                      const isSelected = selectedSlotId === slot.id && !isSold;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isSold}
                          onClick={() => !isSold && setSelectedSlotId(slot.id)}
                          className={`rounded-xl py-1.5 sm:py-2 px-2 text-center border transition ${
                            isSold
                              ? "border-red-600 bg-red-600 text-white cursor-not-allowed"
                              : isSelected
                              ? "border-[#6F4E37] bg-[#6F4E37] text-white shadow cursor-pointer"
                              : "border-neutral-300 bg-white text-neutral-900 hover:border-[#6F4E37] cursor-pointer"
                          }`}
                        >
                          <p className="text-[10px] sm:text-[11px] font-black leading-tight">
                            {slot.dateLabel}
                          </p>
                          <p
                            className={`text-[9px] sm:text-[10px] font-bold mt-0.5 ${
                              isSold
                                ? "text-white uppercase tracking-wider"
                                : isSelected
                                ? "text-amber-100"
                                : "text-neutral-500"
                            }`}
                          >
                            {isSold ? "SOLD" : `Sisa ${slot.quota} kuota`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                <p className="mt-2 text-[10px] font-bold italic text-rose-600 text-center">
                  *Blok merah bertanda SOLD artinya kuota sudah penuh
                </p>

                <div className="mt-4 sm:mt-5 border-t border-dashed border-neutral-300 pt-3 sm:pt-4 flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-bold text-neutral-600">
                    Harga Trip / Pax
                  </span>
                  <span className="text-xs sm:text-base font-black text-[#6F4E37]">
                    {formattedPrice}
                  </span>
                </div>

                <div className="mt-4 sm:mt-5 flex flex-col items-center">
                  {isTripSoldOut ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 sm:py-2.5 px-6 rounded-full font-black text-xs tracking-widest uppercase bg-red-600 text-white cursor-not-allowed"
                    >
                      KUOTA PENUH / SOLD
                    </button>
                  ) : (
                    <AddToCartButton
                      title={product.title}
                      slug={product.slug}
                      category="TRIP"
                      price={product.price}
                      image={product.image}
                      description={product.description}
                      selectedSchedule={activeSlot?.dateLabel}
                      label="KONFIRMASI"
                    />
                  )}
                  <p className="mt-2 text-[10px] text-neutral-500 font-semibold italic text-center">
                    *Total harga & jumlah pax diatur di keranjang
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* GALERI DOKUMENTASI */}
        {activeTab === "INFORMATION" &&
          (slider1Cards.length > 0 || slider2Cards.length > 0) && (
            <div className="space-y-3 sm:space-y-5 pt-4 sm:pt-8 border-t border-neutral-200/70">
              <div>
                <h2 className="text-xs sm:text-base font-black tracking-wider text-neutral-900 uppercase">
                  GALERI DOKUMENTASI
                </h2>
                <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 font-medium">
                  Keseruan dan keindahan panorama jalur pendakian {product.title}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                {slider1Cards.length > 0 && (
                  <div className="relative rounded-[20px] sm:rounded-[28px] overflow-hidden h-[200px] sm:h-[320px] md:h-[360px] bg-neutral-900 shadow-md">
                    {slider1Cards.map((card, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-700 ${
                          idx === currentSlide1
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none"
                        }`}
                      >
                        <img
                          src={card.src}
                          alt={card.caption}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                        <div className="absolute bottom-3.5 sm:bottom-5 left-3.5 sm:left-5 right-3.5 sm:right-5 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <span className="inline-block bg-black/65 backdrop-blur-xs text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full mb-1">
                              {card.badge}
                            </span>
                            <p className="text-white font-black text-xs sm:text-base md:text-lg leading-snug break-words">
                              {card.caption}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {slider1Cards.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={() => setCurrentSlide1(dotIdx)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                  dotIdx === currentSlide1
                                    ? "w-5 bg-white"
                                    : "w-1.5 bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {slider2Cards.length > 0 && (
                  <div className="relative rounded-[20px] sm:rounded-[28px] overflow-hidden h-[200px] sm:h-[320px] md:h-[360px] bg-neutral-900 shadow-md">
                    {slider2Cards.map((card, idx) => (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-700 ${
                          idx === currentSlide2
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none"
                        }`}
                      >
                        <img
                          src={card.src}
                          alt={card.caption}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                        <div className="absolute bottom-3.5 sm:bottom-5 left-3.5 sm:left-5 right-3.5 sm:right-5 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <span className="inline-block bg-black/65 backdrop-blur-xs text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full mb-1">
                              {card.badge}
                            </span>
                            <p className="text-white font-black text-xs sm:text-base md:text-lg leading-snug break-words">
                              {card.caption}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {slider2Cards.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={() => setCurrentSlide2(dotIdx)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                  dotIdx === currentSlide2
                                    ? "w-5 bg-white"
                                    : "w-1.5 bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
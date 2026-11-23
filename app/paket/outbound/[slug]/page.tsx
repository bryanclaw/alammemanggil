"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";

interface RuleEntry {
  no: number;
  rule: string;
}

interface OutboundMeta {
  location?: string;
  documentationImages?: string[];
  documentationCaptions?: string[];
  unavailableDates?: string[];
  bookedDates?: string[];
  servicesItems?: string[];
  advantagesItems?: string[];
  includeItems?: string[];
  rulesItems?: RuleEntry[];
  includesText?: string;
  rulesText?: string;
}

interface OutboundProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  description: string;
  image: string;
  metaData?: OutboundMeta | null;
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatDateKey(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function getDatesInRange(startStr: string, endStr: string): string[] {
  if (!startStr) return [];
  const start = parseDateKey(startStr);
  const end = parseDateKey(endStr || startStr);
  const minDate = start <= end ? start : end;
  const maxDate = start <= end ? end : start;

  const result: string[] = [];
  const cursor = new Date(minDate);
  while (cursor <= maxDate) {
    result.push(
      formatDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export default function DynamicOutboundDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [product, setProduct] = useState<OutboundProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"INFORMATION" | "RULES">(
    "INFORMATION"
  );

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [calendarWarning, setCalendarWarning] = useState<string>("");

  const [currentSlide1, setCurrentSlide1] = useState(0);
  const [currentSlide2, setCurrentSlide2] = useState(0);

  useEffect(() => {
    if (!slug) return;
    const fetchOutbound = async () => {
      try {
        const res = await fetch("/api/catalog?category=OUTBOUND", {
          cache: "no-store",
        });
        const data = await res.json();
        const found = (data.products || []).find(
          (p: OutboundProduct) => p.slug === slug
        );
        setProduct(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOutbound();
  }, [slug]);

  const meta = (product?.metaData || {}) as OutboundMeta;
  const unavailableSet = useMemo(
    () => new Set(meta.unavailableDates || []),
    [meta.unavailableDates]
  );
  const bookedSet = useMemo(
    () => new Set(meta.bookedDates || []),
    [meta.bookedDates]
  );

  // Jika tanggal yang sedang dipilih berubah menjadi terbooking/diblokir, reset ke tanggal tersedia terdekat
  useEffect(() => {
    if (!product) return;
    const isCurrentBlocked =
      (startDate && (unavailableSet.has(startDate) || bookedSet.has(startDate))) ||
      (endDate && (unavailableSet.has(endDate) || bookedSet.has(endDate)));

    if (startDate && !isCurrentBlocked) return;

    const base = new Date(viewYear, viewMonth, 1);
    for (let offset = 0; offset < 60; offset++) {
      const candidate = new Date(base);
      candidate.setDate(base.getDate() + offset);
      const key = formatDateKey(
        candidate.getFullYear(),
        candidate.getMonth(),
        candidate.getDate()
      );
      if (!unavailableSet.has(key) && !bookedSet.has(key)) {
        setStartDate(key);
        setEndDate(key);
        return;
      }
    }
    setStartDate("");
    setEndDate("");
  }, [product, startDate, endDate, viewYear, viewMonth, unavailableSet, bookedSet]);

  const activeRangeDates = useMemo(() => {
    if (!startDate) return [];
    return getDatesInRange(startDate, endDate || startDate);
  }, [startDate, endDate]);

  const daysCount = Math.max(1, activeRangeDates.length);

  const scheduleSummaryLabel = useMemo(() => {
    if (!startDate) return "";
    const effectiveEnd = endDate || startDate;
    if (startDate === effectiveEnd) {
      return `${startDate} (1 Hari)`;
    }
    return `${startDate} s/d ${effectiveEnd} (${daysCount} Hari)`;
  }, [startDate, endDate, daysCount]);

  useEffect(() => {
    if (!product || !startDate) return;
    const effectiveEnd = endDate || startDate;
    try {
      const rawSchedules = localStorage.getItem(
        "alam_memanggil_selected_schedules"
      );
      const schedMap = rawSchedules ? JSON.parse(rawSchedules) : {};
      schedMap[product.slug] = { dateLabel: scheduleSummaryLabel };
      localStorage.setItem(
        "alam_memanggil_selected_schedules",
        JSON.stringify(schedMap)
      );

      const rawOutbound = localStorage.getItem(
        "alam_memanggil_outbound_bookings"
      );
      const outboundMap = rawOutbound ? JSON.parse(rawOutbound) : {};
      outboundMap[product.slug] = {
        startDate,
        endDate: effectiveEnd,
        days: daysCount,
        dates: activeRangeDates,
        label: scheduleSummaryLabel,
      };
      localStorage.setItem(
        "alam_memanggil_outbound_bookings",
        JSON.stringify(outboundMap)
      );
    } catch {
      // abaikan error storage
    }
  }, [
    product,
    startDate,
    endDate,
    daysCount,
    activeRangeDates,
    scheduleSummaryLabel,
  ]);

  const handleSelectCalendarDate = (clickedKey: string) => {
    setCalendarWarning("");
    if (unavailableSet.has(clickedKey) || bookedSet.has(clickedKey)) return;

    if (!startDate || (startDate && endDate && startDate !== endDate)) {
      setStartDate(clickedKey);
      setEndDate(clickedKey);
      return;
    }

    if (clickedKey < startDate) {
      const range = getDatesInRange(clickedKey, startDate);
      const hasConflict = range.some(
        (d) => unavailableSet.has(d) || bookedSet.has(d)
      );
      if (hasConflict) {
        setCalendarWarning(
          "Terdapat tanggal tidak tersedia / terbooking di dalam rentang tersebut."
        );
        setStartDate(clickedKey);
        setEndDate(clickedKey);
        return;
      }
      setEndDate(startDate);
      setStartDate(clickedKey);
    } else {
      const range = getDatesInRange(startDate, clickedKey);
      const hasConflict = range.some(
        (d) => unavailableSet.has(d) || bookedSet.has(d)
      );
      if (hasConflict) {
        setCalendarWarning(
          "Terdapat tanggal tidak tersedia / terbooking di dalam rentang tersebut."
        );
        setStartDate(clickedKey);
        setEndDate(clickedKey);
        return;
      }
      setEndDate(clickedKey);
    }
  };

  const docImages = meta.documentationImages || [];
  const docCaptions = meta.documentationCaptions || [];

  const slider1Cards = useMemo(() => {
    if (docImages.length === 0) return [];
    const half = Math.ceil(docImages.length / 2);
    return docImages.slice(0, half).map((src, i) => ({
      src,
      badge: i === 0 ? "SOROTAN UTAMA" : "DOKUMENTASI",
      caption: docCaptions[i] || product?.title || "Dokumentasi Outbound",
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
        caption:
          docCaptions[actualIdx] || product?.title || "Dokumentasi Outbound",
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

  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm font-bold text-neutral-500">
        Memuat detail paket Outbound...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-sm font-bold text-neutral-700">
        Paket Outbound belum tersedia atau sudah dihapus oleh Admin.
      </div>
    );
  }

  const formattedPricePerDay = `Rp ${new Intl.NumberFormat("id-ID").format(
    product.price
  )}/Hari`;
  const estimatedPrice = `Rp ${new Intl.NumberFormat("id-ID").format(
    product.price * daysCount
  )}`;

  const servicesList = meta.servicesItems || [];
  const advantagesList = meta.advantagesItems || [];
  const includesList =
    meta.includeItems && meta.includeItems.length > 0
      ? meta.includeItems
      : (meta.includesText || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

  const rulesRows: RuleEntry[] =
    meta.rulesItems && meta.rulesItems.length > 0
      ? meta.rulesItems
      : (meta.rulesText || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((rule, idx) => ({ no: idx + 1, rule }));

  const rangeSet = new Set(activeRangeDates);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans antialiased text-xs md:text-sm selection:bg-[#8C6239]/20 selection:text-[#8C6239]">
      <div className="sticky top-0 z-10 w-full bg-white/80 backdrop-blur-md py-4 px-4 flex justify-left border-b border-neutral-200/50">
        <div className="inline-flex relative rounded-full bg-neutral-200/80 p-1">
          {(["INFORMATION", "RULES"] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-2.5 text-[10px] md:text-xs font-black tracking-widest rounded-full transition-all duration-300 cursor-pointer uppercase ${
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

      <main className="mx-auto max-w-[1140px] px-4 py-8 space-y-12">
        <div
          className={`grid gap-8 ${
            activeTab === "INFORMATION" ? "lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          <div
            className={`${
              activeTab === "INFORMATION" ? "lg:col-span-2" : "col-span-1"
            } space-y-6`}
          >
            {activeTab === "INFORMATION" && (
              <div className="space-y-6">
                <div className="bg-neutral-200/80 rounded-[28px] p-7">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900">
                    {product.title}
                  </h1>
                  {meta.location && (
                    <p className="mt-1.5 text-xs font-bold text-[#6F4E37]">
                      📍 {meta.location}
                    </p>
                  )}
                  <p className="mt-3 text-neutral-800 leading-relaxed font-medium text-xs md:text-sm whitespace-pre-line">
                    {product.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-neutral-200/80 rounded-[24px] p-6">
                    <h2 className="text-xs font-black text-[#6F4E37] uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span>📋</span>
                      <span>Layanan Kami</span>
                    </h2>
                    {servicesList.length === 0 ? (
                      <p className="text-xs text-neutral-500 font-medium">
                        Belum ditambahkan oleh Admin.
                      </p>
                    ) : (
                      <ul className="space-y-3 text-xs font-bold text-neutral-900">
                        {servicesList.map((srv, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#6F4E37] mt-1.5 shrink-0" />
                            <span>{srv}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="bg-neutral-200/80 rounded-[24px] p-6">
                    <h2 className="text-xs font-black text-[#6F4E37] uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span>⭐</span>
                      <span>Keunggulan Kami</span>
                    </h2>
                    {advantagesList.length === 0 ? (
                      <p className="text-xs text-neutral-500 font-medium">
                        Belum ditambahkan oleh Admin.
                      </p>
                    ) : (
                      <ul className="space-y-3 text-xs font-bold text-neutral-900">
                        {advantagesList.map((adv, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="text-amber-600 font-black shrink-0">
                              ✦
                            </span>
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {includesList.length > 0 && (
                  <div className="bg-neutral-200/80 rounded-[24px] p-6">
                    <h3 className="text-[11px] font-black text-neutral-700 tracking-widest uppercase mb-4 flex items-center gap-1.5">
                      <span className="text-emerald-700">☑</span>
                      <span>Include</span>
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs font-bold text-neutral-900">
                      {includesList.map((inc, i) => (
                        <li key={i} className="flex gap-2.5 items-start">
                          <span className="text-[#6F4E37] font-black shrink-0">
                            ✓
                          </span>
                          <span className="leading-snug">{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "RULES" && (
              <div className="border border-neutral-200 rounded-[24px] overflow-hidden bg-neutral-200/70">
                <div className="px-6 py-5 bg-neutral-200/90 border-b border-neutral-300/70">
                  <h3 className="font-black text-neutral-900 text-lg md:text-xl tracking-wide">
                    Syarat & Ketentuan Outbound
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
                          <th className="py-3.5 px-5 w-20">NO</th>
                          <th className="py-3.5 px-5">KETENTUAN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-300/60 text-xs font-bold text-neutral-900">
                        {rulesRows.map((row, i) => (
                          <tr key={i} className="hover:bg-white/40 transition">
                            <td className="py-3.5 px-5 text-neutral-600">
                              {row.no || i + 1}
                            </td>
                            <td className="py-3.5 px-5 leading-relaxed">
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

          {activeTab === "INFORMATION" && (
            <div className="lg:col-span-1">
              <div className="border border-neutral-200 bg-neutral-100/90 rounded-[24px] p-5 shadow-sm">
                {product.image && (
                  <div className="w-full h-44 rounded-xl overflow-hidden mb-4 border border-neutral-200 bg-white">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="mb-3">
                  <h2 className="text-lg font-black text-neutral-900 tracking-tight">
                    {product.title}
                  </h2>
                  {meta.location && (
                    <p className="text-neutral-500 text-xs font-bold mt-0.5">
                      {meta.location}
                    </p>
                  )}
                </div>

                <div className="w-full bg-[#6F4E37] text-white py-2 rounded-full text-center text-xs font-black tracking-widest uppercase flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>KALENDER JADWAL</span>
                </div>

                <p className="mt-2 text-[10px] font-semibold text-neutral-600 text-center">
                  Klik tanggal mulai lalu klik tanggal akhir (seperti check-in & check-out) untuk event &gt; 1 hari
                </p>

                <div className="mt-2.5 bg-white border border-neutral-200 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-neutral-100 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-neutral-700" />
                    </button>
                    <span className="text-xs font-black text-neutral-900">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-neutral-100 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-700" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-neutral-400 mb-1">
                    {["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"].map((h) => (
                      <div key={h}>{h}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {calendarCells.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="h-7" />;
                      }
                      const key = formatDateKey(viewYear, viewMonth, day);
                      const isBlocked = unavailableSet.has(key);
                      const isBooked = bookedSet.has(key);
                      const isDisabled = isBlocked || isBooked;
                      const isInRange = rangeSet.has(key) && !isDisabled;
                      const isEndpoint =
                        !isDisabled && (key === startDate || key === endDate);

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectCalendarDate(key)}
                          title={
                            isBlocked
                              ? "Tidak tersedia (diblokir admin)"
                              : isBooked
                              ? "Sudah terbooking"
                              : `Pilih ${key}`
                          }
                          className={`h-7 rounded-lg text-[11px] font-black transition ${
                            isBlocked
                              ? "bg-red-600 text-white cursor-not-allowed line-through"
                              : isBooked
                              ? "bg-amber-500 text-white cursor-not-allowed"
                              : isEndpoint
                              ? "bg-[#6F4E37] text-white shadow cursor-pointer"
                              : isInRange
                              ? "bg-[#6F4E37]/25 text-[#6F4E37] cursor-pointer"
                              : "bg-neutral-100 text-neutral-800 hover:bg-amber-100 cursor-pointer"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {calendarWarning && (
                    <p className="mt-2 text-[10px] font-bold text-red-600 text-center">
                      {calendarWarning}
                    </p>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-neutral-100 space-y-1 text-[10px] font-bold">
                    <div className="flex items-center justify-between text-neutral-800">
                      <span>Durasi Dipilih:</span>
                      <span className="font-black text-[#6F4E37]">
                        {daysCount} Hari
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-600">
                      <span>Rentang Tanggal:</span>
                      <span className="font-bold">
                        {startDate
                          ? `${startDate} → ${endDate || startDate}`
                          : "-"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <span className="w-2.5 h-2.5 rounded-xs bg-red-600" />
                        Tidak Tersedia
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                        Terbooking
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-dashed border-neutral-300 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-600">
                      Harga Jasa / Hari
                    </span>
                    <span className="text-base font-black text-[#6F4E37]">
                      {formattedPricePerDay}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-600">
                    <span>Subtotal ({daysCount} Hari)</span>
                    <span className="font-black text-neutral-900">
                      {estimatedPrice}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col items-center">
                  <AddToCartButton
                    title={product.title}
                    slug={product.slug}
                    category="OUTBOUND"
                    price={product.price}
                    image={product.image}
                    description={product.description}
                    label="KONFIRMASI"
                    selectedSchedule={scheduleSummaryLabel}
                  />
                  <p className="mt-2 text-[10px] text-neutral-500 font-semibold italic text-center">
                    *Total pembayaran akhir diatur di keranjang
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTab === "INFORMATION" &&
          (slider1Cards.length > 0 || slider2Cards.length > 0) && (
            <div className="space-y-5 pt-8 border-t border-neutral-200/70">
              <div>
                <h2 className="text-sm md:text-base font-black tracking-wider text-neutral-900 uppercase">
                  GALERI DOKUMENTASI
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                  Dokumentasi kegiatan dan proyek {product.title}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {slider1Cards.length > 0 && (
                  <div className="relative rounded-[28px] overflow-hidden h-[320px] md:h-[360px] bg-neutral-900 shadow-md">
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
                        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                          <div>
                            <span className="inline-block bg-black/65 backdrop-blur-xs text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full mb-1.5">
                              {card.badge}
                            </span>
                            <p className="text-white font-black text-base md:text-lg leading-snug">
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
                  <div className="relative rounded-[28px] overflow-hidden h-[320px] md:h-[360px] bg-neutral-900 shadow-md">
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
                        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                          <div>
                            <span className="inline-block bg-black/65 backdrop-blur-xs text-white text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full mb-1.5">
                              {card.badge}
                            </span>
                            <p className="text-white font-black text-base md:text-lg leading-snug">
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
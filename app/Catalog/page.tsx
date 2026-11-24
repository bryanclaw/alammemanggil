"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Backpack,
  Footprints,
  Shirt,
  Tent,
  Flashlight,
  Package,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Loader2,
  SlidersHorizontal,
  Calendar,
  ArrowUpRight,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type RentalCategoryKey =
  | "ALL"
  | "TAS_CARRIER"
  | "ALAS_KAKI"
  | "PAKAIAN"
  | "PERLENGKAPAN_TIDUR_TENDA"
  | "PENERANGAN"
  | "LAINNYA";

interface RentalRuleEntry {
  no: number;
  rule: string;
}

interface RentalMeta {
  nightsDefault?: number;
  conditionNote?: string;
  rulesItems?: RentalRuleEntry[];
  rulesText?: string;
  unavailableDates?: string[];
  bookedDates?: string[];
}

interface RentalProduct {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory?: string | null;
  price: number;
  description: string;
  image: string;
  stock: number;
  metaData?: RentalMeta | null;
}

const RENTAL_CATEGORIES: {
  key: RentalCategoryKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "ALL", label: "Semua Alat", shortLabel: "Semua", icon: Sparkles },
  {
    key: "TAS_CARRIER",
    label: "Tas dan Carrier",
    shortLabel: "Tas & Carrier",
    icon: Backpack,
  },
  {
    key: "ALAS_KAKI",
    label: "Alas Kaki",
    shortLabel: "Alas Kaki",
    icon: Footprints,
  },
  { key: "PAKAIAN", label: "Pakaian", shortLabel: "Pakaian", icon: Shirt },
  {
    key: "PERLENGKAPAN_TIDUR_TENDA",
    label: "Perlengkapan Tidur dan Tenda",
    shortLabel: "Tidur & Tenda",
    icon: Tent,
  },
  {
    key: "PENERANGAN",
    label: "Penerangan",
    shortLabel: "Penerangan",
    icon: Flashlight,
  },
  { key: "LAINNYA", label: "Lainnya", shortLabel: "Lainnya", icon: Package },
];

const FALLBACK_RENTAL_RULES: RentalRuleEntry[] = [
  {
    no: 1,
    rule: "Durasi sewa dihitung per malam (24 jam sejak waktu pengambilan/pengiriman sesuai kesepakatan).",
  },
  {
    no: 2,
    rule: "Pengambilan alat maksimal H-1 dan pengembalian maksimal H+1 dari jadwal sewa (atau tepat hari H / tanggal sewa).",
  },
  {
    no: 3,
    rule: "Penyewa wajib menyertakan identitas valid (KTP/SIM) serta memastikan kondisi fisik alat saat diterima bersama tim Alam Memanggil.",
  },
  {
    no: 4,
    rule: "Segala bentuk kerusakan, sobek, patah, atau kehilangan alat selama masa sewa menjadi tanggung jawab penyewa sesuai tingkat kerusakan atau biaya penggantian.",
  },
  {
    no: 5,
    rule: "Keterlambatan pengembalian melewati batas waktu dikenakan denda per malam/hari sesuai tarif sewa paket.",
  },
];

const MONTH_NAMES_ID = [
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

const DAY_HEADERS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function toIsoDate(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysIso(iso: string, deltaDays: number): string {
  const dt = parseIsoDate(iso);
  if (!dt) return iso;
  dt.setDate(dt.getDate() + deltaDays);
  return toIsoDate(dt);
}

function diffDaysIso(startIso: string, endIso: string): number {
  const a = parseIsoDate(startIso);
  const b = parseIsoDate(endIso);
  if (!a || !b) return 0;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

function clampIsoDate(targetIso: string, minIso: string, maxIso: string): string {
  if (!parseIsoDate(targetIso)) return minIso;
  if (parseIsoDate(minIso) && targetIso < minIso) return minIso;
  if (parseIsoDate(maxIso) && targetIso > maxIso) return maxIso;
  return targetIso;
}

function expandDateRangeIso(startIso: string, endIso: string): string[] {
  const a = parseIsoDate(startIso);
  const b = parseIsoDate(endIso);
  if (!a || !b) return [];
  const minD = a <= b ? a : b;
  const maxD = a <= b ? b : a;
  const out: string[] = [];
  const cur = new Date(minD);
  while (cur <= maxD) {
    out.push(toIsoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function getTodayIso(): string {
  return toIsoDate(new Date());
}

function formatShortDateId(iso: string): string {
  const dt = parseIsoDate(iso);
  if (!dt) return iso;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

function getCategoryLabel(subCat?: string | null): string {
  const found = RENTAL_CATEGORIES.find((c) => c.key === subCat);
  return found ? found.label : "Lainnya";
}

function getRulesFromProduct(item: RentalProduct): RentalRuleEntry[] {
  const meta = (item.metaData || {}) as RentalMeta;
  if (Array.isArray(meta.rulesItems) && meta.rulesItems.length > 0) {
    return meta.rulesItems
      .filter((r) => r && String(r.rule || "").trim() !== "")
      .map((r, idx) => ({ no: Number(r.no) || idx + 1, rule: String(r.rule) }));
  }
  if (typeof meta.rulesText === "string" && meta.rulesText.trim() !== "") {
    const lines = meta.rulesText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0) {
      return lines.map((rule, idx) => ({ no: idx + 1, rule }));
    }
  }
  return FALLBACK_RENTAL_RULES;
}

export interface RentalCalculationSummary {
  rentalStartDate: string;
  rentalEndDate: string;
  pickupDate: string;
  returnDate: string;
  baseNights: number;
  extraChargeNights: number;
  totalBilledNights: number;
  qty: number;
  baseSubtotal: number;
  extraSubtotal: number;
  totalPrice: number;
  blockedConflicts: string[];
  bookedConflicts: string[];
  scheduleLabel: string;
  datesToLock: string[];
}

function calculateRentalBooking(
  item: RentalProduct,
  rentalStartDate: string,
  rentalEndDate: string,
  pickupDate: string,
  returnDate: string,
  qty: number
): RentalCalculationSummary {
  const meta = (item.metaData || {}) as RentalMeta;
  const blockedSet = new Set(meta.unavailableDates || []);
  const bookedSet = new Set(meta.bookedDates || []);

  const rawDiff = diffDaysIso(rentalStartDate, rentalEndDate);
  const baseNights = Math.max(1, rawDiff > 0 ? rawDiff : 1);
  const safeRentalEnd =
    rawDiff > 0 ? rentalEndDate : addDaysIso(rentalStartDate, 1);

  const minAllowedPickup = addDaysIso(rentalStartDate, -1); // H-1
  const maxAllowedReturn = addDaysIso(safeRentalEnd, 1); // H+1

  const safePickup = clampIsoDate(pickupDate, minAllowedPickup, rentalStartDate);
  const safeReturn = clampIsoDate(returnDate, safeRentalEnd, maxAllowedReturn);

  const extraChargeNights = 0;
  const totalBilledNights = baseNights;

  const baseSubtotal = item.price * baseNights * qty;
  const extraSubtotal = 0;
  const totalPrice = item.price * totalBilledNights * qty;

  const rentalDates = expandDateRangeIso(rentalStartDate, safeRentalEnd);
  const blockedConflicts = rentalDates.filter((d) => blockedSet.has(d));
  const bookedConflicts = rentalDates.filter((d) => bookedSet.has(d));

  const scheduleLabel = `Rental ${rentalStartDate} s/d ${safeRentalEnd} (${baseNights} mlm) | Ambil: ${safePickup} | Kembali: ${safeReturn}`;

  return {
    rentalStartDate,
    rentalEndDate: safeRentalEnd,
    pickupDate: safePickup,
    returnDate: safeReturn,
    baseNights,
    extraChargeNights,
    totalBilledNights,
    qty,
    baseSubtotal,
    extraSubtotal,
    totalPrice,
    blockedConflicts,
    bookedConflicts,
    scheduleLabel,
    datesToLock: rentalDates,
  };
}

function BlockedRedDateInput({
  value,
  min,
  max,
  blockedDates,
  onChange,
  align = "left",
}: {
  value: string;
  min?: string;
  max?: string;
  blockedDates: Set<string>;
  onChange: (nextIso: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate =
    parseIsoDate(value) || parseIsoDate(min || "") || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    const dt = parseIsoDate(value);
    if (dt) {
      setViewYear(dt.getFullYear());
      setViewMonth(dt.getMonth());
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: { iso: string | null; day: number | null }[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ iso: null, day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      cells.push({ iso, day: d });
    }
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-white border border-neutral-300 rounded-xl px-2.5 py-2 text-xs font-bold text-neutral-900 flex items-center justify-between gap-1 hover:border-[#6F4E37] transition cursor-pointer text-left"
      >
        <span className="truncate">{formatShortDateId(value)}</span>
        <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
      </button>

      {open && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-1.5 z-50 w-60 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-3 select-none`}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-6 h-6 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-700 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black text-neutral-900">
              {MONTH_NAMES_ID[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-6 h-6 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-700 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAY_HEADERS_ID.map((hdr) => (
              <div
                key={hdr}
                className="text-center text-[10px] font-extrabold text-neutral-400"
              >
                {hdr}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell.iso || !cell.day) {
                return <div key={`empty-${idx}`} className="h-7" />;
              }

              const isBlocked = blockedDates.has(cell.iso);
              const isOutOfRange =
                (min && cell.iso < min) || (max && cell.iso > max);
              const isDisabled = Boolean(isOutOfRange || isBlocked);
              const isSelected = cell.iso === value && !isBlocked;

              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isBlocked) return;
                    onChange(cell.iso!);
                    setOpen(false);
                  }}
                  className={`h-7 rounded-lg text-[11px] font-bold flex items-center justify-center transition ${
                    isBlocked
                      ? "bg-red-600 text-white font-black opacity-90 cursor-not-allowed"
                      : isSelected
                      ? "bg-[#6F4E37] text-white font-black cursor-pointer"
                      : isOutOfRange
                      ? "text-neutral-300 cursor-not-allowed"
                      : "text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RentalGearSimpleCard({
  item,
  onOpenBooking,
  justAddedId,
}: {
  item: RentalProduct;
  onOpenBooking: (item: RentalProduct) => void;
  justAddedId: string | null;
}) {
  const isOutOfStock = Number(item.stock) <= 0;
  const isAdded = justAddedId === item.id;

  return (
    <div className="group relative h-full">
      <div className="relative h-full rounded-[26px] bg-white/95 backdrop-blur-xl border border-black/[0.07] shadow-[0_12px_28px_-12px_rgba(24,24,27,0.1)] hover:shadow-[0_22px_46px_-14px_rgba(111,78,55,0.2)] transition-all duration-200 ease-out flex flex-col justify-between overflow-hidden">
        <div>
          <div className="relative aspect-[4/3] m-2.5 rounded-[20px] overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100/90 border border-black/[0.05] flex items-center justify-center p-4">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Package className="w-10 h-10" />
              </div>
            )}

            <div className="absolute top-3 left-3 z-20">
              <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-bold tracking-wide">
                {getCategoryLabel(item.subCategory)}
              </span>
            </div>

            <div className="absolute top-3 right-3 z-20">
              <span
                className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-extrabold ${
                  isOutOfStock
                    ? "bg-rose-600/90 text-white"
                    : "bg-white/95 text-neutral-900 border border-black/[0.06]"
                }`}
              >
                {isOutOfStock ? "Habis" : `Stok ${item.stock}`}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 z-20">
              <div className="px-3.5 py-1.5 rounded-2xl bg-neutral-950/85 backdrop-blur-md text-white shadow-xs">
                <span className="text-sm font-black tracking-tight">
                  {formatRupiah(item.price)}
                </span>
                <span className="text-[10px] text-neutral-300 font-semibold ml-1">
                  / malam
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 pt-1.5 pb-3 space-y-1.5">
            <h3 className="text-base font-black text-neutral-900 tracking-tight leading-snug">
              {item.title}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
              {item.description ||
                "Peralatan outdoor terawat dan siap dipakai untuk kebutuhan pendakian maupun kegiatan alam terbuka."}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onOpenBooking(item)}
            className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isOutOfStock
                ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                : isAdded
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-neutral-950 hover:bg-[#6F4E37] text-white shadow-xs active:scale-[0.98]"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Masuk Keranjang!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? "Stok Habis" : "Sewa Alat Ini"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function RentalBookingModal({
  item,
  agreed,
  onToggleAgree,
  onOpenRules,
  onClose,
  onAddToCart,
  addingId,
}: {
  item: RentalProduct;
  agreed: boolean;
  onToggleAgree: (id: string) => void;
  onOpenRules: (item: RentalProduct) => void;
  onClose: () => void;
  onAddToCart: (item: RentalProduct, calc: RentalCalculationSummary) => Promise<boolean>;
  addingId: string | null;
}) {
  const defaultStart = useMemo(() => addDaysIso(getTodayIso(), 1), []);
  const defaultEnd = useMemo(() => addDaysIso(defaultStart, 1), [defaultStart]);

  const [rentalStartDate, setRentalStartDate] = useState<string>(defaultStart);
  const [rentalEndDate, setRentalEndDate] = useState<string>(defaultEnd);
  const [pickupDate, setPickupDate] = useState<string>(defaultStart);
  const [returnDate, setReturnDate] = useState<string>(defaultEnd);
  const [qty, setQty] = useState<number>(1);

  const minPickupIso = useMemo(
    () => addDaysIso(rentalStartDate, -1),
    [rentalStartDate]
  );
  const maxPickupIso = rentalStartDate;

  const safeRentalEndIso = useMemo(() => {
    const minEnd = addDaysIso(rentalStartDate, 1);
    return diffDaysIso(rentalStartDate, rentalEndDate) < 1
      ? minEnd
      : rentalEndDate;
  }, [rentalStartDate, rentalEndDate]);

  const minReturnIso = safeRentalEndIso;
  const maxReturnIso = useMemo(
    () => addDaysIso(safeRentalEndIso, 1),
    [safeRentalEndIso]
  );

  const handleRentalStartChange = (nextStart: string) => {
    if (!parseIsoDate(nextStart)) return;
    setRentalStartDate(nextStart);

    const minEnd = addDaysIso(nextStart, 1);
    const nextEnd =
      diffDaysIso(nextStart, rentalEndDate) < 1 ? minEnd : rentalEndDate;
    setRentalEndDate(nextEnd);

    const nextMinPickup = addDaysIso(nextStart, -1);
    setPickupDate((prev) => clampIsoDate(prev, nextMinPickup, nextStart));
    setReturnDate((prev) => clampIsoDate(prev, nextEnd, addDaysIso(nextEnd, 1)));
  };

  const handleRentalEndChange = (nextEnd: string) => {
    if (!parseIsoDate(nextEnd)) return;
    const minEnd = addDaysIso(rentalStartDate, 1);
    const validEnd = diffDaysIso(rentalStartDate, nextEnd) < 1 ? minEnd : nextEnd;
    setRentalEndDate(validEnd);
    setReturnDate((prev) => clampIsoDate(prev, validEnd, addDaysIso(validEnd, 1)));
  };

  const handlePickupChange = (nextPickup: string) => {
    if (!parseIsoDate(nextPickup)) return;
    setPickupDate(clampIsoDate(nextPickup, minPickupIso, maxPickupIso));
  };

  const handleReturnChange = (nextReturn: string) => {
    if (!parseIsoDate(nextReturn)) return;
    setReturnDate(clampIsoDate(nextReturn, minReturnIso, maxReturnIso));
  };

  const calc = useMemo(
    () =>
      calculateRentalBooking(
        item,
        rentalStartDate,
        safeRentalEndIso,
        pickupDate,
        returnDate,
        qty
      ),
    [item, rentalStartDate, safeRentalEndIso, pickupDate, returnDate, qty]
  );

  const maxStock = Math.max(1, Number(item.stock) || 10);
  const isOutOfStock = Number(item.stock) <= 0;
  const hasConflict =
    calc.blockedConflicts.length > 0 || calc.bookedConflicts.length > 0;
  const isAdding = addingId === item.id;

  const meta = (item.metaData || {}) as RentalMeta;
  const blockedDatesSet = useMemo(
    () =>
      new Set([
        ...(meta.unavailableDates || []),
        ...(meta.bookedDates || []),
      ]),
    [meta.unavailableDates, meta.bookedDates]
  );

  const handleConfirm = async () => {
    const ok = await onAddToCart(item, calc);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-black/10 space-y-4 overflow-visible"
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-black/[0.05] flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="w-5 h-5 text-neutral-400" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold text-[#6F4E37] uppercase tracking-wider">
                Detail Sewa Alat
              </span>
              <h3 className="text-base font-black text-neutral-950 truncate">
                {item.title}
              </h3>
              <p className="text-xs font-bold text-neutral-600">
                {formatRupiah(item.price)}{" "}
                <span className="font-normal text-neutral-400">/ malam</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-neutral-100/80 p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-neutral-900">
            <Calendar className="w-4 h-4 text-[#6F4E37] shrink-0" />
            <span>Tanggal Rental & Jadwal Ambil/Kembali</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                Mulai Sewa
              </label>
              <BlockedRedDateInput
                value={rentalStartDate}
                blockedDates={blockedDatesSet}
                onChange={handleRentalStartChange}
                align="left"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                Selesai Sewa
              </label>
              <BlockedRedDateInput
                value={safeRentalEndIso}
                min={addDaysIso(rentalStartDate, 1)}
                blockedDates={blockedDatesSet}
                onChange={handleRentalEndChange}
                align="right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                Tgl Ambil (Maks H-1)
              </label>
              <BlockedRedDateInput
                value={calc.pickupDate}
                min={minPickupIso}
                max={maxPickupIso}
                blockedDates={blockedDatesSet}
                onChange={handlePickupChange}
                align="left"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                Tgl Kembali (Maks H+1)
              </label>
              <BlockedRedDateInput
                value={calc.returnDate}
                min={minReturnIso}
                max={maxReturnIso}
                blockedDates={blockedDatesSet}
                onChange={handleReturnChange}
                align="right"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-200/70">
            <span className="text-xs font-bold text-neutral-700">
              Jumlah Unit (Stok {item.stock})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-white text-neutral-900 text-xs font-black flex items-center justify-center shadow-2xs hover:bg-neutral-200/60 cursor-pointer disabled:opacity-40"
              >
                -
              </button>
              <span className="text-xs font-black text-neutral-900 w-5 text-center">
                {qty}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || qty >= maxStock}
                onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
                className="w-7 h-7 rounded-full bg-white text-neutral-900 text-xs font-black flex items-center justify-center shadow-2xs hover:bg-neutral-200/60 cursor-pointer disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#FAF8F5] border border-amber-900/10 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#6F4E37]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Peraturan Rental
            </span>
            <button
              type="button"
              onClick={() => onOpenRules(item)}
              className="inline-flex items-center gap-0.5 text-[11px] font-black text-neutral-800 underline hover:text-[#6F4E37] cursor-pointer"
            >
              <span>Baca lengkap</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <label className="flex items-start gap-2 text-[11px] text-neutral-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={() => onToggleAgree(item.id)}
              className="mt-0.5 w-3.5 h-3.5 rounded accent-[#6F4E37] cursor-pointer shrink-0"
            />
            <span className="font-semibold leading-snug">
              Saya telah membaca & menyetujui peraturan sewa alat rental ini.
            </span>
          </label>
        </div>

        <div className="space-y-1 text-xs pt-0.5">
          <div className="flex items-center justify-between text-neutral-600 font-semibold">
            <span>
              Sewa ({calc.baseNights} mlm × {qty})
            </span>
            <span>{formatRupiah(calc.baseSubtotal)}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100">
            <span className="text-neutral-800 font-bold">Estimasi Total</span>
            <span className="text-base font-black text-neutral-950">
              {formatRupiah(calc.totalPrice)}
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isOutOfStock || isAdding || hasConflict}
          onClick={handleConfirm}
          className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isOutOfStock || hasConflict
              ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
              : agreed
              ? "bg-neutral-950 hover:bg-[#6F4E37] text-white shadow-sm active:scale-[0.98]"
              : "bg-amber-100 hover:bg-amber-200 text-[#6F4E37]"
          }`}
        >
          {isAdding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menambahkan...</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isOutOfStock
                  ? "Stok Habis"
                  : hasConflict
                  ? "Tanggal Tidak Tersedia"
                  : agreed
                  ? "Tambah ke Keranjang"
                  : "Setujui Peraturan & Tambah"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [items, setItems] = useState<RentalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<RentalCategoryKey>("ALL");
  const [agreedIds, setAgreedIds] = useState<Record<string, boolean>>({});
  const [bookingModalProduct, setBookingModalProduct] =
    useState<RentalProduct | null>(null);
  const [rulesModalProduct, setRulesModalProduct] =
    useState<RentalProduct | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{
    type: "success" | "warn";
    text: string;
  } | null>(null);

  const showBanner = (type: "success" | "warn", text: string) => {
    setBannerMsg({ type, text });
    setTimeout(() => {
      setBannerMsg((prev) => (prev?.text === text ? null : prev));
    }, 3400);
  };

  useEffect(() => {
    let active = true;
    async function loadRentalProducts() {
      setLoading(true);
      try {
        const res = await fetch("/api/catalog?category=RENTAL", {
          cache: "no-store",
        });
        const data = await res.json();
        const rawList = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data)
          ? data
          : [];
        const onlyRental = rawList.filter(
          (p: RentalProduct) =>
            String(p.category || "").toUpperCase() === "RENTAL"
        );
        if (active) {
          setItems(onlyRental);
        }
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRentalProducts();
    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "ALL") return items;
    return items.filter(
      (item) => (item.subCategory || "LAINNYA") === selectedCategory
    );
  }, [items, selectedCategory]);

  const toggleAgree = (id: string) => {
    setAgreedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = async (
    item: RentalProduct,
    calc: RentalCalculationSummary
  ): Promise<boolean> => {
    if (!agreedIds[item.id]) {
      setRulesModalProduct(item);
      showBanner(
        "warn",
        "Baca & centang persetujuan peraturan rental terlebih dahulu ya."
      );
      return false;
    }

    if (calc.blockedConflicts.length > 0 || calc.bookedConflicts.length > 0) {
      showBanner(
        "warn",
        "Pilih tanggal sewa lain karena ada tanggal sewa yang tidak tersedia."
      );
      return false;
    }

    setAddingId(item.id);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          quantity: calc.qty,
          paxCount: calc.qty,
          selectedSchedule: calc.scheduleLabel,
          rentalBooking: {
            productId: item.id,
            rentalStartDate: calc.rentalStartDate,
            rentalEndDate: calc.rentalEndDate,
            pickupDate: calc.pickupDate,
            returnDate: calc.returnDate,
            baseNights: calc.baseNights,
            extraChargeNights: calc.extraChargeNights,
            totalBilledNights: calc.totalBilledNights,
            datesToLock: calc.datesToLock,
            scheduleLabel: calc.scheduleLabel,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        try {
          const key = item.slug || item.id;
          const rawSched = localStorage.getItem(
            "alam_memanggil_selected_schedules"
          );
          const schedMap = rawSched ? JSON.parse(rawSched) : {};
          schedMap[key] = calc.scheduleLabel;
          schedMap[item.id] = calc.scheduleLabel;
          localStorage.setItem(
            "alam_memanggil_selected_schedules",
            JSON.stringify(schedMap)
          );

          const rawRental = localStorage.getItem(
            "alam_memanggil_rental_bookings"
          );
          const rentalMap = rawRental ? JSON.parse(rawRental) : {};
          const bookingPayload = {
            productId: item.id,
            rentalStartDate: calc.rentalStartDate,
            rentalEndDate: calc.rentalEndDate,
            pickupDate: calc.pickupDate,
            returnDate: calc.returnDate,
            baseNights: calc.baseNights,
            extraChargeNights: calc.extraChargeNights,
            totalBilledNights: calc.totalBilledNights,
            datesToLock: calc.datesToLock,
            scheduleLabel: calc.scheduleLabel,
          };
          rentalMap[key] = bookingPayload;
          rentalMap[item.id] = bookingPayload;
          localStorage.setItem(
            "alam_memanggil_rental_bookings",
            JSON.stringify(rentalMap)
          );
        } catch {
          // abaikan storage error
        }

        setJustAddedId(item.id);
        showBanner(
          "success",
          `"${item.title}" (${calc.totalBilledNights} mlm × ${calc.qty}) masuk keranjang.`
        );
        window.dispatchEvent(new Event("cart-updated"));
        setTimeout(() => {
          setJustAddedId((curr) => (curr === item.id ? null : curr));
        }, 1800);
        return true;
      } else {
        showBanner(
          "warn",
          data?.message ||
            "Silakan login terlebih dahulu untuk menambah ke keranjang."
        );
        return false;
      }
    } catch {
      showBanner("warn", "Gagal menambahkan ke keranjang.");
      return false;
    } finally {
      setAddingId(null);
    }
  };

  const modalRules = rulesModalProduct
    ? getRulesFromProduct(rulesModalProduct)
    : [];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 pb-20">
      {bannerMsg && (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl backdrop-blur-xl border text-xs font-bold flex items-center gap-2.5 ${
              bannerMsg.type === "success"
                ? "bg-neutral-950/95 text-white border-emerald-400/40"
                : "bg-white/95 text-neutral-900 border-amber-400"
            }`}
          >
            {bannerMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#6F4E37] shrink-0" />
            )}
            <span>{bannerMsg.text}</span>
          </div>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="rounded-[32px] bg-white/85 backdrop-blur-2xl border border-black/[0.06] p-6 sm:p-10 shadow-[0_18px_45px_-18px_rgba(0,0,0,0.08)]">
          <div className="space-y-2.5 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950">
              Sewa Perlengkapan Outdoor
            </h1>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Pilih perlengkapan yang dibutuhkan, lalu tentukan tanggal sewa,
              pengambilan (maks. H-1), dan pengembalian (maks. H+1) langsung di
              detail sewa.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        <div className="rounded-[26px] bg-white/80 backdrop-blur-xl border border-black/[0.06] p-3 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-extrabold text-neutral-500 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Kategori:
            </span>
            {RENTAL_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    active
                      ? "bg-neutral-950 text-white shadow-sm"
                      : "bg-neutral-100/80 text-neutral-700 hover:bg-neutral-200/70"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-[26px] bg-white/70 border border-black/[0.05] animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[32px] bg-white/80 backdrop-blur-xl border border-black/[0.06] p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-neutral-400 mx-auto" />
            <h2 className="text-base font-black text-neutral-900">
              Belum ada alat rental pada kategori ini
            </h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Admin dapat menambahkan produk rental baru melalui{" "}
              <strong>Dashboard Admin → Etalase Paket → RENTAL</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <RentalGearSimpleCard
                key={item.id}
                item={item}
                onOpenBooking={(prod) => setBookingModalProduct(prod)}
                justAddedId={justAddedId}
              />
            ))}
          </div>
        )}
      </section>

      {bookingModalProduct && (
        <RentalBookingModal
          item={bookingModalProduct}
          agreed={Boolean(agreedIds[bookingModalProduct.id])}
          onToggleAgree={toggleAgree}
          onOpenRules={(prod) => setRulesModalProduct(prod)}
          onClose={() => setBookingModalProduct(null)}
          onAddToCart={handleAddToCart}
          addingId={addingId}
        />
      )}

      {rulesModalProduct && (
        <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-black/10 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-[#6F4E37]">
                  <ShieldCheck className="w-3 h-3" /> Peraturan Rental Gear
                </span>
                <h3 className="text-base font-black text-neutral-950 mt-1">
                  {rulesModalProduct.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRulesModalProduct(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-neutral-700">
              {modalRules.map((r) => (
                <div
                  key={r.no}
                  className="flex items-start gap-2.5 bg-neutral-50 p-3 rounded-2xl border border-neutral-200/70"
                >
                  <span className="w-5 h-5 rounded-full bg-[#6F4E37] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {r.no}
                  </span>
                  <p className="leading-relaxed">{r.rule}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-100">
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(agreedIds[rulesModalProduct.id])}
                  onChange={() => toggleAgree(rulesModalProduct.id)}
                  className="w-4 h-4 rounded accent-[#6F4E37] cursor-pointer"
                />
                <span>Saya setuju dengan peraturan di atas</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setAgreedIds((prev) => ({
                    ...prev,
                    [rulesModalProduct.id]: true,
                  }));
                  setRulesModalProduct(null);
                }}
                className="px-5 py-2.5 rounded-full bg-neutral-950 hover:bg-[#6F4E37] text-white text-xs font-black transition cursor-pointer"
              >
                Konfirmasi & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
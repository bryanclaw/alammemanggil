"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Backpack,
  Footprints,
  Shirt,
  Tent,
  Flashlight,
  Package,
  Layers,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Calendar,
  ArrowUpRight,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type RentalCategoryKey =
  | "PAKET"
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

interface RentalPackageItem {
  name: string;
  quantity: string;
  note?: string;
}

interface RentalMeta {
  nightsDefault?: number;
  conditionNote?: string;
  packageItems?: RentalPackageItem[];
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
  { key: "PAKET", label: "Paket", shortLabel: "Paket", icon: Layers },
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
  if (String(subCat || "").toUpperCase() === "PAKET") {
    return "Paket Rental";
  }
  const found = RENTAL_CATEGORIES.find((c) => c.key === subCat);
  return found ? found.label : "Lainnya";
}

function getPackageItemsFromProduct(item: RentalProduct): RentalPackageItem[] {
  const meta = (item.metaData || {}) as RentalMeta;
  if (!Array.isArray(meta.packageItems)) return [];
  return meta.packageItems
    .filter((p) => p && String(p.name || "").trim() !== "")
    .map((p) => ({
      name: String(p.name).trim(),
      quantity: String(p.quantity || "1").trim(),
      note: p.note ? String(p.note).trim() : "",
    }));
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
  const closedStoreSet = new Set(meta.unavailableDates || []);

  const maxStock = Math.max(0, Number(item.stock) || 0);
  const safeQty =
    maxStock > 0 ? Math.max(1, Math.min(maxStock, Number(qty) || 1)) : 0;

  const rawDiff = diffDaysIso(rentalStartDate, rentalEndDate);
  const baseNights = Math.max(1, rawDiff > 0 ? rawDiff : 1);
  const safeRentalEnd =
    rawDiff > 0 ? rentalEndDate : addDaysIso(rentalStartDate, 1);

  const minAllowedPickup = addDaysIso(rentalStartDate, -1);
  const maxAllowedReturn = addDaysIso(safeRentalEnd, 1);

  const safePickup = clampIsoDate(pickupDate, minAllowedPickup, rentalStartDate);
  const safeReturn = clampIsoDate(returnDate, safeRentalEnd, maxAllowedReturn);

  const extraChargeNights = 0;
  const totalBilledNights = baseNights;

  const baseSubtotal = item.price * baseNights * safeQty;
  const extraSubtotal = 0;
  const totalPrice = item.price * totalBilledNights * safeQty;

  const rentalDates = expandDateRangeIso(rentalStartDate, safeRentalEnd);
  const blockedConflicts = rentalDates.filter((d) => closedStoreSet.has(d));
  const bookedConflicts: string[] = [];

  const isPaket = String(item.subCategory || "").toUpperCase() === "PAKET";
  const unitWord = isPaket ? "paket" : "item";

  const scheduleLabel = `Rental ${rentalStartDate} s/d ${safeRentalEnd} (${baseNights} mlm, ${safeQty} ${unitWord}) | Ambil: ${safePickup} | Kembali: ${safeReturn}`;

  return {
    rentalStartDate,
    rentalEndDate: safeRentalEnd,
    pickupDate: safePickup,
    returnDate: safeReturn,
    baseNights,
    extraChargeNights,
    totalBilledNights,
    qty: safeQty,
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
                  title={isBlocked ? "Toko tutup" : undefined}
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
  const isPaket = String(item.subCategory || "").toUpperCase() === "PAKET";
  const pkgItems = useMemo(() => getPackageItemsFromProduct(item), [item]);

  return (
    <div className="group relative h-full">
      <div className="relative h-full rounded-[18px] sm:rounded-[22px] bg-white/95 backdrop-blur-xl border border-black/[0.07] shadow-[0_8px_22px_-12px_rgba(24,24,27,0.1)] hover:shadow-[0_16px_32px_-12px_rgba(111,78,55,0.18)] transition-all duration-200 ease-out flex flex-col justify-between overflow-hidden">
        <div>
          <div className="relative aspect-[4/3] m-1.5 sm:m-2 rounded-[14px] sm:rounded-[16px] overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100/90 border border-black/[0.05] flex items-center justify-center p-2 sm:p-2.5">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Package className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            )}

            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20">
              <span
                className={`px-2 py-0.5 rounded-full backdrop-blur-md text-[9px] font-bold tracking-wide ${
                  isPaket
                    ? "bg-[#6F4E37] text-white"
                    : "bg-black/75 text-white"
                }`}
              >
                {getCategoryLabel(item.subCategory)}
              </span>
            </div>

            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20">
              <span
                className={`px-1.5 py-0.5 rounded-full backdrop-blur-md text-[9px] font-extrabold ${
                  isOutOfStock
                    ? "bg-rose-600/90 text-white"
                    : "bg-white/95 text-neutral-900 border border-black/[0.06]"
                }`}
              >
                {isOutOfStock ? "Habis" : `Stok ${item.stock}`}
              </span>
            </div>

            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-20">
              <div className="px-2 py-1 rounded-xl bg-neutral-950/85 backdrop-blur-md text-white shadow-2xs leading-none">
                <span className="text-[11px] sm:text-xs font-black tracking-tight">
                  {formatRupiah(item.price)}
                </span>
                <span className="text-[9px] text-neutral-300 font-semibold ml-0.5">
                  /mlm
                </span>
              </div>
            </div>
          </div>

          <div className="px-2.5 sm:px-3 pt-1 pb-2 space-y-1">
            <h3 className="text-xs sm:text-[13px] font-black text-neutral-900 tracking-tight leading-snug line-clamp-1">
              {item.title}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-neutral-600 leading-snug line-clamp-2">
              {item.description ||
                "Peralatan outdoor terawat dan siap dipakai untuk pendakian maupun kegiatan alam terbuka."}
            </p>

            {isPaket && pkgItems.length > 0 && (
              <div className="rounded-xl bg-[#FAF8F5] border border-amber-900/10 p-1.5 space-y-0.5">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#6F4E37]">
                  Isi Paket:
                </p>
                <div className="flex flex-wrap gap-1">
                  {pkgItems.slice(0, 3).map((pk, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-white border border-neutral-200/80 text-[9px] font-bold text-neutral-800 truncate max-w-full"
                    >
                      {pk.quantity}x {pk.name}
                    </span>
                  ))}
                  {pkgItems.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100/70 text-[9px] font-bold text-[#6F4E37]">
                      +{pkgItems.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-1">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onOpenBooking(item)}
            className={`w-full py-2 px-2.5 rounded-xl text-[10px] sm:text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isOutOfStock
                ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                : isAdded
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-neutral-950 hover:bg-[#6F4E37] text-white shadow-2xs active:scale-[0.98]"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Masuk Keranjang!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {isOutOfStock
                    ? "Stok Habis"
                    : isPaket
                    ? "Sewa Paket"
                    : "Sewa Alat"}
                </span>
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
  onAddToCart: (
    item: RentalProduct,
    calc: RentalCalculationSummary
  ) => Promise<boolean>;
  addingId: string | null;
}) {
  const maxStock = Math.max(0, Number(item.stock) || 0);
  const isOutOfStock = maxStock <= 0;
  const isPaket = String(item.subCategory || "").toUpperCase() === "PAKET";
  const pkgItems = useMemo(() => getPackageItemsFromProduct(item), [item]);
  const unitWord = isPaket ? "paket" : "item";

  const defaultStart = useMemo(() => addDaysIso(getTodayIso(), 1), []);
  const defaultEnd = useMemo(() => addDaysIso(defaultStart, 1), [defaultStart]);

  const [rentalStartDate, setRentalStartDate] = useState<string>(defaultStart);
  const [rentalEndDate, setRentalEndDate] = useState<string>(defaultEnd);
  const [pickupDate, setPickupDate] = useState<string>(defaultStart);
  const [returnDate, setReturnDate] = useState<string>(defaultEnd);
  const [qty, setQty] = useState<number>(isOutOfStock ? 0 : 1);

  useEffect(() => {
    if (maxStock <= 0) {
      setQty(0);
    } else {
      setQty((prev) => Math.max(1, Math.min(maxStock, prev || 1)));
    }
  }, [maxStock]);

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

  const hasClosedStoreConflict = calc.blockedConflicts.length > 0;
  const isAdding = addingId === item.id;

  const meta = (item.metaData || {}) as RentalMeta;
  const closedStoreDatesSet = useMemo(
    () => new Set(meta.unavailableDates || []),
    [meta.unavailableDates]
  );

  const handleConfirm = async () => {
    if (
      isOutOfStock ||
      hasClosedStoreConflict ||
      calc.qty <= 0 ||
      calc.qty > maxStock
    ) {
      return;
    }
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
        className="bg-white rounded-[28px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-black/10 space-y-4 max-h-[92vh] overflow-y-auto"
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
                {isPaket ? "Detail Paket Rental" : "Detail Sewa Alat"}
              </span>
              <h3 className="text-base font-black text-neutral-950 truncate">
                {item.title}
              </h3>
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

        {isPaket && pkgItems.length > 0 && (
          <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3 space-y-1.5">
            <p className="text-[11px] font-black text-[#6F4E37] uppercase tracking-wider">
              Perlengkapan dalam Paket:
            </p>
            <div className="space-y-1">
              {pkgItems.map((pk, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs font-semibold text-neutral-800"
                >
                  <span>
                    • {pk.name}{" "}
                    {pk.note ? (
                      <span className="text-[11px] text-neutral-500 font-normal">
                        ({pk.note})
                      </span>
                    ) : null}
                  </span>
                  <span className="font-black text-[#6F4E37]">
                    {pk.quantity}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                blockedDates={closedStoreDatesSet}
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
                blockedDates={closedStoreDatesSet}
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
                blockedDates={closedStoreDatesSet}
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
                blockedDates={closedStoreDatesSet}
                onChange={handleReturnChange}
                align="right"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-neutral-200/70">
            <span className="text-xs font-bold text-neutral-700">
              Jumlah {isPaket ? "Paket" : "Item"} (Stok {maxStock})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isOutOfStock || qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-full bg-white text-neutral-900 text-xs font-black flex items-center justify-center shadow-2xs hover:bg-neutral-200/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="w-7 h-7 rounded-full bg-white text-neutral-900 text-xs font-black flex items-center justify-center shadow-2xs hover:bg-neutral-200/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
              Sewa ({calc.qty} {unitWord} × {calc.baseNights} mlm)
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
          disabled={isOutOfStock || isAdding || hasClosedStoreConflict}
          onClick={handleConfirm}
          className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isOutOfStock || hasClosedStoreConflict
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
                  : hasClosedStoreConflict
                  ? "Toko Tutup pada Tanggal Ini"
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
    useState<RentalCategoryKey>("PAKET");
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
        const res = await fetch(`/api/catalog?category=RENTAL&_t=${Date.now()}`, {
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

    const onCatalogUpdate = () => loadRentalProducts();
    window.addEventListener("catalog-updated", onCatalogUpdate);

    return () => {
      active = false;
      window.removeEventListener("catalog-updated", onCatalogUpdate);
    };
  }, []);

  const filteredItems = useMemo(() => {
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

    const maxStock = Math.max(0, Number(item.stock) || 0);
    if (maxStock <= 0 || calc.qty <= 0 || calc.qty > maxStock) {
      showBanner("warn", `Stok alat tidak tersedia (${maxStock} item).`);
      return false;
    }

    if (calc.blockedConflicts.length > 0) {
      showBanner(
        "warn",
        "Pilih tanggal lain karena toko tutup pada tanggal sewa yang dipilih."
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
            scheduleLabel: calc.scheduleLabel,
            qty: calc.qty,
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
            scheduleLabel: calc.scheduleLabel,
            qty: calc.qty,
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
        const unitLabel =
          String(item.subCategory || "").toUpperCase() === "PAKET"
            ? "paket"
            : "item";
        showBanner(
          "success",
          `"${item.title}" (${calc.qty} ${unitLabel} × ${calc.totalBilledNights} mlm) masuk keranjang.`
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
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 pb-16 overflow-x-hidden">
      {bannerMsg && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] max-w-sm ml-auto">
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

      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-8 pb-4">
        <div className="rounded-[22px] sm:rounded-[28px] bg-white/85 backdrop-blur-2xl border border-black/[0.06] p-4 sm:p-7 shadow-[0_14px_36px_-18px_rgba(0,0,0,0.08)]">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-neutral-950">
              Sewa Perlengkapan Outdoor
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Sewa alat satuan maupun paket perlengkapan outdoor siap pakai untuk
              pendakian dan kegiatan alam terbuka.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 mb-5 sm:mb-6">
        <div className="rounded-[20px] sm:rounded-[24px] bg-white/80 backdrop-blur-xl border border-black/[0.06] p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {RENTAL_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    active
                      ? "bg-neutral-950 text-white shadow-sm"
                      : "bg-neutral-100/80 text-neutral-700 hover:bg-neutral-200/70"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span className="sm:hidden">{cat.shortLabel}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3.5 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-64 rounded-[20px] bg-white/70 border border-black/[0.05] animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[24px] bg-white/80 backdrop-blur-xl border border-black/[0.06] p-10 text-center space-y-2">
            <Package className="w-9 h-9 text-neutral-400 mx-auto" />
            <h2 className="text-sm sm:text-base font-black text-neutral-900">
              Belum ada alat atau paket rental pada kategori ini
            </h2>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
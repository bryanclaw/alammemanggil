"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Moon,
  ArrowUpRight,
  Check,
  X,
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
    rule: "Penyewa wajib menyertakan identitas valid (KTP/SIM) serta memastikan kondisi fisik alat saat diterima bersama tim Alam Memanggil.",
  },
  {
    no: 3,
    rule: "Segala bentuk kerusakan, sobek, patah, atau kehilangan alat selama masa sewa menjadi tanggung jawab penyewa sesuai tingkat kerusakan atau biaya penggantian.",
  },
  {
    no: 4,
    rule: "Keterlambatan pengembalian alat dikenakan denda per malam/hari sesuai tarif sewa paket.",
  },
  {
    no: 5,
    rule: "Dilarang mengubah struktur, memodifikasi, atau menyewakan kembali alat yang sedang dalam masa rental tanpa izin tertulis dari Alam Memanggil.",
  },
];

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

function RentalGear3DCard({
  item,
  agreed,
  onToggleAgree,
  onOpenRules,
  onAddToCart,
  addingId,
  justAddedId,
}: {
  item: RentalProduct;
  agreed: boolean;
  onToggleAgree: (id: string) => void;
  onOpenRules: (item: RentalProduct) => void;
  onAddToCart: (item: RentalProduct, nights: number, qty: number) => void;
  addingId: string | null;
  justAddedId: string | null;
}) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const [nights, setNights] = useState<number>(1);
  const [qty, setQty] = useState<number>(1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 14;
    const rx = (0.5 - py) * 14;
    setTilt({
      rx,
      ry,
      gx: Math.round(px * 100),
      gy: Math.round(py * 100),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  const subtotal = item.price * nights * qty;
  const maxStock = Math.max(1, Number(item.stock) || 10);
  const isOutOfStock = Number(item.stock) <= 0;
  const isAdding = addingId === item.id;
  const isAdded = justAddedId === item.id;

  return (
    <div style={{ perspective: "1100px" }} className="group relative h-full">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(0px)`,
          transformStyle: "preserve-3d",
        }}
        className="relative h-full rounded-[28px] bg-white/90 backdrop-blur-xl border border-black/[0.07] shadow-[0_14px_34px_-12px_rgba(24,24,27,0.12)] hover:shadow-[0_26px_54px_-14px_rgba(111,78,55,0.22)] transition-all duration-200 ease-out flex flex-col justify-between overflow-hidden"
      >
        <div
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.65), transparent 55%)`,
          }}
          className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />

        <div>
          <div className="relative aspect-[4/3] m-2.5 rounded-[22px] overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100/90 border border-black/[0.05] flex items-center justify-center p-3">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                style={{ transform: "translateZ(18px)" }}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 select-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <Package className="w-10 h-10" />
              </div>
            )}

            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
              <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[10px] font-bold tracking-wide">
                {getCategoryLabel(item.subCategory)}
              </span>
            </div>

            <div className="absolute top-3 right-3 z-20">
              <span
                className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-extrabold ${
                  isOutOfStock
                    ? "bg-rose-600/90 text-white"
                    : "bg-white/95 text-neutral-900 border border-black/[0.06] shadow-2xs"
                }`}
              >
                {isOutOfStock ? "Habis" : `Stok ${item.stock}`}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 z-20">
              <div className="px-3.5 py-1.5 rounded-2xl bg-neutral-950/85 backdrop-blur-md text-white shadow-sm">
                <span className="text-sm font-black tracking-tight">
                  {formatRupiah(item.price)}
                </span>
                <span className="text-[10px] text-neutral-300 font-semibold ml-1">
                  / malam
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 pt-2 pb-3 space-y-2">
            <h3 className="text-base font-black text-neutral-900 tracking-tight leading-snug">
              {item.title}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
              {item.description ||
                "Peralatan outdoor terawat dan siap dipakai untuk kebutuhan pendakian maupun kegiatan alam terbuka."}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 space-y-3 border-t border-neutral-100">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-100/80 rounded-2xl px-3 py-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600">
                <Moon className="w-3.5 h-3.5 text-[#6F4E37]" />
                Malam
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setNights((n) => Math.max(1, n - 1))}
                  className="w-5 h-5 rounded-full bg-white text-neutral-900 text-xs font-black flex items-center justify-center shadow-2xs hover:bg-neutral-200/60 cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-black text-neutral-900 w-4 text-center">
                  {nights}
                </span>
                <button
                  type="button"
                  onClick={() => setNights((n) => Math.min(30, n + 1))}
                  className="w-5 h-5 rounded-full bg-white text-neutral-900 text-xs font-black flex items-center justify-center shadow-2xs hover:bg-neutral-200/60 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-neutral-100/80 rounded-2xl px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-600">
                Jumlah
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-5 h-5 rounded-full bg-white text-neutral-900 text-xs font-black flex items-center justify-center shadow-2xs hover:bg-neutral-200/60 cursor-pointer disabled:opacity-40"
                >
                  -
                </button>
                <span className="text-xs font-black text-neutral-900 w-4 text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || qty >= maxStock}
                  onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
                  className="w-5 h-5 rounded-full bg-white text-neutral-900 text-xs font-black flex items-center justify-center shadow-2xs hover:bg-neutral-200/60 cursor-pointer disabled:opacity-40"
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
                className="mt-0.5 w-3.5 h-3.5 rounded accent-[#6F4E37] cursor-pointer"
              />
              <span className="font-semibold leading-snug">
                Saya telah membaca & menyetujui peraturan sewa alat rental ini.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-neutral-500 font-semibold">
              Estimasi ({nights} mlm × {qty})
            </span>
            <span className="font-black text-neutral-900">
              {formatRupiah(subtotal)}
            </span>
          </div>

          <button
            type="button"
            disabled={isOutOfStock || isAdding}
            onClick={() => onAddToCart(item, nights, qty)}
            className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isOutOfStock
                ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                : isAdded
                ? "bg-emerald-600 text-white shadow-md"
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
            ) : isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Masuk Keranjang!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isOutOfStock
                    ? "Stok Habis"
                    : agreed
                    ? "Tambah ke Keranjang"
                    : "Setujui Peraturan & Tambah"}
                </span>
              </>
            )}
          </button>
        </div>
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
    }, 3200);
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
          (p: RentalProduct) => String(p.category || "").toUpperCase() === "RENTAL"
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
    nights: number,
    qty: number
  ) => {
    if (!agreedIds[item.id]) {
      setRulesModalProduct(item);
      showBanner(
        "warn",
        "Baca & centang persetujuan peraturan rental terlebih dahulu ya."
      );
      return;
    }

    setAddingId(item.id);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.id,
          quantity: qty,
          selectedSchedule: `Rental ${nights} Malam (Disetujui)`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setJustAddedId(item.id);
        showBanner(
          "success",
          `"${item.title}" (${nights} mlm × ${qty}) berhasil ditambahkan ke keranjang.`
        );
        window.dispatchEvent(new Event("cart-updated"));
        setTimeout(() => {
          setJustAddedId((curr) => (curr === item.id ? null : curr));
        }, 1800);
      } else {
        showBanner(
          "warn",
          data?.message || "Silakan login terlebih dahulu untuk menambah ke keranjang."
        );
      }
    } catch {
      showBanner("warn", "Gagal menambahkan ke keranjang.");
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
        <div className="fixed bottom-5 right-5 z-50 max-w-sm">
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
              Belum punya carrier, tenda, headlamp, atau sepatu gunung? Sewa dikami aja! bisa untuk kebutuhan pendakian maupun kegiatan alam terbuka lainnya.
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
                className="h-96 rounded-[28px] bg-white/70 border border-black/[0.05] animate-pulse"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <RentalGear3DCard
                key={item.id}
                item={item}
                agreed={Boolean(agreedIds[item.id])}
                onToggleAgree={toggleAgree}
                onOpenRules={(prod) => setRulesModalProduct(prod)}
                onAddToCart={handleAddToCart}
                addingId={addingId}
                justAddedId={justAddedId}
              />
            ))}
          </div>
        )}
      </section>

      {rulesModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
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
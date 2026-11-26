"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Loader2,
  Calendar,
} from "lucide-react";

interface TimeTripSlot {
  id: string;
  dateLabel: string;
  quota: number;
  sold?: boolean;
}

interface OutboundBookingMeta {
  startDate: string;
  endDate: string;
  days: number;
  dates: string[];
  label: string;
}

interface CartItemType {
  id: string;
  paxCount: number;
  product: {
    id: string;
    title: string;
    slug?: string;
    category: string;
    price: number;
    image: string;
    metaData?: {
      timeTrips?: TimeTripSlot[];
    } | null;
  };
}

function normalizeCategory(category?: string): string {
  return (category || "").trim().toUpperCase();
}

function getPackageTypesLabel(cartItems: CartItemType[]): string {
  if (cartItems.length === 0) {
    return "Belum ada paket di keranjang";
  }

  const categories = new Set(
    cartItems.map((item) => normalizeCategory(item.product.category))
  );

  const labels: string[] = [];
  if (categories.has("TRIP")) labels.push("Open Trip");
  if (categories.has("OUTBOUND")) labels.push("Outbound");
  if (categories.has("RENTAL") || categories.has("GEAR")) {
    labels.push("Rental");
  }

  return labels.length > 0 ? labels.join(" & ") : "Paket Pilihan";
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedBySlug, setSelectedBySlug] = useState<Record<string, string>>(
    {}
  );
  const [outboundDaysByKey, setOutboundDaysByKey] = useState<
    Record<string, number>
  >({});

  const persistSelectedSchedules = (schedMap: Record<string, string>) => {
    try {
      const toStore: Record<string, { dateLabel: string }> = {};
      for (const [k, v] of Object.entries(schedMap)) {
        if (v) {
          toStore[k] = { dateLabel: v };
        }
      }
      localStorage.setItem(
        "alam_memanggil_selected_schedules",
        JSON.stringify(toStore)
      );
    } catch {
      // abaikan error storage
    }
  };

  const syncCartSchedulesAndDays = (cartItems: CartItemType[]) => {
    let savedSched: Record<string, { dateLabel?: string } | string> = {};
    let savedOutbound: Record<string, OutboundBookingMeta> = {};

    try {
      const rawS = localStorage.getItem("alam_memanggil_selected_schedules");
      savedSched = rawS ? JSON.parse(rawS) : {};
    } catch {
      savedSched = {};
    }

    try {
      const rawO = localStorage.getItem("alam_memanggil_outbound_bookings");
      savedOutbound = rawO ? JSON.parse(rawO) : {};
    } catch {
      savedOutbound = {};
    }

    const nextSchedMap: Record<string, string> = {};
    const nextDaysMap: Record<string, number> = {};

    for (const item of cartItems) {
      const key = item.product.slug || item.product.id;
      const cat = normalizeCategory(item.product.category);

      if (cat === "OUTBOUND") {
        const ob = savedOutbound[key] || savedOutbound[item.product.id];
        const daysVal = Math.max(1, Number(ob?.days || 1));
        nextDaysMap[key] = daysVal;
        nextDaysMap[item.product.id] = daysVal;

        const fromSched = savedSched[key] || savedSched[item.product.id];
        const schedLabel =
          typeof fromSched === "string"
            ? fromSched
            : fromSched?.dateLabel || ob?.label || `${daysVal} Hari`;
        nextSchedMap[key] = schedLabel;
        continue;
      }

      if (cat === "TRIP") {
        const fromStorage = savedSched[key] || savedSched[item.product.id];
        const storageDate =
          typeof fromStorage === "string"
            ? fromStorage
            : fromStorage?.dateLabel || "";

        const slots = item.product.metaData?.timeTrips || [];
        const validSlot = slots.find(
          (s) =>
            !s.sold &&
            Number(s.quota) > 0 &&
            s.dateLabel.trim().toLowerCase() ===
              storageDate.trim().toLowerCase()
        );

        if (validSlot) {
          nextSchedMap[key] = validSlot.dateLabel;
        } else {
          const firstAvail = slots.find(
            (s) => !s.sold && Number(s.quota) > 0
          );
          if (firstAvail) {
            nextSchedMap[key] = firstAvail.dateLabel;
          } else if (storageDate) {
            nextSchedMap[key] = storageDate;
          }
        }
      }
    }

    setSelectedBySlug(nextSchedMap);
    setOutboundDaysByKey(nextDaysMap);
    persistSelectedSchedules(nextSchedMap);
  };

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      const data = await res.json();
      const loadedItems: CartItemType[] = data.items || [];
      setItems(loadedItems);
      syncCartSchedulesAndDays(loadedItems);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Gagal memuat keranjang:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const getItemMultiplier = (item: CartItemType) => {
    const key = item.product.slug || item.product.id;
    const cat = normalizeCategory(item.product.category);
    if (cat === "OUTBOUND") {
      return Math.max(
        1,
        outboundDaysByKey[key] || outboundDaysByKey[item.product.id] || 1
      );
    }
    return Math.max(1, item.paxCount);
  };

  const getMaxPaxForTrip = (item: CartItemType, chosenSchedule: string) => {
    if (normalizeCategory(item.product.category) !== "TRIP") return Infinity;
    const slots = item.product.metaData?.timeTrips || [];
    const matched = slots.find(
      (s) =>
        !s.sold &&
        s.dateLabel.trim().toLowerCase() ===
          chosenSchedule.trim().toLowerCase()
    );
    return matched ? Math.max(1, Number(matched.quota)) : Infinity;
  };

  const handleSelectSchedule = (key: string, dateLabel: string) => {
    setSelectedBySlug((prev) => {
      const updated = { ...prev, [key]: dateLabel };
      persistSelectedSchedules(updated);
      return updated;
    });
  };

  const handleUpdatePax = async (cartItemId: string, newPax: number) => {
    if (newPax < 1) return;
    setUpdatingId(cartItemId);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId, paxCount: newPax }),
      });
      if (!res.ok) {
        console.error("Gagal memperbarui jumlah pax");
      }
      await fetchCart();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteItem = async (cartItemId: string) => {
    setUpdatingId(cartItemId);
    try {
      const res = await fetch(`/api/cart?itemId=${cartItemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Gagal menghapus item");
      }
      await fetchCart();
    } finally {
      setUpdatingId(null);
    }
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * getItemMultiplier(item),
    0
  );

  const packageTypesLabel = getPackageTypesLabel(items);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-[#6F4E37] text-white flex items-center justify-center shadow">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-black flex items-center justify-center shadow">
                {items.length}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-neutral-900">
                Keranjang Saya
              </h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center shadow-sm space-y-4">
            <div className="relative w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200/70 text-[#6F4E37] flex items-center justify-center mx-auto">
              <ShoppingCart className="w-8 h-8" />
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-black flex items-center justify-center">
                0
              </span>
            </div>
            <div>
              <h2 className="text-lg font-black text-neutral-900">
                Keranjang Belanja Masih Kosong
              </h2>
              <p className="text-xs font-medium text-neutral-600 mt-1 max-w-md mx-auto">
                Silakan pilih paket Open Trip, layanan Outbound, atau rental
                perlengkapan terlebih dahulu.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/destination"
                className="inline-flex items-center gap-2 bg-[#6F4E37] hover:bg-[#5a3e2b] text-white text-xs font-black px-6 py-3 rounded-full transition shadow"
              >
                <span>Jelajahi Open Trip</span>
              </Link>
              <Link
                href="/outbound"
                className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-[#6F4E37] border border-[#6F4E37] text-xs font-black px-6 py-3 rounded-full transition"
              >
                <span>Lihat Layanan Outbound</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const key = item.product.slug || item.product.id;
                const cat = normalizeCategory(item.product.category);
                const isTrip = cat === "TRIP";
                const isOutbound = cat === "OUTBOUND";
                const isRental = cat === "RENTAL" || cat === "GEAR";

                const multiplier = getItemMultiplier(item);
                const slots = item.product.metaData?.timeTrips || [];
                const availableSlots = slots.filter(
                  (s) => !s.sold && Number(s.quota) > 0
                );
                const chosenSchedule = selectedBySlug[key] || "";
                const maxTripPax = getMaxPaxForTrip(item, chosenSchedule);
                const reachedMaxPax = isTrip && item.paxCount >= maxTripPax;

                const badgeText = isTrip
                  ? "OPEN TRIP"
                  : isRental
                  ? "RENTAL"
                  : cat;

                const unitPriceLabel = isOutbound
                  ? "hari"
                  : isRental
                  ? "unit"
                  : "pax";

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm"
                  >
                    <div className="relative w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                      <Image
                        src={item.product.image || "/images/BROMO4.jpg"}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          {badgeText}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-neutral-900 truncate">
                        {item.product.title}
                      </h3>
                      <p className="text-xs font-semibold text-neutral-600 mt-0.5">
                        {formatRupiah(item.product.price)} / {unitPriceLabel}
                      </p>

                      {isTrip && (
                        <div className="mt-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5">
                          <label className="flex items-center gap-1.5 text-[11px] font-black text-[#6F4E37] mb-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Jadwal Keberangkatan Dipilih:</span>
                          </label>
                          {availableSlots.length > 0 ? (
                            <select
                              value={chosenSchedule}
                              onChange={(e) =>
                                handleSelectSchedule(key, e.target.value)
                              }
                              className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-neutral-900"
                            >
                              {availableSlots.map((slot) => (
                                <option key={slot.id} value={slot.dateLabel}>
                                  {slot.dateLabel} (Sisa {slot.quota} kuota)
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-xs font-bold text-neutral-900">
                              {chosenSchedule || "Jadwal belum dipilih"}
                            </p>
                          )}
                        </div>
                      )}

                      {isOutbound && chosenSchedule && (
                        <div className="mt-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5">
                          <p className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#6F4E37]">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Jadwal Jasa: {chosenSchedule}</span>
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-200/80">
                        {isTrip ? (
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              disabled={
                                updatingId === item.id || item.paxCount <= 1
                              }
                              onClick={() =>
                                handleUpdatePax(item.id, item.paxCount - 1)
                              }
                              className="w-8 h-8 rounded-lg border border-neutral-300 bg-white text-neutral-900 flex items-center justify-center hover:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 disabled:bg-neutral-50 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <span className="text-xs font-black text-neutral-900 min-w-16 text-center">
                              {item.paxCount} Pax
                            </span>
                            <button
                              type="button"
                              disabled={updatingId === item.id || reachedMaxPax}
                              onClick={() =>
                                handleUpdatePax(item.id, item.paxCount + 1)
                              }
                              title={
                                reachedMaxPax
                                  ? "Batas kuota jadwal tercapai"
                                  : "Tambah pax"
                              }
                              className="w-8 h-8 rounded-lg border border-neutral-300 bg-white text-neutral-900 flex items-center justify-center hover:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 disabled:bg-neutral-50 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : isOutbound ? (
                          <span className="text-xs font-black text-neutral-900">
                            Durasi: {multiplier} Hari
                          </span>
                        ) : (
                          <span className="text-xs font-black text-neutral-900">
                            Jumlah: {multiplier} Unit
                          </span>
                        )}

                        <div className="flex items-center gap-4">
                          <p className="text-sm font-black text-[#6F4E37]">
                            {formatRupiah(item.product.price * multiplier)}
                          </p>
                          <button
                            type="button"
                            disabled={updatingId === item.id}
                            onClick={() => handleDeleteItem(item.id)}
                            title="Hapus item"
                            className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6 h-fit shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-neutral-900">
                  Ringkasan Keranjang
                </h2>
              </div>

              <div className="space-y-2 text-xs text-neutral-700 border-b border-neutral-200/80 pb-4">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">Paket Terisi</span>
                  <span className="font-black text-neutral-900 text-right">
                    {packageTypesLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="font-medium">Metode Pembayaran</span>
                  <span className="font-black text-neutral-900">
                    Transfer Bank Manual
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-neutral-800">
                  Total Pembayaran
                </span>
                <span className="text-lg font-black text-[#6F4E37]">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-full text-xs transition shadow-md cursor-pointer"
              >
                <span>Checkout ({items.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
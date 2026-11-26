"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Loader2,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";

interface AddToCartButtonProps {
  title: string;
  slug: string;
  category: "TRIP" | "OUTBOUND" | "GEAR";
  price: number;
  image: string;
  description?: string;
  label?: string;
  selectedSchedule?: string;
  stayOnPage?: boolean;
}

export default function AddToCartButton({
  title,
  slug,
  category,
  price,
  image,
  description = "",
  label = "KONFIRMASI",
  selectedSchedule,
  stayOnPage = true,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAddedPopup, setShowAddedPopup] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      let effectiveSchedule = selectedSchedule;
      if (!effectiveSchedule && slug) {
        try {
          const raw = localStorage.getItem("alam_memanggil_selected_schedules");
          const map = raw ? JSON.parse(raw) : {};
          const saved = map?.[slug];
          if (typeof saved === "string") {
            effectiveSchedule = saved;
          } else if (saved && typeof saved === "object" && saved.dateLabel) {
            effectiveSchedule = String(saved.dateLabel);
          }
        } catch {
          // abaikan error localStorage
        }
      }

      if (effectiveSchedule && slug) {
        try {
          const raw = localStorage.getItem("alam_memanggil_selected_schedules");
          const map = raw ? JSON.parse(raw) : {};
          map[slug] = effectiveSchedule;
          localStorage.setItem(
            "alam_memanggil_selected_schedules",
            JSON.stringify(map)
          );
        } catch {
          // abaikan error localStorage
        }
      }

      const res = await fetch("/api/cart/add-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          category,
          price,
          image,
          description,
          paxCount: 1,
          selectedSchedule: effectiveSchedule,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.message || "Gagal menambahkan ke keranjang");
        setLoading(false);
        return;
      }

      window.dispatchEvent(new Event("cart-updated"));
      setLoading(false);

      if (stayOnPage) {
        setShowAddedPopup(true);
      } else {
        router.push("/cart");
        router.refresh();
      }
    } catch {
      setErrorMsg("Terjadi kesalahan koneksi");
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 text-black border border-[#734A26] py-2.5 px-6 rounded-full font-black text-xs tracking-widest text-center shadow transform active:scale-95 transition-all duration-300 uppercase cursor-pointer disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>MEMPROSES...</span>
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 text-[#6F4E37]" />
            <span>{label}</span>
          </>
        )}
      </button>

      {errorMsg && (
        <p className="mt-1.5 text-[10px] text-red-600 font-bold text-center">
          {errorMsg}
        </p>
      )}

      {/* POP-UP INFORMASI BERHASIL MASUK KERANJANG (STAY DI HALAMAN) */}
      {showAddedPopup && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-900/15 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddedPopup(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-neutral-900">
                Dimasukkan ke Keranjang!
              </h3>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                <strong>{title}</strong>
                {selectedSchedule ? ` (${selectedSchedule})` : ""} berhasil
                ditambahkan ke keranjang belanja Anda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAddedPopup(false)}
                className="flex-1 py-2.5 px-4 rounded-full border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition cursor-pointer"
              >
                Lanjut Lihat
              </button>
              <Link
                href="/cart"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#6F4E37] hover:bg-[#5a3e2b] text-white font-black text-xs shadow transition"
              >
                <span>Buka Keranjang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
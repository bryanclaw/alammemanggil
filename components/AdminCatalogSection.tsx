"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mountain, ShieldCheck, Loader2, Sparkles } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";

const TRIP_SUBS = ["ALL", "HIKING", "TEKTOK", "ROCK_CLIMBING", "CAVING"];
const OUTBOUND_SUBS = ["ALL", "FLYING_FOX", "RAPELING", "FLYING_FOX_RAPELING"];

interface CatalogProduct {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory?: string | null;
  price: number;
  description: string;
  image: string;
}

export default function AdminCatalogSection() {
  const [category, setCategory] = useState<"ALL" | "TRIP" | "OUTBOUND">("ALL");
  const [subCategory, setSubCategory] = useState<string>("ALL");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category !== "ALL") params.set("category", category);
        if (subCategory !== "ALL") params.set("subCategory", subCategory);

        const res = await fetch(`/api/catalog?${params.toString()}`);
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, [category, subCategory]);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const activeSubList =
    category === "TRIP"
      ? TRIP_SUBS
      : category === "OUTBOUND"
      ? OUTBOUND_SUBS
      : [];

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-[#6F4E37]">
              <Sparkles className="w-3 h-3" /> Paket Terbaru dari Toko
            </span>
            <h2 className="text-xl font-black text-neutral-900 mt-1">
              Katalog Paket Open Trip & Outbound
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCategory("ALL");
                setSubCategory("ALL");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
                category === "ALL"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory("TRIP");
                setSubCategory("ALL");
              }}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
                category === "TRIP"
                  ? "bg-[#6F4E37] text-white"
                  : "bg-amber-50 text-[#6F4E37] hover:bg-amber-100"
              }`}
            >
              <Mountain className="w-3.5 h-3.5" /> Open Trip
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory("OUTBOUND");
                setSubCategory("ALL");
              }}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
                category === "OUTBOUND"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Outbound
            </button>
          </div>
        </div>

        {activeSubList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-100">
            <span className="text-[11px] font-bold text-neutral-400">
              Sub-Kategori:
            </span>
            {activeSubList.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubCategory(sub)}
                className={`px-3 py-1 rounded-full text-[11px] font-black transition cursor-pointer ${
                  subCategory === sub
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {sub.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-7 h-7 animate-spin text-[#6F4E37]" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-8 text-center text-xs text-neutral-500">
          Belum ada paket tambahan pada kategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-neutral-100">
                  <img
                    src={prod.image || "/images/GEDE2.jpg"}
                    alt={prod.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-white/95 text-[#6F4E37]">
                    {prod.category} • {(prod.subCategory || "ALL").replace(/_/g, " ")}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-black text-neutral-900">{prod.title}</h3>
                  <p className="text-lg font-black text-[#6F4E37] mt-1">
                    {formatRupiah(prod.price)}
                  </p>
                  <p className="text-xs text-neutral-600 mt-2 line-clamp-2">
                    {prod.description}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-2">
                <AddToCartButton
                  title={prod.title}
                  slug={prod.slug}
                  category={prod.category === "OUTBOUND" ? "OUTBOUND" : "TRIP"}
                  price={prod.price}
                  image={prod.image || "/images/GEDE2.jpg"}
                  description={prod.description}
                  label="MASUKKAN KERANJANG"
                />
                <Link
                  href={`/catalog/${prod.slug}`}
                  className="block w-full text-center py-2 rounded-full text-[11px] font-black text-neutral-600 hover:bg-neutral-100"
                >
                  Lihat Detail Lengkap →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
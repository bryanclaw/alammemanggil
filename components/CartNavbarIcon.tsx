"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function CartNavbarIcon() {
  const [count, setCount] = useState<number>(0);

  const loadCount = async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setCount(items.length);
    } catch {
      // abaikan jika belum login / jaringan
    }
  };

  useEffect(() => {
    loadCount();
    const handleUpdate = () => {
      loadCount();
    };
    window.addEventListener("cart-updated", handleUpdate);
    return () => window.removeEventListener("cart-updated", handleUpdate);
  }, []);

  return (
    <Link
      href="/cart"
      aria-label="Keranjang"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
    >
      <ShoppingCart className="w-4 h-4" />
      <span
        className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow ${
          count > 0
            ? "bg-amber-400 text-neutral-950"
            : "bg-neutral-700 text-neutral-200"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
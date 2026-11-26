"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ShoppingCart,
  LayoutDashboard,
} from "lucide-react";

const menus = [
  { name: "Home", href: "/" },
  { name: "Destination", href: "/destination" },
  { name: "Outbound", href: "/outbound", hidden: true }, // disembunyikan sementara
  { name: "Rentals", href: "/catalog" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleMenus = menus.filter((menu) => !menu.hidden);

  const fetchCartCount = useCallback(async () => {
    if (status !== "authenticated") {
      setCartCount(0);
      return;
    }

    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      setCartCount(items.length);
    } catch {
      // abaikan error jaringan sementara
    }
  }, [status]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount, pathname]);

  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, [fetchCartCount]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMenuOpen]);

  return (
    <nav className="bg-[#6F4E37] antialiased select-none relative z-50 shadow-md">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6">
        {/* BARIS UTAMA */}
        <div className="flex h-16 items-center justify-between gap-2">
          {/* LOGO */}
          <Link
            href="/"
            className="text-base sm:text-2xl font-black text-white tracking-wider hover:opacity-90 transition truncate shrink-0"
          >
            ALAM MEMANGGIL
          </Link>

          {/* CONTAINER NAVIGASI DESKTOP (TIDAK DIUBAH) */}
          <ul className="hidden md:flex gap-2 bg-black/15 p-1.5 rounded-full border border-white/10">
            {visibleMenus.map((menu) => {
              const isActive = pathname === menu.href;

              return (
                <li key={menu.href} className="relative group">
                  <Link
                    href={menu.href}
                    className={`relative z-10 block px-5 py-2 text-xs transition-colors duration-300 ease-out rounded-full ${
                      isActive
                        ? "text-black font-bold"
                        : "font-bold text-white group-hover:!text-black"
                    }`}
                  >
                    {menu.name}
                  </Link>

                  {isActive ? (
                    <div className="absolute inset-0 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] z-0" />
                  ) : (
                    <div className="absolute inset-0 bg-white rounded-full scale-90 opacity-0 transition-all duration-300 ease-out z-0 group-hover:scale-100 group-hover:opacity-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] pointer-events-none" />
                  )}
                </li>
              );
            })}
          </ul>

          {/* AREA AUTH / KERANJANG / PROFILE */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {status === "loading" ? (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 animate-pulse" />
            ) : session?.user ? (
              <>
                {/* IKON KERANJANG (E-COMMERCE) */}
                <Link
                  href="/cart"
                  title={`Keranjang (${cartCount})`}
                  className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/20 hover:bg-black/30 text-white border border-white/10 transition shrink-0"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span
                    className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow ${
                      cartCount > 0
                        ? "bg-amber-400 text-neutral-950"
                        : "bg-neutral-700 text-neutral-200"
                    }`}
                  >
                    {cartCount}
                  </span>
                </Link>

                {/* KONDISI 1: SUDAH LOGIN (Dropdown Avatar & Profile) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-1.5 sm:gap-2.5 bg-black/20 hover:bg-black/30 text-white px-2.5 sm:px-3 py-1.5 rounded-full border border-white/10 transition text-xs font-semibold cursor-pointer"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-[#6F4E37] flex items-center justify-center font-bold shadow-sm shrink-0">
                      {session.user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="max-w-[68px] sm:max-w-[100px] truncate">
                      {session.user.name || "Profile"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                        isMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Profile */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-100 rounded-2xl shadow-2xl p-2 text-xs text-neutral-800 z-50">
                      <div className="px-3 py-2.5 border-b border-neutral-100 mb-1">
                        <p className="font-bold truncate text-neutral-900">
                          {session.user.name}
                        </p>
                        <p className="text-neutral-500 text-[10px] truncate">
                          {session.user.email}
                        </p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-neutral-700 hover:bg-neutral-100 rounded-xl transition font-semibold"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#6F4E37]" />
                        <span>Dashboard & Profile</span>
                      </Link>

                      {(session.user as { role?: string })?.role === "ADMIN" && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition font-semibold"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Dashboard Admin</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition mt-1 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* KONDISI 2: BELUM LOGIN (Tombol Masuk/Login Kapsul) */
              <Link
                href="/login"
                className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-neutral-100 text-[#6F4E37] px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-black transition-all shadow-md active:scale-95 shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>

        {/* NAVIGASI KHUSUS LAYAR HP (< md) */}
        <div className="md:hidden pb-2.5 pt-0.5">
          <ul className="flex items-center justify-between gap-1.5 bg-black/15 p-1 rounded-full border border-white/10">
            {visibleMenus.map((menu) => {
              const isActive = pathname === menu.href;

              return (
                <li key={menu.href} className="relative flex-1 text-center">
                  <Link
                    href={menu.href}
                    className={`relative z-10 block py-1.5 px-2 text-[11px] transition-colors duration-200 rounded-full truncate ${
                      isActive
                        ? "text-black font-bold bg-white shadow-xs"
                        : "font-bold text-white hover:bg-white/15"
                    }`}
                  >
                    {menu.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
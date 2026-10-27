"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { User, LogOut, ShieldCheck, ChevronDown } from "lucide-react";

const menus = [
  { name: "Home", href: "/" },
  { name: "Destination", href: "/destination" },
  { name: "Outbound", href: "/outbound" },
  { name: "Catalog", href: "/catalog" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[#6F4E37] antialiased select-none relative z-50 shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* LOGO */}
        <Link href="/" className="text-2xl font-black text-white tracking-wider hover:opacity-90 transition">
          ALAM MEMANGGIL
        </Link>

        {/* CONTAINER NAVIGASI */}
        <ul className="flex gap-2 bg-black/15 p-1.5 rounded-full border border-white/10">
          {menus.map((menu) => {
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

        {/* AREA AUTH / LOGIN */}
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-white/20 animate-pulse" />
          ) : session?.user ? (
            /* KONDISI 1: SUDAH LOGIN (Dropdown Avatar User) */
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2.5 bg-black/20 hover:bg-black/30 text-white px-3 py-1.5 rounded-full border border-white/10 transition text-xs font-semibold"
              >
                <div className="w-7 h-7 rounded-full bg-white text-[#6F4E37] flex items-center justify-center font-bold shadow-sm">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="max-w-[100px] truncate">{session.user.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu Profile */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-neutral-100 rounded-2xl shadow-2xl p-2 text-xs text-neutral-800 z-50">
                  <div className="px-3 py-2.5 border-b border-neutral-100 mb-1">
                    <p className="font-bold truncate text-neutral-900">{session.user.name}</p>
                    <p className="text-neutral-500 text-[10px] truncate">{session.user.email}</p>
                  </div>

                  {(session.user as any)?.role === "ADMIN" && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition font-semibold"
                    >
                      <ShieldCheck className="w-4 h-4" /> Dashboard Admin
                    </Link>
                  )}

                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition mt-1 font-semibold"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* KONDISI 2: BELUM LOGIN (Tombol Masuk/Login Kapsul) */
            <Link
              href="/login"
              className="flex items-center gap-2 bg-white hover:bg-neutral-100 text-[#6F4E37] px-5 py-2 rounded-full text-xs font-black transition-all shadow-md active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}
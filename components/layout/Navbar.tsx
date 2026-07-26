"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { name: "Home", href: "/" },
  { name: "Destination", href: "/destination" },
  { name: "Outbound", href: "/outbound" },
  { name: "Catalog", href: "/Catalog" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    // Latar belakang Coklat Asli & Lebar Penuh Dipertahankan 100%
    <nav className="bg-[#6F4E37] antialiased select-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* LOGO Asli Dipertahankan 100% */}
        <h1 className="text-2xl font-black text-white">
          ALAM MEMANGGIL
        </h1>

        {/* CONTAINER NAVIGASI */}
        <ul className="flex gap-2 bg-black/10 p-1.5 rounded-full border border-white/5">
          {menus.map((menu) => {
            const isActive = pathname === menu.href;

            return (
              <li key={menu.href} className="relative group">
                
               {/* SOLUSI PASTI: Menggunakan arbitary values untuk force kontras */}
                <Link
                  href={menu.href}
                  // text-xs dan font-semibold tetap, warna teks dipindah
                  className={`relative z-10 block px-5 py-2 text-xs transition-colors duration-300 ease-out rounded-full ${
                    isActive
                      ? "text-black font-bold" // 1. Teks Aktif: Hitam permanen
                      : "font-bold text-white group-hover:!text-black" // 2. Teks Tidak Aktif: Putih aslinya, FORCE hitam saat hover dengan '!'
                  }`}
                >
                  {menu.name}
                </Link>

                {/* LOGIK BACKGROUND KAPSUL WHITE SOLID (1000% SAMA) */}
                {isActive ? (
                  /* 1. JIKA AKTIF: Kapsul putih solid menetap permanen (Stay Active) */
                  <div className="absolute inset-0 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.08)] z-0" />
                ) : (
                  /* 2. JIKA HOVER: Kapsul membesar dengan warna PUTIH SOLID penuh (z-0 di bawah z-10 teks) */
                  <div className="absolute inset-0 bg-white rounded-full scale-90 opacity-0 transition-all duration-300 ease-out z-0 group-hover:scale-100 group-hover:opacity-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] pointer-events-none" />
                )}

              </li>
            );
          })}
        </ul>

      </div>
    </nav>
  );
}
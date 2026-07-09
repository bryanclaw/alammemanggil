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

        {/* REKAYASA NAVIGASI: Hanya Efek Hover Kapsul Cair Tanpa Animasi Halaman Aktif */}
        <ul className="flex gap-2 bg-black/10 p-1.5 rounded-full border border-white/5">
          {menus.map((menu) => (
            // Menggunakan 'group' untuk mentrigger transisi kapsul hover di bawahnya
            <li key={menu.href} className="relative group">
              
              {/* PERBAIKAN: Menambahkan 'relative z-10' di sini agar Link berada di lapisan teratas dan bisa diklik */}
              <Link
                href={menu.href}
                className={`relative z-10 block px-5 py-2 text-xs font-semibold tracking-wide transition-colors duration-300 ease-out rounded-full ${
                  pathname === menu.href
                    ? "font-bold text-black" // Warna teks aktif bawaan Anda tetap dipertahankan 100%
                    : "text-white group-hover:text-black" // Teks otomatis hitam saat disorot kursor
                }`}
              >
                {menu.name}
              </Link>

              {/* PERBAIKAN: Memastikan layer background menggunakan '-z-10' agar berada di bawah teks Link */}
              <div
                className="absolute inset-0 bg-white rounded-full scale-90 opacity-0 transition-all duration-350 ease-out -z-10 group-hover:scale-100 group-hover:opacity-100 shadow-[0_2px_10px_rgba(255,255,255,0.05)] pointer-events-none"
              />
            </li>
          ))}
        </ul>

      </div>
    </nav>
  );
}
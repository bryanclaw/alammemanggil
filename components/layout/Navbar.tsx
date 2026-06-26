"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { name: "Home", href: "/" },
  { name: "Destination", href: "/destination" },
  { name: "Outbound", href: "/outbound" },
  { name: "Information", href: "/information" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#7B5538]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <h1 className="text-2xl font-black text-white">
          ALAM MEMANGGIL
        </h1>

        <ul className="flex gap-8">
          {menus.map((menu) => (
            <li key={menu.href}>
              <Link
                href={menu.href}
                className={`transition ${
                  pathname === menu.href
                    ? "font-semibold text-amber-300"
                    : "text-white hover:text-amber-200"
                }`}
              >
                {menu.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
import Link from "next/link";
import { Mail, MapPin, Clock3 } from "lucide-react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <div className="bg-[#F6F4F1] pt-10 sm:pt-12 overflow-x-hidden">
      <footer className="bg-[#F6F4F1]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-8 sm:pb-10">
          {/* Grid Konten Utama */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4 items-start">
            {/* Contact */}
            <div className="flex flex-col justify-center min-w-0">
              <h3 className="mb-2.5 sm:mb-3 text-base sm:text-lg font-bold text-[#5C4033] tracking-wide">
                Contact Us
              </h3>
              <p className="mb-3 text-xs sm:text-sm text-gray-600 leading-snug">
                We&apos;d love to hear from you.
              </p>
              <div className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail size={16} className="shrink-0 text-[#5C4033]" />
                  <Link
                    href="mailto:alammemanggil@gmail.com"
                    className="transition hover:text-[#7B5538] leading-snug break-all sm:break-normal"
                  >
                    alammemanggil@gmail.com
                  </Link>
                </div>
                <div className="flex items-center gap-2.5 min-w-0">
                  <FaWhatsapp size={16} className="text-green-600 shrink-0" />
                  <Link
                    href="https://wa.me/6281292548524"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-[#7B5538] leading-snug"
                  >
                    +62 812 9254 8524
                  </Link>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex flex-col justify-center min-w-0">
              <h3 className="mb-2.5 sm:mb-3 text-base sm:text-lg font-bold text-[#5C4033] tracking-wide">
                Location
              </h3>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 leading-snug">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#5C4033]" />
                <span>
                  Jakarta Barat
                  <br />
                  Indonesia
                </span>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="flex flex-col justify-center min-w-0">
              <h3 className="mb-2.5 sm:mb-3 text-base sm:text-lg font-bold text-[#5C4033] tracking-wide">
                Operating Hours
              </h3>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 leading-snug">
                <Clock3 size={16} className="mt-0.5 shrink-0 text-[#5C4033]" />
                <div>
                  <p>Monday – Friday</p>
                  <p className="text-gray-600">09:00 – 17:00 WIB (UTC+7)</p>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="flex flex-col justify-center min-w-0">
              <h3 className="mb-2.5 sm:mb-3 text-base sm:text-lg font-bold text-[#5C4033] tracking-wide">
                Follow Us
              </h3>
              <div className="flex items-center gap-4 text-[#5C4033] h-8">
                <Link
                  href="https://www.instagram.com/alammemanggil_"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="transition duration-300 hover:scale-110 hover:text-pink-600 flex items-center"
                >
                  <FaInstagram size={22} className="sm:w-6 sm:h-6" />
                </Link>
                <Link
                  href="https://www.tiktok.com/@alammemanggil"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="transition duration-300 hover:scale-110 hover:text-black flex items-center"
                >
                  <FaTiktok size={20} className="sm:w-[22px] sm:h-[22px]" />
                </Link>
              </div>
            </div>
          </div>

          {/* Garis Pembatas Sederhana */}
          <div className="my-6 sm:my-8 border-t border-gray-300/60" />

          {/* Bagian Copyright & Slogan (Presisi Tengah Aligned) */}
          <div className="flex flex-col items-center justify-between gap-2 text-center text-xs text-gray-600 md:flex-row md:text-left h-auto md:h-6">
            <p className="leading-relaxed md:leading-none flex items-center">
              © {new Date().getFullYear()} Alam Memanggil. All rights reserved.
            </p>
            <p className="font-semibold text-[#5C4033] leading-relaxed md:leading-none flex items-center">
              Jawab Panggilan, Taklukkan Alam!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
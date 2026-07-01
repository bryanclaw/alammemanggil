import Link from "next/link";
import { Mail, MapPin, Clock3 } from "lucide-react";
import { FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-[#F6F4F1]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Contact */}
          <div>
            <h3 className="mb-6 text-xl font-bold text-[#5C4033]">
              Contact Us
            </h3>

            <p className="mb-4 text-gray-600">
              We'd love to hear from you.
            </p>

            <div className="space-y-4 text-gray-700">
              <div className="flex items-center gap-3">
                <Mail size={18} />
                <Link
                  href="mailto:alammemanggil@gmail.com"
                  className="transition hover:text-[#7B5538]"
                >
                  alammemanggil@gmail.com
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <FaWhatsapp size={18} className="text-green-600" />
                <Link
                  href="https://wa.me/6281292548524"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#7B5538]"
                >
                  +62 812 9254 8524
                </Link>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="mb-6 text-xl font-bold text-[#5C4033]">
              Location
            </h3>

            <div className="flex items-start gap-3 text-gray-700">
              <MapPin size={18} className="mt-1 shrink-0" />
              <span>
                Jakarta Barat
                <br />
                Indonesia
              </span>
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="mb-6 text-xl font-bold text-[#5C4033]">
              Operating Hours
            </h3>

            <div className="flex items-start gap-3 text-gray-700">
              <Clock3 size={18} className="mt-1 shrink-0" />
              <div>
                <p>Monday – Friday</p>
                <p>09:00 – 17:00 WIB (UTC+7)</p>
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-6 text-xl font-bold text-[#5C4033]">
              Follow Us
            </h3>

            <div className="flex items-center gap-5 text-[#5C4033]">
              <Link
                href="https://www.instagram.com/alammemanggil_"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition duration-300 hover:scale-110 hover:text-pink-600"
              >
                <FaInstagram size={30} />
              </Link>

              <Link
                href="https://www.tiktok.com/@alammemanggil"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="transition duration-300 hover:scale-110 hover:text-black"
              >
                <FaTiktok size={28} />
              </Link>
            </div>
          </div>
        </div>

        <div className="my-10 border-t border-gray-300" />

        <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-gray-600 md:flex-row md:text-left">
          <p>
            © {new Date().getFullYear()} Alam Memanggil. All rights reserved.
          </p>

          <p className="font-medium text-[#5C4033]">
            Jawab Panggilan, Taklukkan Alam!
          </p>
        </div>
      </div>
    </footer>
  );
}
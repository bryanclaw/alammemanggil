"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle2 } from "lucide-react";

// ================= Ikon Medsos (WA, IG, TikTok) =================
const WhatsAppIcon = () => (
  <svg className="w-4 h-4 text-neutral-600 hover:text-green-600 transition-colors" fill="currentColor" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4 text-neutral-600 hover:text-pink-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-4 h-4 text-neutral-600 hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.67 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.31 1.56-1.28 2.57.02 1.01.58 1.95 1.43 2.47.88.54 2.01.62 2.96.22 1.01-.41 1.71-1.38 1.78-2.46.03-3.6.01-7.2.02-10.8z"/>
  </svg>
);

// Data Slider (Disamakan dengan halaman auth lain)
const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop",
    title: "Atur Ulang Kata Sandi Akun Anda",
  },
  {
    image: "/images/gunungrinjani.png",
    title: "Kembali Menikmati Perjalanan Seru",
  },
  {
    image: "/images/BROMO2.jpeg",
    title: "Jelajahi Keindahan Alam Indonesia",
  }
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto Slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulasi request reset password
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans overflow-hidden bg-neutral-950">
      
      {/* 1. BACKGROUND BESAR */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/BROMO4.jpg"
          alt="Large Canvas Background"
          fill
          className="object-cover filter blur-md scale-105 opacity-85"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/60 via-black/40 to-orange-950/30" />
      </div>

      {/* 2. KONTAINER UTAMA APPLE GLASS */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-[400px] backdrop-blur-2xl bg-white/100 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-2.5 my-auto border border-white/60"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center min-h-[380px]">
          
          {/* ================= SISI KIRI: SLIDER HERO ================= */}
          <div className="md:col-span-5 relative rounded-[18px] overflow-hidden flex flex-col justify-between p-4 h-full min-h-[220px] md:min-h-[380px]">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-0"
              >
                <Image
                  src={SLIDES[activeSlide].image}
                  alt="Slider Image"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20" />
              </motion.div>
            </AnimatePresence>

            {/* Title & Dots Indicator */}
            <div className="relative z-10 space-y-2 mt-auto">
              <h2 className="text-white text-sm font-bold leading-snug">
                {SLIDES[activeSlide].title}
              </h2>

              <div className="flex items-center gap-1.5 pt-1">
                {SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeSlide === idx ? "w-4 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* ================= SISI KANAN: FORM LUPA PASSWORD ================= */}
          <div className="md:col-span-7 flex flex-col justify-between px-3 py-2 h-full">
            
            <div className="max-w-[230px] mx-auto w-full my-auto space-y-4">
              
              {submitted ? (
                /* state setelah email terkirim */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="text-center space-y-3 py-2"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-neutral-900">Instruksi Terkirim!</h2>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      Kami telah mengirimkan instruksi pemulihan ke <span className="font-bold text-neutral-800">{email}</span>.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link 
                      href="/login" 
                      className="inline-block w-full bg-white hover:bg-emerald-600 border border-neutral-300 hover:border-emerald-600 text-neutral-800 hover:text-white font-bold py-1.5 px-4 rounded-full text-[11px] transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                    >
                      Kembali ke Login
                    </Link>
                  </div>
                </motion.div>
              ) : (
                /* state formulir input email */
                <>
                  {/* Header Title */}
                  <div className="text-center space-y-0.5">
                    <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                      Lupa Password
                    </h1>
                    <p className="text-[10px] text-neutral-800 text-white font-medium">
                      Masukkan email untuk terima tautan reset
                    </p>
                  </div>

                  {/* Form Input */}
                  <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                    <div className="relative w-full">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Alamat Email"
                        className="w-full bg-white/90 border border-neutral-300 rounded-lg px-3 py-1.5 pr-8 text-[11px] text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-neutral-800 focus:bg-white transition"
                      />
                      <Mail className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    </div>

                    {/* Tombol Reset */}
                    <div className="flex justify-center pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-neutral-900 border border-neutral-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 font-bold py-1.5 px-4 rounded-full text-[11px] transition-colors duration-200 shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#10b981"; // Emerald 500
                          e.currentTarget.style.color = "#ffffff";
                          e.currentTarget.style.borderColor = "#10b981";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#ffffff";
                          e.currentTarget.style.color = "#171717";
                          e.currentTarget.style.borderColor = "#d4d4d4";
                        }}
                      >
                        {loading ? "Mengirim..." : "Reset Kata Sandi"}
                      </button>
                    </div>
                  </form>

                  {/* Login Link */}
                  <p className="text-center text-[10px] text-neutral-400 font-medium pt-1">
                    Sudah ingat kata sandi?{" "}
                    <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition">
                      Masuk
                    </Link>
                  </p>
                </>
              )}

            </div>

            {/* Bottom Social Links */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="p-1 rounded-full hover:bg-white/80 transition"
              >
                <WhatsAppIcon />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram"
                className="p-1 rounded-full hover:bg-white/80 transition"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                title="TikTok"
                className="p-1 rounded-full hover:bg-white/80 transition"
              >
                <TikTokIcon />
              </a>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
}
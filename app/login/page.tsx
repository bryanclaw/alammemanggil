"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

// ================= Logo Google Original (Full Color) =================
const GoogleColorIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
  </svg>
);

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

// Data Slider
const SLIDES = [
  {
    image: "/images/gunungrinjani.png",
    title: "Masuk & Kelola Pesanan Anda",
  },
  {
    image: "/images/BROMO2.jpeg",
    title: "Jelajahi Tempat Impian Anda",
  },
  {
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop",
    title: "Nikmati Pengalaman Terbaik",
  }
];

export default function GlassLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto Slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Handler Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email atau kata sandi salah.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  // Handler Login Google
  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/" });
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

      {/* 2. GRID PERSEGI KECIL & APPLE GLASS */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-[400px] backdrop-blur-2xl bg-white/100 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-2.5 my-auto border border-white/60"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center min-h-[380px]">
          
          {/* SISI KIRI: SLIDER HERO PERSEGI */}
          <div className="md:col-span-5 relative rounded-[18px] overflow-hidden flex flex-col justify-between p-4 h-full min-h-[250px] md:min-h-[360px]">
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
            <div className="relative z-10 space-y-2">
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

          {/* SISI KANAN: FORM LOGIN */}
          <div className="md:col-span-7 flex flex-col justify-between px-3 py-2 h-full">
            <div className="max-w-[230px] mx-auto w-full my-auto space-y-3">
              
              {/* Header Title */}
              <div className="text-center space-y-0.5">
                <h1 className="text-xl font-black text-neutral-900 tracking-tight">
                  Selamat Datang
                </h1>
                <p className="text-[10px] text-neutral-500 font-medium">
                  Masuk untuk mengelola akun Anda
                </p>
              </div>

              {/* Tombol Google */}
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full py-1.5 px-3 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-[11px] font-bold text-neutral-700 flex items-center justify-center gap-2 transition shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                <GoogleColorIcon />
                <span>Masuk dengan Google</span>
              </button>

              {/* Divider ATAU */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-neutral-300 w-full" />
                <span className="bg-white/90 px-3 text-[9px] text-neutral-800 font-medium absolute rounded-full">
                  atau
                </span>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-1.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5 text-red-600 text-[10px] font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Alamat Email"
                    className="w-full bg-white/90 border border-neutral-300 rounded-lg px-3 py-2 text-[11px] text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-neutral-800 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Kata Sandi"
                      className="w-full bg-white/90 border border-neutral-300 rounded-lg px-3 py-2 text-[11px] text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:border-neutral-800 focus:bg-white transition"
                    />
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-neutral-400 hover:text-neutral-800 transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5 text-neutral-600" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </button>
                  </div>

                  <div className="text-right">
                    <Link
                      href="/lupa-sandi"
                      className="text-[9px] text-neutral-400 hover:text-emerald-600 font-medium transition-colors"
                    >
                      Lupa Kata Sandi?
                    </Link>
                  </div>
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full max-w-[140px] bg-white text-neutral-900 border border-neutral-300 font-bold py-1.5 px-4 rounded-full text-[11px] transition-colors duration-200 shadow-sm active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? "Memproses..." : "Masuk"}
                  </button>
                </div>
              </form>

              <p className="text-center text-[10px] text-neutral-400 font-medium">
                Belum memiliki Akun?{" "}
                <Link href="/daftar" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition">
                  Daftar
                </Link>
              </p>
            </div>

            {/* Bottom Social Links */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="p-1 rounded-full hover:bg-white/80 transition">
                <WhatsAppIcon />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-1 rounded-full hover:bg-white/80 transition">
                <InstagramIcon />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="p-1 rounded-full hover:bg-white/80 transition">
                <TikTokIcon />
              </a>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
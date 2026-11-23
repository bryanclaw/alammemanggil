"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Gagal mereset kata sandi.");
        setLoading(false);
        return;
      }

      setSuccess(data.message || "Kata sandi berhasil direset.");
      setLoading(false);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setError("Terjadi kesalahan koneksi.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/BROMO4.jpg"
          alt="Background"
          fill
          className="object-cover filter blur-md scale-105 opacity-85"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/60 via-black/40 to-orange-950/30" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-[360px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] p-6 border border-white/60"
      >
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-black text-neutral-900 tracking-tight">
              Lupa Kata Sandi
            </h1>
            <p className="text-[11px] text-neutral-500 font-medium">
              Masukkan email terdaftar & kata sandi baru Anda
            </p>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-[11px] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-[11px] font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Alamat Email Terdaftar"
              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-800"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kata Sandi Baru"
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-800"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi Kata Sandi Baru"
              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-800"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-full text-xs transition shadow-sm cursor-pointer disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
            </button>
          </form>

          <div className="text-center pt-1">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-neutral-900 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
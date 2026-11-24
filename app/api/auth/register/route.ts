import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    const hasDatabase =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DIRECT_URL ||
      process.env.POSTGRES_URL;

    if (!hasDatabase) {
      console.error("Database connection string is not defined in environment variables.");
      return NextResponse.json(
        {
          message:
            "Koneksi database belum dikonfigurasi. Pastikan DATABASE_URL atau Vercel Postgres Storage sudah ditambahkan di pengaturan hosting (Vercel).",
        },
        { status: 500 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar. Gunakan email lain." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke database
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: "USER", // default role
      },
    });

    return NextResponse.json(
      { message: "Registrasi berhasil!", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error register:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Terjadi kesalahan pada server.";

    if (
      errorMessage.includes("Can't reach database") ||
      errorMessage.includes("P1001") ||
      errorMessage.includes("DatabaseNotReachable")
    ) {
      return NextResponse.json(
        {
          message:
            "Tidak dapat terhubung ke server database. Periksa apakah DATABASE_URL valid dan server database aktif.",
        },
        { status: 500 }
      );
    }

    if (errorMessage.includes("P2021") || errorMessage.includes("does not exist")) {
      return NextResponse.json(
        {
          message:
            "Tabel database belum dibuat. Jalankan 'npx prisma db push' terlebih dahulu.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV !== "production"
            ? `Gagal mendaftar: ${errorMessage}`
            : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
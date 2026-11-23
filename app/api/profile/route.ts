import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      password: true,
      role: true,
    },
  });
}

// 1. GET: Ambil data profil user saat ini
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { password: _password, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { message: "Gagal memuat data profil" },
      { status: 500 }
    );
  }
}

// 2. PATCH: Update data profil atau ganti kata sandi
export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Mode A: Ganti Kata Sandi
    if (body.action === "change-password") {
      const { currentPassword, newPassword } = body;

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { message: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      // Jika akun sudah punya password sebelumnya, wajib verifikasi password lama
      if (user.password) {
        if (!currentPassword) {
          return NextResponse.json(
            { message: "Kata sandi saat ini wajib diisi." },
            { status: 400 }
          );
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return NextResponse.json(
            { message: "Kata sandi saat ini tidak sesuai." },
            { status: 400 }
          );
        }
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        message: "Kata sandi berhasil diperbarui.",
      });
    }

    // Mode B: Update Informasi Profil
    const { name, phone, address } = body;
    if (!name?.trim()) {
      return NextResponse.json(
        { message: "Nama lengkap wajib diisi." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "Profil berhasil disimpan.",
      user: updated,
    });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui profil" },
      { status: 500 }
    );
  }
}
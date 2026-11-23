import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Helper untuk mendapatkan user ID dari session aktif
async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
  });
}

// 1. GET: Ambil isi keranjang user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: { product: true },
          orderBy: { id: "asc" },
        },
      },
    });

    return NextResponse.json({
      items: cart?.items ?? [],
    });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ message: "Gagal memuat keranjang" }, { status: 500 });
  }
}

// 2. POST: Tambah produk/trip ke keranjang
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { productId, paxCount = 1 } = await req.json();

    if (!productId || paxCount < 1) {
      return NextResponse.json({ message: "Data produk tidak valid" }, { status: 400 });
    }

    // Pastikan user sudah punya record Cart, kalau belum buatkan otomatis
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // Jika produk sudah ada di keranjang, tambah jumlah pax-nya; jika belum, buat item baru
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { paxCount: existingItem.paxCount + Number(paxCount) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          paxCount: Number(paxCount),
        },
      });
    }

    return NextResponse.json({ message: "Berhasil ditambahkan ke keranjang" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json({ message: "Gagal menambahkan ke keranjang" }, { status: 500 });
  }
}

// 3. PATCH: Update jumlah pax/kuantitas item di keranjang
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { cartItemId, paxCount } = await req.json();

    if (!cartItemId || paxCount < 1) {
      return NextResponse.json({ message: "Jumlah minimal adalah 1" }, { status: 400 });
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { paxCount: Number(paxCount) },
    });

    return NextResponse.json({ message: "Jumlah diperbarui" });
  } catch (error) {
    console.error("PATCH /api/cart error:", error);
    return NextResponse.json({ message: "Gagal memperbarui jumlah" }, { status: 500 });
  }
}

// 4. DELETE: Hapus item dari keranjang
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cartItemId = searchParams.get("itemId");

    if (!cartItemId) {
      return NextResponse.json({ message: "ID item diperlukan" }, { status: 400 });
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json({ message: "Item dihapus dari keranjang" });
  } catch (error) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json({ message: "Gagal menghapus item" }, { status: 500 });
  }
}
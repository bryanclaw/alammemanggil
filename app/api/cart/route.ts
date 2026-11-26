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
    return NextResponse.json(
      { message: "Gagal memuat keranjang" },
      { status: 500 }
    );
  }
}

// 2. POST: Tambah produk/trip/rental ke keranjang (dibatasi maksimal stok produk)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const productId = String(body?.productId || "");
    const rawQty = Number(body?.quantity ?? body?.paxCount ?? 1);

    if (!productId || !Number.isFinite(rawQty) || rawQty < 1) {
      return NextResponse.json(
        { message: "Data produk tidak valid" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, stock: true },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const maxStock = Math.max(0, Number(product.stock) || 0);
    if (maxStock <= 0) {
      return NextResponse.json(
        { message: `Stok "${product.title}" sedang habis.` },
        { status: 400 }
      );
    }

    const addQty = Math.floor(rawQty);

    // Pastikan user sudah punya record Cart, kalau belum buatkan otomatis
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    const currentInCart = existingItem ? Number(existingItem.paxCount) || 0 : 0;
    const nextTotalQty = Math.min(maxStock, currentInCart + addQty);

    if (currentInCart >= maxStock) {
      return NextResponse.json(
        {
          message: `Jumlah di keranjang sudah mencapai stok tersedia (${maxStock}).`,
        },
        { status: 400 }
      );
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { paxCount: nextTotalQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          paxCount: nextTotalQty,
        },
      });
    }

    return NextResponse.json(
      { message: "Berhasil ditambahkan ke keranjang" },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan ke keranjang" },
      { status: 500 }
    );
  }
}

// 3. PATCH: Update jumlah pax/kuantitas item di keranjang (dibatasi stok produk)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { cartItemId, paxCount } = await req.json();
    const parsedCount = Number(paxCount);

    if (!cartItemId || !Number.isFinite(parsedCount) || parsedCount < 1) {
      return NextResponse.json(
        { message: "Jumlah minimal adalah 1" },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: { select: { stock: true } } },
    });

    if (!cartItem) {
      return NextResponse.json(
        { message: "Item keranjang tidak ditemukan" },
        { status: 404 }
      );
    }

    const maxStock = Math.max(1, Number(cartItem.product?.stock) || 1);
    const clampedCount = Math.min(maxStock, Math.floor(parsedCount));

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { paxCount: clampedCount },
    });

    return NextResponse.json({ message: "Jumlah diperbarui", paxCount: clampedCount });
  } catch (error) {
    console.error("PATCH /api/cart error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui jumlah" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { message: "ID item diperlukan" },
        { status: 400 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json({ message: "Item dihapus dari keranjang" });
  } catch (error) {
    console.error("DELETE /api/cart error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus item" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Akun pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    const { title, slug, category, price, image, description, paxCount = 1 } =
      await req.json();

    if (!title || !slug || !price) {
      return NextResponse.json(
        { message: "Data paket tidak lengkap" },
        { status: 400 }
      );
    }

    // 1. Pastikan produk tercatat di tabel Product (pertahankan stock & metaData yang sudah ada jika sudah ada)
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        title,
        price: Number(price),
        image: image || "/images/BROMO4.jpg",
        description: description || title,
      },
      create: {
        title,
        slug,
        category: category || "TRIP",
        price: Number(price),
        image: image || "/images/BROMO4.jpg",
        description: description || title,
        stock: 20,
      },
    });

    const maxStock = Math.max(0, Number(product.stock) || 0);
    if (maxStock <= 0) {
      return NextResponse.json(
        { message: `Kuota / stok "${product.title}" sedang habis.` },
        { status: 400 }
      );
    }

    // 2. Pastikan user punya Cart
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // 3. Tambah item ke CartItem (akumulasi jika sudah ada, dibatasi stok)
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
    });

    const currentInCart = existingItem ? Number(existingItem.paxCount) || 0 : 0;
    const requestedAdd = Math.max(1, Math.floor(Number(paxCount) || 1));
    const nextQty = Math.min(maxStock, currentInCart + requestedAdd);

    if (currentInCart >= maxStock) {
      return NextResponse.json(
        { message: `Jumlah sudah mencapai kuota/stok tersedia (${maxStock}).` },
        { status: 400 }
      );
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { paxCount: nextQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          paxCount: nextQty,
        },
      });
    }

    return NextResponse.json(
      { message: "Berhasil masuk ke keranjang", productId: product.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/cart/add-item error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan item ke keranjang" },
      { status: 500 }
    );
  }
}
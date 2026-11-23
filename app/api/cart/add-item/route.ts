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

    // 1. Pastikan produk tercatat di tabel Product agar relasi CartItem & OrderItem valid
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

    // 2. Pastikan user punya Cart
    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // 3. Tambah item ke CartItem (akumulasi jika sudah ada)
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
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
          productId: product.id,
          paxCount: Number(paxCount),
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
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(category && category !== "ALL" ? { category: category as never } : {}),
        ...(subCategory && subCategory !== "ALL"
          ? { subCategory: subCategory as never }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    // Jika category="RENTAL" belum terdaftar di Prisma Enum, kembalikan list kosong aman
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    if (category === "RENTAL") {
      try {
        const allActive = await prisma.product.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        });
        const rentalOnly = allActive.filter(
          (p) => String(p.category || "").toUpperCase() === "RENTAL"
        );
        return NextResponse.json({ products: rentalOnly });
      } catch {
        return NextResponse.json({ products: [] });
      }
    }

    console.error("GET /api/catalog error:", error);
    return NextResponse.json(
      { message: "Gagal memuat katalog paket" },
      { status: 500 }
    );
  }
}
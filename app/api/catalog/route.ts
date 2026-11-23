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
        ...(category && category !== "ALL" ? { category } : {}),
        ...(subCategory && subCategory !== "ALL" ? { subCategory } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/catalog error:", error);
    return NextResponse.json(
      { message: "Gagal memuat katalog paket" },
      { status: 500 }
    );
  }
}
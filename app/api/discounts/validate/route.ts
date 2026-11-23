import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export function calculateDiscountAmount(
  subtotal: number,
  discount: {
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
  }
): number {
  if (subtotal <= 0) return 0;
  if (discount.discountType === "PERCENTAGE") {
    const pct = Math.max(0, Math.min(100, Number(discount.discountValue) || 0));
    return Math.min(subtotal, Math.round((subtotal * pct) / 100));
  }
  const fixed = Math.max(0, Number(discount.discountValue) || 0);
  return Math.min(subtotal, Math.round(fixed));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const codeInput = String(body.code || "")
      .trim()
      .toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    if (!codeInput) {
      return NextResponse.json(
        { message: "Masukkan kode diskon terlebih dahulu." },
        { status: 400 }
      );
    }

    const discount = await prisma.discountCode.findUnique({
      where: { code: codeInput },
    });

    if (!discount || !discount.isActive) {
      return NextResponse.json(
        { message: "Kode diskon tidak ditemukan atau sudah tidak berlaku." },
        { status: 404 }
      );
    }

    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return NextResponse.json(
        { message: "Kode diskon sudah melewati masa berlaku." },
        { status: 400 }
      );
    }

    if (subtotal < discount.minPurchase) {
      return NextResponse.json(
        {
          message: `Minimal transaksi untuk kode ${discount.code} adalah Rp ${Number(
            discount.minPurchase
          ).toLocaleString("id-ID")}.`,
        },
        { status: 400 }
      );
    }

    const discountAmount = calculateDiscountAmount(subtotal, discount);
    const finalAmount = Math.max(0, subtotal - discountAmount);

    return NextResponse.json({
      valid: true,
      message: `Kode diskon ${discount.code} berhasil diterapkan!`,
      discount: {
        id: discount.id,
        code: discount.code,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        minPurchase: discount.minPurchase,
        discountAmount,
        finalAmount,
      },
    });
  } catch (error) {
    console.error("POST /api/discounts/validate error:", error);
    return NextResponse.json(
      { message: "Gagal memvalidasi kode diskon" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const discounts = await prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ discounts });
  } catch (error) {
    console.error("GET /api/admin/discounts error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar kode diskon." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const discountType =
      body.discountType === "FIXED" ? "FIXED" : "PERCENTAGE";
    const discountValue = Number(body.discountValue);
    const minPurchase = Math.max(0, Number(body.minPurchase) || 0);
    const expiresAtRaw = body.expiresAt ? String(body.expiresAt).trim() : "";

    if (!code) {
      return NextResponse.json(
        { message: "Kode diskon wajib diisi." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { message: "Besar diskon harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
      return NextResponse.json(
        { message: "Diskon persentase maksimal 100%." },
        { status: 400 }
      );
    }

    let expiresAt: Date | null = null;
    if (expiresAtRaw) {
      const parsedDate = new Date(`${expiresAtRaw}T23:59:59`);
      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { message: "Format tanggal berlaku sampai tidak valid." },
          { status: 400 }
        );
      }
      expiresAt = parsedDate;
    }

    const existing = await prisma.discountCode.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { message: `Kode diskon "${code}" sudah terdaftar.` },
        { status: 409 }
      );
    }

    const created = await prisma.discountCode.create({
      data: {
        code,
        discountType,
        discountValue: Math.round(discountValue),
        minPurchase: Math.round(minPurchase),
        isActive: true,
        expiresAt,
      },
    });

    return NextResponse.json(
      { message: `Kode diskon ${created.code} berhasil dibuat!`, discount: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/discounts error:", error);
    return NextResponse.json(
      { message: "Gagal membuat kode diskon di database." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { message: "ID kode diskon tidak ditemukan." },
        { status: 400 }
      );
    }

    await prisma.discountCode.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kode diskon berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/admin/discounts error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus kode diskon." },
      { status: 500 }
    );
  }
}
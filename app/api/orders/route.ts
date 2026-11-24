import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RentalBookingPayload {
  productId: string;
  rentalStartDate: string;
  rentalEndDate: string;
  pickupDate: string;
  returnDate: string;
  baseNights: number;
  extraChargeNights: number;
  totalBilledNights: number;
  datesToLock: string[];
  scheduleLabel: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      senderName,
      bankName,
      paymentProof,
      notes,
      selectedSchedules = {},
      rentalBookings = [],
      discountCode,
    } = body as {
      senderName?: string;
      bankName?: string;
      paymentProof?: string;
      notes?: string;
      selectedSchedules?: Record<string, string>;
      rentalBookings?: RentalBookingPayload[];
      discountCode?: string | null;
    };

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { message: "Keranjang belanja kosong" },
        { status: 400 }
      );
    }

    const rentalMap = new Map<string, RentalBookingPayload>();
    if (Array.isArray(rentalBookings)) {
      for (const rb of rentalBookings) {
        if (rb?.productId) {
          rentalMap.set(rb.productId, rb);
        }
      }
    }

    let subtotal = 0;
    const preparedItems = cart.items.map((ci) => {
      const key = ci.product.slug || ci.product.id;
      const sched =
        selectedSchedules[key] ||
        selectedSchedules[ci.product.id] ||
        null;

      if (ci.product.category === "RENTAL") {
        const rb = rentalMap.get(ci.product.id);
        const billedNights = Math.max(1, Number(rb?.totalBilledNights || 1));
        const unitQty = Math.max(1, Number(ci.paxCount || 1));
        const effectiveQty = billedNights * unitQty;
        subtotal += ci.product.price * effectiveQty;
        return {
          productId: ci.productId,
          quantity: effectiveQty,
          price: ci.product.price,
          selectedSchedule: rb?.scheduleLabel || sched,
          rentalBooking: rb,
        };
      }

      const qty = Math.max(1, Number(ci.paxCount || 1));
      subtotal += ci.product.price * qty;
      return {
        productId: ci.productId,
        quantity: qty,
        price: ci.product.price,
        selectedSchedule: sched,
        rentalBooking: undefined,
      };
    });

    let discountAmount = 0;
    if (discountCode && typeof discountCode === "string") {
      const disc = await prisma.discountCode.findUnique({
        where: { code: discountCode.trim().toUpperCase() },
      });
      if (disc && disc.isActive && subtotal >= disc.minPurchase) {
        const notExpired =
          !disc.expiresAt || new Date(disc.expiresAt) >= new Date();
        if (notExpired) {
          discountAmount =
            disc.discountType === "PERCENTAGE"
              ? Math.min(
                  subtotal,
                  Math.round((subtotal * disc.discountValue) / 100)
                )
              : Math.min(subtotal, Math.round(disc.discountValue));
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    const createdOrder = await prisma.$transaction(async (tx) => {
      // Kunci tanggal rental pada Product.metaData.bookedDates
      for (const pItem of preparedItems) {
        if (!pItem.rentalBooking) continue;

        const prod = await tx.product.findUnique({
          where: { id: pItem.productId },
        });
        if (!prod) continue;

        const rawMeta = prod.metaData;
        const currentMeta: Prisma.InputJsonObject =
          rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
            ? { ...(rawMeta as Prisma.InputJsonObject) }
            : {};

        const existingBooked = Array.isArray(currentMeta.bookedDates)
          ? (currentMeta.bookedDates as string[])
          : [];
        const existingBlocked = Array.isArray(currentMeta.unavailableDates)
          ? (currentMeta.unavailableDates as string[])
          : [];

        const requestedDates = Array.isArray(pItem.rentalBooking.datesToLock)
          ? pItem.rentalBooking.datesToLock
          : [];

        const conflict = requestedDates.find(
          (d) => existingBlocked.includes(d) || existingBooked.includes(d)
        );
        if (conflict) {
          throw new Error(
            `Tanggal ${conflict} untuk "${prod.title}" sudah tidak tersedia / terbooking.`
          );
        }

        const mergedBooked = Array.from(
          new Set([...existingBooked, ...requestedDates])
        ).sort();

        await tx.product.update({
          where: { id: prod.id },
          data: {
            metaData: {
              ...currentMeta,
              bookedDates: mergedBooked as unknown as Prisma.InputJsonArray,
            },
          },
        });
      }

      const order = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount,
          status: "WAITING_CONFIRMATION",
          senderName: senderName?.trim() || null,
          bankName: bankName?.trim() || null,
          paymentProof: paymentProof || null,
          notes: notes?.trim() || null,
          items: {
            create: preparedItems.map((pi) => ({
              productId: pi.productId,
              quantity: pi.quantity,
              price: pi.price,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: `Pesanan #${order.id.slice(-6).toUpperCase()} Diterima`,
          message:
            "Bukti pembayaran Anda telah dikirim dan sedang menunggu konfirmasi admin.",
        },
      });

      return order;
    });

    return NextResponse.json(
      { message: "Pesanan berhasil dibuat", order: createdOrder },
      { status: 201 }
    );
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Gagal memproses pesanan";
    const isConflict = msg.includes("sudah tidak tersedia");
    return NextResponse.json(
      { message: msg },
      { status: isConflict ? 409 : 500 }
    );
  }
}
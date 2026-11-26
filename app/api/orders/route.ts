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
  qty?: number;
}

interface IncomingOrderItemPayload {
  productId: string;
  quantity?: number;
  nights?: number;
  selectedSchedule?: string | null;
}

function extractIsoDatesFromText(text?: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/\d{4}-\d{2}-\d{2}/g);
  return matches ? Array.from(new Set(matches)) : [];
}

function extractScheduleFromNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Jadwal\s*:\s*([^\n]+)/i);
  if (match?.[1]?.trim()) return match[1].trim();
  const rentalFallback = notes.match(/(Rental\s+[^\n]+)/i);
  return rentalFallback?.[1]?.trim() || null;
}

function toJsonObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

function parseUnitCountFromScheduleLabel(scheduleLabel?: string | null): number | null {
  if (!scheduleLabel) return null;
  const match = scheduleLabel.match(/(\d+)\s*item/i);
  if (!match?.[1]) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function GET() {
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

    const isAdmin =
      String((user as { role?: string }).role || "").toUpperCase() === "ADMIN";

    const orders = await prisma.order.findMany({
      where: isAdmin ? undefined : { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar pesanan" },
      { status: 500 }
    );
  }
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
      items: bodyItems = [],
      selectedSchedules = {},
      rentalBookings = [],
      discountCode,
    } = body as {
      senderName?: string;
      bankName?: string;
      paymentProof?: string;
      notes?: string;
      items?: IncomingOrderItemPayload[];
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

    const payloadByProductId = new Map<string, IncomingOrderItemPayload>();
    if (Array.isArray(bodyItems)) {
      for (const bi of bodyItems) {
        if (bi?.productId) {
          payloadByProductId.set(bi.productId, bi);
        }
      }
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
      const incoming = payloadByProductId.get(ci.productId);
      const rawSched =
        incoming?.selectedSchedule ||
        selectedSchedules[key] ||
        selectedSchedules[ci.product.id] ||
        null;
      const sched =
        typeof rawSched === "string"
          ? rawSched
          : rawSched && typeof rawSched === "object"
          ? String((rawSched as { dateLabel?: string }).dateLabel || "") || null
          : null;

      if (ci.product.category === "RENTAL") {
        const rb = rentalMap.get(ci.product.id);
        const billedNights = Math.max(
          1,
          Number(rb?.totalBilledNights || incoming?.nights || 1)
        );
        const scheduleLabel = rb?.scheduleLabel || sched;
        const unitQty = Math.max(
          1,
          Number(
            rb?.qty ||
              incoming?.quantity ||
              parseUnitCountFromScheduleLabel(scheduleLabel) ||
              ci.paxCount ||
              1
          )
        );
        const effectiveQty = billedNights * unitQty;
        subtotal += ci.product.price * effectiveQty;

        return {
          productId: ci.productId,
          quantity: unitQty,
          price: ci.product.price,
          selectedSchedule: scheduleLabel,
          rentalBooking: rb,
        };
      }

      const qty = Math.max(1, Number(incoming?.quantity || ci.paxCount || 1));
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
      for (const pItem of preparedItems) {
        if (!pItem.rentalBooking) continue;

        const prod = await tx.product.findUnique({
          where: { id: pItem.productId },
        });
        if (!prod) continue;

        const currentMeta = toJsonObject(prod.metaData);
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
              bookedDates: mergedBooked,
            } as Prisma.InputJsonValue,
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
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

    const scheduleMapByProduct = new Map<string, string>();
    for (const pi of preparedItems) {
      if (pi.selectedSchedule) {
        scheduleMapByProduct.set(pi.productId, pi.selectedSchedule);
      }
    }

    const enrichedOrder = {
      ...createdOrder,
      items: createdOrder.items.map((it) => ({
        ...it,
        selectedSchedule: scheduleMapByProduct.get(it.productId) || null,
      })),
    };

    return NextResponse.json(
      { message: "Pesanan berhasil dibuat", order: enrichedOrder },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/orders error:", error);
    const msg =
      error instanceof Error ? error.message : "Gagal memproses pesanan";
    const isConflict = msg.includes("sudah tidak tersedia");
    return NextResponse.json(
      { message: msg },
      { status: isConflict ? 409 : 500 }
    );
  }
}

export async function PATCH(req: Request) {
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
      orderId,
      action,
      status,
      senderName,
      bankName,
      paymentProof,
      notes,
      restoreStock,
    } = body as {
      orderId?: string;
      action?: string;
      status?: string;
      senderName?: string;
      bankName?: string;
      paymentProof?: string;
      notes?: string;
      restoreStock?: boolean;
    };

    if (!orderId) {
      return NextResponse.json(
        { message: "orderId wajib diisi" },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const isAdmin =
      String((user as { role?: string }).role || "").toUpperCase() === "ADMIN";
    if (!isAdmin && existingOrder.userId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const orderCode = `#${existingOrder.id.slice(-6).toUpperCase()}`;
    const isCancelAction =
      action === "cancel" || String(status || "").toUpperCase() === "CANCELLED";

    if (isCancelAction) {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        if (restoreStock !== false) {
          const notesSchedule = extractScheduleFromNotes(existingOrder.notes);
          for (const item of existingOrder.items) {
            const prod = await tx.product.findUnique({
              where: { id: item.productId },
            });
            if (!prod) continue;

            const currentMeta = toJsonObject(prod.metaData);
            const scheduleStr = notesSchedule || "";
            const extractedDates = extractIsoDatesFromText(scheduleStr);
            let changed = false;

            const nextMeta: Record<string, unknown> = { ...currentMeta };

            if (
              Array.isArray(currentMeta.bookedDates) &&
              extractedDates.length > 0
            ) {
              const bookedArr = currentMeta.bookedDates as string[];
              const filteredBooked = bookedArr.filter(
                (d) => !extractedDates.includes(d)
              );
              if (filteredBooked.length !== bookedArr.length) {
                nextMeta.bookedDates = filteredBooked;
                changed = true;
              }
            }

            if (Array.isArray(currentMeta.timeTrips) && scheduleStr) {
              const slots = currentMeta.timeTrips as Array<{
                id: string;
                dateLabel: string;
                quota: number;
                sold?: boolean;
              }>;
              const nextSlots = slots.map((slot) => {
                if (
                  slot.dateLabel.trim().toLowerCase() ===
                  scheduleStr.trim().toLowerCase()
                ) {
                  changed = true;
                  const maxCap = Math.max(0, Number(prod.stock) || 0);
                  const restored = Math.min(
                    maxCap > 0 ? maxCap : 9999,
                    Math.max(0, Number(slot.quota || 0)) +
                      Math.max(1, Number(item.quantity || 1))
                  );
                  return {
                    ...slot,
                    quota: restored,
                    sold: restored <= 0,
                  };
                }
                return slot;
              });
              if (changed) {
                nextMeta.timeTrips = nextSlots;
              }
            }

            if (changed) {
              await tx.product.update({
                where: { id: prod.id },
                data: {
                  metaData: nextMeta as Prisma.InputJsonValue,
                },
              });
            }
          }
        }

        const mergedNotes = [
          existingOrder.notes?.trim() || "",
          notes?.trim() || "Dibatalkan oleh pelanggan.",
        ]
          .filter(Boolean)
          .join("\n");

        const saved = await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            status: "CANCELLED",
            notes: mergedNotes,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        await tx.notification.create({
          data: {
            userId: existingOrder.userId,
            title: `Pesanan ${orderCode} Dibatalkan`,
            message: `Pesanan ${orderCode} telah dibatalkan.`,
          },
        });

        return saved;
      });

      return NextResponse.json(
        { message: "Pesanan berhasil dibatalkan", order: updatedOrder },
        { status: 200 }
      );
    }

    if (!paymentProof || !paymentProof.trim()) {
      return NextResponse.json(
        { message: "Bukti transfer baru wajib diunggah" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const cleanedOldNotes = (existingOrder.notes || "")
        .split("\n")
        .filter((line) => !/ditolak\s*admin/i.test(line.trim()))
        .join("\n")
        .trim();

      const nextNotes = [
        cleanedOldNotes,
        notes?.trim() ? `Catatan Upload Ulang: ${notes.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const saved = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          status: "WAITING_CONFIRMATION",
          senderName: senderName?.trim() || existingOrder.senderName || null,
          bankName: bankName?.trim() || existingOrder.bankName || null,
          paymentProof: paymentProof.trim(),
          ...(nextNotes ? { notes: nextNotes } : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: existingOrder.userId,
          title: `Konfirmasi pesanan`,
          message: `Bukti transfer baru untuk pesanan ${orderCode} telah dikirim dan sedang menunggu konfirmasi admin.`,
        },
      });

      return saved;
    });

    return NextResponse.json(
      {
        message: "Bukti transfer baru berhasil dikirim",
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PATCH /api/orders error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Gagal memperbarui bukti transfer pesanan";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
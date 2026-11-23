import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateDiscountAmount } from "@/app/api/discounts/validate/route";

interface TimeTripSlot {
  id: string;
  dateLabel: string;
  quota: number;
  sold?: boolean;
}

interface OutboundBookingPayload {
  days?: number;
  dates?: string[];
  label?: string;
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
  });
}

function extractScheduleFromText(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(/Jadwal\s*:\s*([^\n|]+)/i);
  return match?.[1]?.trim() || null;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIsoDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function expandOutboundDatesFromSchedule(
  scheduleStr: string | null | undefined,
  fallbackQuantity?: number
): string[] {
  if (!scheduleStr) return [];
  const isoMatches = scheduleStr.match(/\d{4}-\d{2}-\d{2}/g) || [];
  const firstDate = isoMatches[0];
  const secondDate = isoMatches[1];

  if (firstDate && secondDate) {
    const start = parseIsoDateLocal(firstDate);
    const end = parseIsoDateLocal(secondDate);
    const minD = start <= end ? start : end;
    const maxD = start <= end ? end : start;
    const dates: string[] = [];
    const cursor = new Date(minD);
    while (cursor <= maxD) {
      dates.push(formatDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  if (firstDate) {
    const start = parseIsoDateLocal(firstDate);
    const days = Math.max(1, Number(fallbackQuantity) || 1);
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const cursor = new Date(start);
      cursor.setDate(start.getDate() + i);
      dates.push(formatDateKey(cursor));
    }
    return dates;
  }

  return [];
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu" },
        { status: 401 }
      );
    }

    if (!user.name?.trim() || !user.phone?.trim()) {
      return NextResponse.json(
        {
          message:
            "Silakan lengkapi Informasi Profil terlebih dahulu (Nama Lengkap dan Nomor WhatsApp / HP) sebelum melakukan checkout.",
        },
        { status: 400 }
      );
    }

    const {
      senderName,
      bankName,
      paymentProof,
      notes,
      selectedSchedules,
      outboundBookings,
      rulesAgreed,
      discountCode,
    } = await req.json();

    if (rulesAgreed === false) {
      return NextResponse.json(
        { message: "Anda wajib menyetujui seluruh rules sebelum checkout." },
        { status: 400 }
      );
    }

    if (!senderName?.trim() || !bankName?.trim() || !paymentProof) {
      return NextResponse.json(
        {
          message:
            "Nama pengirim, bank pengirim, dan bukti transfer wajib dilengkapi.",
        },
        { status: 400 }
      );
    }

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
        { message: "Keranjang belanja Anda kosong." },
        { status: 400 }
      );
    }

    const outboundBookingsMap: Record<string, OutboundBookingPayload> =
      outboundBookings && typeof outboundBookings === "object"
        ? outboundBookings
        : {};

    const getDaysForItem = (item: (typeof cart.items)[number]) => {
      if (item.product.category !== "OUTBOUND") {
        return Math.max(1, Number(item.paxCount) || 1);
      }
      const ob =
        outboundBookingsMap[item.product.slug] ||
        outboundBookingsMap[item.productId];
      if (Array.isArray(ob?.dates) && ob.dates.length > 0) {
        return ob.dates.length;
      }
      return Math.max(1, Number(ob?.days || item.paxCount || 1));
    };

    const subtotalAmount = cart.items.reduce(
      (sum, item) => sum + item.product.price * getDaysForItem(item),
      0
    );

    let discountAmount = 0;
    let appliedDiscountLabel: string | null = null;

    const normalizedCode = String(discountCode || "")
      .trim()
      .toUpperCase();

    if (normalizedCode) {
      const foundDiscount = await (prisma as any).discountCode.findUnique({
        where: { code: normalizedCode },
      });

      if (!foundDiscount || !foundDiscount.isActive) {
        return NextResponse.json(
          { message: "Kode diskon tidak valid atau sudah tidak aktif." },
          { status: 400 }
        );
      }

      if (
        foundDiscount.expiresAt &&
        new Date(foundDiscount.expiresAt) < new Date()
      ) {
        return NextResponse.json(
          { message: "Kode diskon sudah kadaluarsa." },
          { status: 400 }
        );
      }

      if (subtotalAmount < foundDiscount.minPurchase) {
        return NextResponse.json(
          {
            message: `Minimal belanja untuk kode diskon ${foundDiscount.code} adalah Rp ${Number(
              foundDiscount.minPurchase
            ).toLocaleString("id-ID")}.`,
          },
          { status: 400 }
        );
      }

      discountAmount = calculateDiscountAmount(subtotalAmount, foundDiscount);
      const badgeText =
        foundDiscount.discountType === "PERCENTAGE"
          ? `${foundDiscount.discountValue}%`
          : `Rp ${Number(foundDiscount.discountValue).toLocaleString("id-ID")}`;
      appliedDiscountLabel = `Kode Diskon: ${foundDiscount.code} (${badgeText}) — Potongan Rp ${discountAmount.toLocaleString("id-ID")}`;
    }

    const totalAmount = Math.max(0, subtotalAmount - discountAmount);

    const scheduleMap: Record<string, string> =
      selectedSchedules && typeof selectedSchedules === "object"
        ? selectedSchedules
        : {};

    const notesFromClient = notes?.trim() || "";
    const fallbackScheduleFromNotes = extractScheduleFromText(notesFromClient);
    const scheduleLabels: string[] = [];

    const createdOrder = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const ob =
          outboundBookingsMap[item.product.slug] ||
          outboundBookingsMap[item.productId];

        const chosenDate =
          scheduleMap[item.product.slug] ||
          scheduleMap[item.productId] ||
          ob?.label ||
          fallbackScheduleFromNotes;

        const rawMeta = item.product.metaData;
        const currentMeta: Prisma.InputJsonObject =
          rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
            ? { ...(rawMeta as Prisma.InputJsonObject) }
            : {};

        if (item.product.category === "TRIP") {
          if (!chosenDate) continue;

          const rawSlots = Array.isArray(currentMeta.timeTrips)
            ? (currentMeta.timeTrips as unknown as TimeTripSlot[])
            : [];

          if (rawSlots.length > 0) {
            let matchedDateLabel = chosenDate;
            const paxUsed = Math.max(1, Number(item.paxCount) || 1);

            const updatedSlots: TimeTripSlot[] = rawSlots.map((slot) => {
              const isMatch =
                slot.id === chosenDate ||
                slot.dateLabel.trim().toLowerCase() ===
                  chosenDate.trim().toLowerCase();

              if (!isMatch) return slot;

              matchedDateLabel = slot.dateLabel;
              const currentQuota = Math.max(0, Number(slot.quota) || 0);
              const nextQuota = Math.max(0, currentQuota - paxUsed);

              return {
                ...slot,
                quota: nextQuota,
                sold: nextQuota <= 0,
              };
            });

            scheduleLabels.push(`${item.product.title}: ${matchedDateLabel}`);

            await tx.product.update({
              where: { id: item.productId },
              data: {
                metaData: {
                  ...currentMeta,
                  timeTrips: updatedSlots as unknown as Prisma.InputJsonArray,
                },
              },
            });
          } else {
            scheduleLabels.push(`${item.product.title}: ${chosenDate}`);
          }
        } else if (item.product.category === "OUTBOUND") {
          const rangeDates =
            Array.isArray(ob?.dates) && ob.dates.length > 0
              ? ob.dates
              : expandOutboundDatesFromSchedule(chosenDate, item.paxCount);

          if (rangeDates.length > 0) {
            const existingBooked = Array.isArray(currentMeta.bookedDates)
              ? (currentMeta.bookedDates as string[])
              : [];
            const nextBooked = Array.from(
              new Set([...existingBooked, ...rangeDates])
            );

            await tx.product.update({
              where: { id: item.productId },
              data: {
                metaData: {
                  ...currentMeta,
                  bookedDates: nextBooked as unknown as Prisma.InputJsonArray,
                },
              },
            });
          }

          if (chosenDate) {
            scheduleLabels.push(`${item.product.title}: ${chosenDate}`);
          }
        }
      }

      let finalNotes = notesFromClient;
      if (scheduleLabels.length > 0 && !/Jadwal\s*:/i.test(finalNotes)) {
        const scheduleSummary = `Jadwal: ${scheduleLabels.join(" | ")}`;
        finalNotes = finalNotes
          ? `${scheduleSummary}\n${finalNotes}`
          : scheduleSummary;
      }

      if (appliedDiscountLabel) {
        finalNotes = finalNotes
          ? `${finalNotes}\n${appliedDiscountLabel}`
          : appliedDiscountLabel;
      }

      const order = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount,
          status: "WAITING_CONFIRMATION",
          senderName: senderName.trim(),
          bankName: bankName.trim(),
          paymentProof,
          notes: finalNotes || null,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: getDaysForItem(item),
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      try {
        await tx.notification.create({
          data: {
            userId: user.id,
            title: "Bukti Transfer Diterima",
            message: `Pesanan #${order.id.slice(-6).toUpperCase()} senilai Rp ${totalAmount.toLocaleString("id-ID")} sedang menunggu validasi pembayaran oleh Admin.`,
          },
        });
      } catch (notifErr) {
        console.warn("Skip create notification:", notifErr);
      }

      return order;
    });

    return NextResponse.json(
      {
        message:
          "Pesanan berhasil dibuat! Menunggu verifikasi pembayaran oleh Admin.",
        order: createdOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { message: "Gagal memproses pesanan checkout" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, action, senderName, bankName, paymentProof, notes } = body;

    if (!orderId) {
      return NextResponse.json(
        { message: "Order ID wajib diisi." },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!existingOrder || existingOrder.userId !== user.id) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (action === "cancel") {
      if (
        existingOrder.status === "PROCESSING" ||
        existingOrder.status === "COMPLETED"
      ) {
        return NextResponse.json(
          {
            message:
              "Pesanan yang sudah diproses atau selesai tidak dapat dibatalkan.",
          },
          { status: 400 }
        );
      }

      if (
        existingOrder.status === "CANCELLED" &&
        /Dibatalkan oleh pelanggan/i.test(existingOrder.notes || "")
      ) {
        return NextResponse.json(
          { message: "Pesanan ini sudah dibatalkan." },
          { status: 400 }
        );
      }

      const schedLabel = extractScheduleFromText(existingOrder.notes);

      for (const item of existingOrder.items) {
        const rawMeta = item.product.metaData;
        const currentMeta: Prisma.InputJsonObject =
          rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
            ? { ...(rawMeta as Prisma.InputJsonObject) }
            : {};

        if (item.product.category === "OUTBOUND") {
          const existingBooked: string[] = Array.isArray(currentMeta.bookedDates)
            ? (currentMeta.bookedDates as string[])
            : [];
          const datesToRelease = expandOutboundDatesFromSchedule(
            schedLabel,
            item.quantity
          );

          if (datesToRelease.length > 0 && existingBooked.length > 0) {
            const releaseSet = new Set(datesToRelease);
            const nextBooked = existingBooked.filter(
              (d) => !releaseSet.has(d)
            );
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                metaData: {
                  ...currentMeta,
                  bookedDates: nextBooked as unknown as Prisma.InputJsonArray,
                },
              },
            });
          }
        } else if (item.product.category === "TRIP" && schedLabel) {
          const slots = Array.isArray(currentMeta.timeTrips)
            ? (currentMeta.timeTrips as unknown as TimeTripSlot[])
            : [];
          if (slots.length > 0) {
            const updatedSlots = slots.map((slot) => {
              const isMatch =
                slot.dateLabel.trim().toLowerCase() ===
                  schedLabel.trim().toLowerCase() ||
                schedLabel
                  .toLowerCase()
                  .includes(slot.dateLabel.trim().toLowerCase());

              if (!isMatch) return slot;

              const restoredQuota =
                Math.max(0, Number(slot.quota || 0)) +
                Number(item.quantity || 1);
              return {
                ...slot,
                quota: restoredQuota,
                sold: restoredQuota <= 0,
              };
            });

            await prisma.product.update({
              where: { id: item.productId },
              data: {
                metaData: {
                  ...currentMeta,
                  timeTrips: updatedSlots as unknown as Prisma.InputJsonArray,
                },
              },
            });
          }
        }
      }

      const cancelNote =
        notes?.trim() ||
        "Dibatalkan oleh pelanggan (tidak jadi pesan & kuota/tanggal dikembalikan).";
      const nextNotes = existingOrder.notes
        ? `${existingOrder.notes}\n${cancelNote}`
        : cancelNote;

      const cancelledOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          notes: nextNotes,
        },
        include: {
          items: { include: { product: true } },
        },
      });

      const orderCode = existingOrder.id.slice(-6).toUpperCase();

      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: "Pesanan Dibatalkan",
            message: `Pesanan #${orderCode} telah dibatalkan dan kuota/jadwal telah dikembalikan.`,
          },
        });
      } catch (notifErr) {
        console.warn("Skip cancel notification:", notifErr);
      }

      try {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((adm) => ({
              userId: adm.id,
              title: "Pesanan Dibatalkan Pelanggan",
              message: `Pelanggan (${user.name || user.email}) memilih membatalkan pesanan #${orderCode} saat tahap revisi. Kuota/jadwal otomatis dikembalikan.`,
            })),
          });
        }
      } catch (adminNotifErr) {
        console.warn("Skip admin cancel notification:", adminNotifErr);
      }

      return NextResponse.json({
        message: "Pesanan berhasil dibatalkan.",
        order: cancelledOrder,
      });
    }

    if (!senderName?.trim() || !bankName?.trim() || !paymentProof) {
      return NextResponse.json(
        {
          message:
            "Order ID, nama pengirim, bank pengirim, dan bukti transfer baru wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (existingOrder.status !== "CANCELLED") {
      return NextResponse.json(
        {
          message:
            "Bukti transfer hanya dapat diedit ulang pada pesanan yang dibatalkan.",
        },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const schedLabel = extractScheduleFromText(existingOrder.notes);

      for (const item of existingOrder.items) {
        const rawMeta = item.product.metaData;
        const currentMeta: Prisma.InputJsonObject =
          rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
            ? { ...(rawMeta as Prisma.InputJsonObject) }
            : {};

        if (item.product.category === "OUTBOUND" && schedLabel) {
          const dateMatches = expandOutboundDatesFromSchedule(
            schedLabel,
            item.quantity
          );
          if (dateMatches.length > 0) {
            const existingBooked = Array.isArray(currentMeta.bookedDates)
              ? (currentMeta.bookedDates as string[])
              : [];
            const nextBooked = Array.from(
              new Set([...existingBooked, ...dateMatches])
            );
            await tx.product.update({
              where: { id: item.productId },
              data: {
                metaData: {
                  ...currentMeta,
                  bookedDates: nextBooked as unknown as Prisma.InputJsonArray,
                },
              },
            });
          }
        } else if (item.product.category === "TRIP" && schedLabel) {
          const slots = Array.isArray(currentMeta.timeTrips)
            ? (currentMeta.timeTrips as unknown as TimeTripSlot[])
            : [];
          if (slots.length > 0) {
            const updatedSlots = slots.map((slot) => {
              if (
                slot.dateLabel.trim().toLowerCase() !==
                schedLabel.trim().toLowerCase()
              ) {
                return slot;
              }
              const nextQuota = Math.max(
                0,
                Number(slot.quota || 0) - Number(item.quantity || 1)
              );
              return {
                ...slot,
                quota: nextQuota,
                sold: nextQuota <= 0,
              };
            });

            await tx.product.update({
              where: { id: item.productId },
              data: {
                metaData: {
                  ...currentMeta,
                  timeTrips: updatedSlots as unknown as Prisma.InputJsonArray,
                },
              },
            });
          }
        }
      }

      const nextNotes = notes?.trim()
        ? `${existingOrder.notes ? `${existingOrder.notes}\n` : ""}Re-upload TF: ${notes.trim()}`
        : existingOrder.notes;

      return tx.order.update({
        where: { id: orderId },
        data: {
          senderName: senderName.trim(),
          bankName: bankName.trim(),
          paymentProof,
          notes: nextNotes || null,
          status: "WAITING_CONFIRMATION",
        },
        include: {
          items: { include: { product: true } },
        },
      });
    });

    return NextResponse.json({
      message:
        "Bukti transfer berhasil diperbarui! Pesanan kembali ke Menunggu Konfirmasi Admin.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("PATCH /api/orders error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui pesanan" },
      { status: 500 }
    );
  }
}
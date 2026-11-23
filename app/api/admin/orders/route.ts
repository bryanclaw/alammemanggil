import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface TimeTripSlot {
  id: string;
  dateLabel: string;
  quota: number;
  sold?: boolean;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { message: "Akses ditolak. Khusus Admin." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

function extractScheduleForProduct(
  notes: string | null | undefined,
  productTitle: string
): string | null {
  if (!notes) return null;
  const escaped = productTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const specificMatch = notes.match(
    new RegExp(`${escaped}\\s*:\\s*([^\\n|]+)`, "i")
  );
  if (specificMatch?.[1]) return specificMatch[1].trim();
  const generalMatch = notes.match(/Jadwal\s*:\s*([^\n|]+)/i);
  return generalMatch?.[1]?.trim() || null;
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
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const orders = await prisma.order.findMany({
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
            product: {
              select: {
                title: true,
                category: true,
                image: true,
                metaData: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json(
      { message: "Gagal memuat daftar pesanan" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const { orderId, status } = await req.json();

    if (
      !orderId ||
      ![
        "WAITING_CONFIRMATION",
        "PROCESSING",
        "COMPLETED",
        "CANCELLED",
      ].includes(status)
    ) {
      return NextResponse.json(
        { message: "Order ID atau status tidak valid." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      const order = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          user: {
            select: { name: true, email: true, phone: true },
          },
          items: {
            include: {
              product: { select: { title: true, category: true } },
            },
          },
        },
      });

      if (
        existingOrder &&
        existingOrder.status !== "CANCELLED" &&
        status === "CANCELLED"
      ) {
        for (const item of existingOrder.items) {
          const chosenDate = extractScheduleForProduct(
            existingOrder.notes,
            item.product.title
          );
          const rawMeta = item.product.metaData;
          const currentMeta: Prisma.InputJsonObject =
            rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
              ? { ...(rawMeta as Prisma.InputJsonObject) }
              : {};

          if (item.product.category === "OUTBOUND") {
            const bookedList = Array.isArray(currentMeta.bookedDates)
              ? (currentMeta.bookedDates as string[])
              : [];
            const datesToRelease = expandOutboundDatesFromSchedule(
              chosenDate,
              item.quantity
            );

            if (datesToRelease.length > 0 && bookedList.length > 0) {
              const releaseSet = new Set(datesToRelease);
              const nextBooked = bookedList.filter((d) => !releaseSet.has(d));
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  metaData: {
                    ...currentMeta,
                    bookedDates: nextBooked as unknown as Prisma.InputJsonArray,
                  },
                },
              });
            } else if (chosenDate && bookedList.length > 0) {
              const nextBooked = bookedList.filter(
                (d) => d.trim().toLowerCase() !== chosenDate.trim().toLowerCase()
              );
              if (nextBooked.length !== bookedList.length) {
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
            }
          } else if (item.product.category === "TRIP" && chosenDate) {
            const slots = Array.isArray(currentMeta.timeTrips)
              ? (currentMeta.timeTrips as unknown as TimeTripSlot[])
              : [];
            if (slots.length > 0) {
              const restoredSlots = slots.map((slot) => {
                const isMatch =
                  slot.dateLabel.trim().toLowerCase() ===
                    chosenDate.trim().toLowerCase() ||
                  chosenDate
                    .toLowerCase()
                    .includes(slot.dateLabel.trim().toLowerCase());
                if (!isMatch) return slot;
                const nextQuota =
                  Number(slot.quota || 0) + Number(item.quantity || 1);
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
                    timeTrips: restoredSlots as unknown as Prisma.InputJsonArray,
                  },
                },
              });
            }
          }
        }
      }

      return order;
    });

    return NextResponse.json({
      message: "Status pesanan berhasil diperbarui.",
      order: updated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui status pesanan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { message: "orderId diperlukan." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (existingOrder && existingOrder.status !== "CANCELLED") {
        for (const item of existingOrder.items) {
          const chosenDate = extractScheduleForProduct(
            existingOrder.notes,
            item.product.title
          );
          const rawMeta = item.product.metaData;
          const currentMeta: Prisma.InputJsonObject =
            rawMeta && typeof rawMeta === "object" && !Array.isArray(rawMeta)
              ? { ...(rawMeta as Prisma.InputJsonObject) }
              : {};

          if (item.product.category === "OUTBOUND") {
            const bookedList = Array.isArray(currentMeta.bookedDates)
              ? (currentMeta.bookedDates as string[])
              : [];
            const datesToRelease = expandOutboundDatesFromSchedule(
              chosenDate,
              item.quantity
            );

            if (datesToRelease.length > 0 && bookedList.length > 0) {
              const releaseSet = new Set(datesToRelease);
              const nextBooked = bookedList.filter((d) => !releaseSet.has(d));
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
          } else if (item.product.category === "TRIP" && chosenDate) {
            const slots = Array.isArray(currentMeta.timeTrips)
              ? (currentMeta.timeTrips as unknown as TimeTripSlot[])
              : [];
            if (slots.length > 0) {
              const restoredSlots = slots.map((slot) => {
                const isMatch =
                  slot.dateLabel.trim().toLowerCase() ===
                    chosenDate.trim().toLowerCase() ||
                  chosenDate
                    .toLowerCase()
                    .includes(slot.dateLabel.trim().toLowerCase());
                if (!isMatch) return slot;
                const nextQuota =
                  Number(slot.quota || 0) + Number(item.quantity || 1);
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
                    timeTrips: restoredSlots as unknown as Prisma.InputJsonArray,
                  },
                },
              });
            }
          }
        }
      }

      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.delete({ where: { id: orderId } });
    });

    return NextResponse.json({
      message:
        "Riwayat pesanan berhasil dihapus & jadwal terbooking dikembalikan.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/orders error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus riwayat pesanan" },
      { status: 500 }
    );
  }
}
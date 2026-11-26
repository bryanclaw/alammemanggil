import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

interface TimeTripSlot {
  id: string;
  dateLabel: string;
  quota: number;
  sold?: boolean;
}

interface ProductMetaShape {
  timeTrips?: TimeTripSlot[];
  bookedDates?: string[];
  [key: string]: unknown;
}

function parseMetaObject(
  raw: Prisma.JsonValue | null | undefined
): ProductMetaShape {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return { ...(raw as Record<string, unknown>) } as ProductMetaShape;
}

function toInputJson(obj: ProductMetaShape): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(obj)) as Prisma.InputJsonValue;
}

function extractScheduleText(notes?: string | null): string {
  if (!notes) return "";
  const match = notes.match(/Jadwal\s*:\s*([^\n]+)/i);
  if (match?.[1]?.trim()) return match[1].trim();
  return "";
}

function extractIsoDates(text: string): string[] {
  const matches = text.match(/\d{4}-\d{2}-\d{2}/g);
  return matches ? Array.from(new Set(matches)) : [];
}

function extractUnitCountFromNotes(
  notes?: string | null,
  productTitle?: string | null
): number | null {
  if (!notes) return null;
  if (productTitle) {
    const escaped = productTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const specificMatch = notes.match(
      new RegExp(`${escaped}[^\\n|]*?(\\d+)\\s*item`, "i")
    );
    if (specificMatch?.[1]) {
      const n = Number(specificMatch[1]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  const generalMatch = notes.match(/(\d+)\s*item/i);
  if (generalMatch?.[1]) {
    const n = Number(generalMatch[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

async function resolveSessionContext() {
  const session = await auth();
  const email = session?.user?.email ? String(session.user.email).trim() : "";

  if (!session || !email) {
    return {
      ok: false as const,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!dbUser) {
    return {
      ok: false as const,
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const roleUpper = String(dbUser.role || "").toUpperCase();
  const isAdmin =
    roleUpper === "ADMIN" || roleUpper === "OWNER" || roleUpper === "SUPERADMIN";

  return {
    ok: true as const,
    userId: dbUser.id,
    email: dbUser.email,
    isAdmin,
  };
}

export async function GET() {
  try {
    const authCtx = await resolveSessionContext();
    if (!authCtx.ok) return authCtx.error;

    const orders = await prisma.order.findMany({
      where: authCtx.isAdmin ? undefined : { userId: authCtx.userId },
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
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                category: true,
                stock: true,
              },
            },
          },
        },
      },
    });

    const formattedOrders = orders.map((ord) => ({
      ...ord,
      items: ord.items.map((it) => ({
        ...it,
        selectedSchedule: extractScheduleText(ord.notes),
      })),
    }));

    return NextResponse.json({ orders: formattedOrders }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/orders error:", err);
    return NextResponse.json(
      { message: "Gagal memuat daftar pesanan." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authCtx = await resolveSessionContext();
    if (!authCtx.ok) return authCtx.error;

    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();
    if (!orderId) {
      return NextResponse.json(
        { message: "orderId wajib disertakan." },
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
        { message: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    const isOwner = existingOrder.userId === authCtx.userId;
    if (!authCtx.isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (body?.action === "SEND_RETURN_REMINDER") {
      if (!authCtx.isAdmin) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      const reminderText = String(
        body.reminderMessage ||
          `Pengingat pengembalian alat rental untuk pesanan #${existingOrder.id
            .slice(-6)
            .toUpperCase()}.`
      ).trim();

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          notes: existingOrder.notes
            ? `${existingOrder.notes}\n${reminderText}`
            : reminderText,
        },
      });

      return NextResponse.json(
        {
          message: "Pemberitahuan pengembalian berhasil dicatat.",
          order: updated,
        },
        { status: 200 }
      );
    }

    const nextStatus = String(body?.status || "").toUpperCase();
    if (!["COMPLETED", "CANCELLED"].includes(nextStatus)) {
      return NextResponse.json(
        { message: "Status tidak valid." },
        { status: 400 }
      );
    }

    if (nextStatus === "COMPLETED") {
      const alreadyCompleted =
        existingOrder.status === "COMPLETED" ||
        existingOrder.status === "PROCESSING";

      const result = await prisma.$transaction(async (tx) => {
        if (!alreadyCompleted) {
          for (const item of existingOrder.items) {
            const prod = await tx.product.findUnique({
              where: { id: item.productId },
            });
            if (!prod) continue;

            const cat = String(prod.category || "").toUpperCase();
            const rawQty = Math.max(1, Number(item.quantity) || 1);
            const meta = parseMetaObject(prod.metaData);
            const scheduleText = extractScheduleText(existingOrder.notes);

            if (cat === "RENTAL") {
              const notesUnit = extractUnitCountFromNotes(
                existingOrder.notes,
                prod.title
              );
              const nightsMatch = scheduleText.match(/(\d+)\s*(?:mlm|malam)/i);
              const nights = nightsMatch?.[1]
                ? Math.max(1, Number(nightsMatch[1]))
                : 1;

              const unitUsed = notesUnit
                ? notesUnit
                : nights > 1 && rawQty % nights === 0
                ? Math.max(1, rawQty / nights)
                : rawQty;

              const nextStock = Math.max(0, Number(prod.stock || 0) - unitUsed);
              const datesFound = extractIsoDates(scheduleText);
              const prevBooked = Array.isArray(meta.bookedDates)
                ? meta.bookedDates.map(String)
                : [];
              const mergedBooked = Array.from(
                new Set([...prevBooked, ...datesFound])
              );

              await tx.product.update({
                where: { id: prod.id },
                data: {
                  stock: nextStock,
                  metaData: toInputJson({
                    ...meta,
                    bookedDates: mergedBooked,
                  }),
                },
              });
            } else {
              const slots: TimeTripSlot[] = Array.isArray(meta.timeTrips)
                ? meta.timeTrips.map((s) => ({
                    id: String(s.id || ""),
                    dateLabel: String(s.dateLabel || ""),
                    quota: Number(s.quota || 0),
                    sold: Boolean(s.sold),
                  }))
                : [];

              let slotMatched = false;
              const updatedSlots = slots.map((slot) => {
                const slotLabel = slot.dateLabel.trim().toLowerCase();
                const schedLower = scheduleText.toLowerCase();
                const isMatch =
                  Boolean(slotLabel) &&
                  Boolean(schedLower) &&
                  (schedLower.includes(slotLabel) ||
                    slotLabel.includes(schedLower));

                if (isMatch && !slotMatched) {
                  slotMatched = true;
                  const nextQuota = Math.max(0, slot.quota - rawQty);
                  return {
                    ...slot,
                    quota: nextQuota,
                    sold: nextQuota <= 0,
                  };
                }
                return slot;
              });

              const nextStock = Math.max(0, Number(prod.stock || 0) - rawQty);

              await tx.product.update({
                where: { id: prod.id },
                data: {
                  stock: nextStock,
                  metaData: toInputJson({
                    ...meta,
                    timeTrips: updatedSlots,
                  }),
                },
              });
            }
          }
        }

        return tx.order.update({
          where: { id: orderId },
          data: { status: "COMPLETED" },
        });
      });

      return NextResponse.json(
        {
          message: "Pesanan dikonfirmasi dan stok/kuota telah diperbarui.",
          order: result,
        },
        { status: 200 }
      );
    }

    const noteAddition = body?.revisionNote
      ? `\nCatatan: ${String(body.revisionNote).trim()}`
      : "";

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        notes: `${existingOrder.notes || ""}${noteAddition}`.trim(),
      },
    });

    return NextResponse.json(
      {
        message: "Status pesanan diperbarui ke dibatalkan.",
        order: cancelledOrder,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/admin/orders error:", err);
    return NextResponse.json(
      { message: "Gagal memproses status pesanan." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authCtx = await resolveSessionContext();
    if (!authCtx.ok) return authCtx.error;

    const { searchParams } = new URL(req.url);
    const orderId = String(searchParams.get("orderId") || "").trim();
    if (!orderId) {
      return NextResponse.json(
        { message: "orderId wajib disertakan." },
        { status: 400 }
      );
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Riwayat pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (!authCtx.isAdmin && existing.userId !== authCtx.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const wasConfirmedCompleted =
      existing.status === "COMPLETED" || existing.status === "PROCESSING";
    const scheduleText = extractScheduleText(existing.notes);
    const datesToRelease = extractIsoDates(scheduleText);

    await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!prod) continue;

        const cat = String(prod.category || "").toUpperCase();
        const rawQty = Math.max(1, Number(item.quantity) || 1);
        const meta = parseMetaObject(prod.metaData);

        if (cat === "RENTAL") {
          const notesUnit = extractUnitCountFromNotes(existing.notes, prod.title);
          const nightsMatch = scheduleText.match(/(\d+)\s*(?:mlm|malam)/i);
          const nights = nightsMatch?.[1]
            ? Math.max(1, Number(nightsMatch[1]))
            : 1;

          const unitUsed = notesUnit
            ? notesUnit
            : nights > 1 && rawQty % nights === 0
            ? Math.max(1, rawQty / nights)
            : rawQty;

          const nextStock = wasConfirmedCompleted
            ? Math.max(0, Number(prod.stock || 0)) + unitUsed
            : Math.max(0, Number(prod.stock || 0));

          const prevBooked = Array.isArray(meta.bookedDates)
            ? meta.bookedDates.map(String)
            : [];
          const remainingBooked =
            datesToRelease.length > 0
              ? prevBooked.filter((d) => !datesToRelease.includes(d))
              : prevBooked;

          await tx.product.update({
            where: { id: prod.id },
            data: {
              stock: nextStock,
              metaData: toInputJson({
                ...meta,
                bookedDates: remainingBooked,
              }),
            },
          });
        } else {
          const nextStock = wasConfirmedCompleted
            ? Math.max(0, Number(prod.stock || 0)) + rawQty
            : Math.max(0, Number(prod.stock || 0));

          const slots: TimeTripSlot[] = Array.isArray(meta.timeTrips)
            ? meta.timeTrips.map((s) => ({
                id: String(s.id || ""),
                dateLabel: String(s.dateLabel || ""),
                quota: Number(s.quota || 0),
                sold: Boolean(s.sold),
              }))
            : [];

          let slotMatched = false;
          const updatedSlots = slots.map((slot) => {
            const slotLabel = slot.dateLabel.trim().toLowerCase();
            const schedLower = scheduleText.toLowerCase();
            const isMatch =
              Boolean(slotLabel) &&
              Boolean(schedLower) &&
              (schedLower.includes(slotLabel) ||
                slotLabel.includes(schedLower));

            if (isMatch && !slotMatched) {
              slotMatched = true;
              const restoredQuota = wasConfirmedCompleted
                ? Math.max(0, slot.quota) + rawQty
                : Math.max(0, slot.quota);
              return {
                ...slot,
                quota: restoredQuota,
                sold: restoredQuota <= 0,
              };
            }
            return slot;
          });

          await tx.product.update({
            where: { id: prod.id },
            data: {
              stock: nextStock,
              metaData: toInputJson({
                ...meta,
                timeTrips: updatedSlots,
              }),
            },
          });
        }
      }

      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.order.delete({ where: { id: orderId } });
    });

    return NextResponse.json(
      {
        message:
          "Riwayat pesanan berhasil dihapus & stok/jadwal telah dipulihkan.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/admin/orders error:", err);
    return NextResponse.json(
      { message: "Gagal menghapus riwayat pesanan." },
      { status: 500 }
    );
  }
}
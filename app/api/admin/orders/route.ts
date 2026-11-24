import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status, revisionNote, action, returnDate, reminderMessage } =
      body as {
        orderId: string;
        status?: "WAITING_CONFIRMATION" | "PROCESSING" | "COMPLETED" | "CANCELLED";
        revisionNote?: string;
        action?: "SEND_RETURN_REMINDER";
        returnDate?: string | null;
        reminderMessage?: string;
      };

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (action === "SEND_RETURN_REMINDER") {
      const code = `#${existing.id.slice(-6).toUpperCase()}`;
      const title = `Pengingat Pengembalian Rental ${code}`;
      const message =
        reminderMessage?.trim() ||
        `Jadwal pengembalian alat rental untuk pesanan ${code} (${
          returnDate || "tanggal sewa"
        }) sudah lewat. Mohon segera kembalikan alat atau hubungi admin Alam Memanggil.`;

      await prisma.notification.create({
        data: {
          userId: existing.userId,
          title,
          message,
        },
      });

      return NextResponse.json({
        message: `Pemberitahuan pengembalian dikirim ke akun customer ${code}.`,
      });
    }

    if (!status) {
      return NextResponse.json(
        { message: "Status pesanan wajib disertakan" },
        { status: 400 }
      );
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(revisionNote
          ? {
              notes: [existing.notes, revisionNote].filter(Boolean).join("\n"),
            }
          : {}),
      },
    });

    const code = `#${existing.id.slice(-6).toUpperCase()}`;
    await prisma.notification.create({
      data: {
        userId: existing.userId,
        title:
          status === "COMPLETED"
            ? `Pesanan ${code} Dikonfirmasi`
            : status === "CANCELLED"
            ? `Pesanan ${code} Ditolak`
            : `Status Pesanan ${code} Diperbarui`,
        message:
          revisionNote ||
          (status === "COMPLETED"
            ? `Pembayaran pesanan ${code} telah dikonfirmasi oleh admin.`
            : `Pesanan ${code} berstatus ${status}.`),
      },
    });

    return NextResponse.json({ message: "Status diperbarui", order: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal memperbarui pesanan" },
      { status: 500 }
    );
  }
}
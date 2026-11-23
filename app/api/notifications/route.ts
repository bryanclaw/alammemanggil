import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email },
  });
}

// 1. GET: Ambil notifikasi user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { message: "Gagal memuat notifikasi" },
      { status: 500 }
    );
  }
}

// 2. PATCH: Tandai notifikasi sebagai sudah dibaca
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, markAll } = await req.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "Semua notifikasi dibaca" });
    }

    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: user.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ message: "Notifikasi diperbarui" });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui notifikasi" },
      { status: 500 }
    );
  }
}
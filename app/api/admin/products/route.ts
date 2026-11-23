import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

function makeSlug(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-") +
    "-" +
    Date.now().toString().slice(-4)
  );
}

// GET: Ambil semua paket untuk etalase admin
export async function GET(req: Request) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subCategory = searchParams.get("subCategory");

    const products = await prisma.product.findMany({
      where: {
        ...(category && category !== "ALL" ? { category } : {}),
        ...(subCategory && subCategory !== "ALL" ? { subCategory } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { message: "Gagal memuat paket" },
      { status: 500 }
    );
  }
}

// POST: Tambah paket Trip atau Outbound baru
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const body = await req.json();
    const {
      title,
      category,
      subCategory,
      price,
      description,
      image,
      stock = 15,
      metaData,
    } = body;

    if (
      !title?.trim() ||
      !category ||
      price === undefined ||
      Number.isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      return NextResponse.json(
        { message: "Judul, kategori, dan harga paket wajib diisi dengan valid." },
        { status: 400 }
      );
    }

    const created = await prisma.product.create({
      data: {
        title: title.trim(),
        slug: makeSlug(title),
        category,
        subCategory: subCategory || "ALL",
        price: Number(price),
        description: description?.trim() || title.trim(),
        image:
          image?.trim() ||
          (category === "OUTBOUND"
            ? "/images/flyingfox.jpg"
            : "/images/GEDE_1.jpeg"),
        stock: Number(stock) || 15,
        metaData: metaData ?? {},
      },
    });

    return NextResponse.json(
      {
        message: "Paket baru berhasil ditambahkan ke etalase!",
        product: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json(
      { message: "Gagal menambahkan paket baru" },
      { status: 500 }
    );
  }
}

// PATCH: Edit paket & ubah harga
export async function PATCH(req: Request) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const body = await req.json();
    const {
      id,
      title,
      category,
      subCategory,
      price,
      description,
      image,
      metaData,
    } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID paket wajib ada." },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(subCategory !== undefined ? { subCategory } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(metaData !== undefined ? { metaData } : {}),
      },
    });

    return NextResponse.json({
      message: "Perubahan paket berhasil disimpan.",
      product: updated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/products error:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui paket" },
      { status: 500 }
    );
  }
}

// DELETE: Hapus paket dari database
export async function DELETE(req: Request) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID paket diperlukan." },
        { status: 400 }
      );
    }

    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.favorite.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: "Paket berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/admin/products error:", error);
    return NextResponse.json(
      {
        message:
          "Gagal menghapus paket (mungkin sudah tercatat di riwayat pesanan)",
      },
      { status: 500 }
    );
  }
}
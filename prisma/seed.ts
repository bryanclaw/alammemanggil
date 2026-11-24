import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Seed Akun Default Admin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@alammemanggil.com" },
    update: {},
    create: {
      name: "Admin Alam Memanggil",
      email: "admin@alammemanggil.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`Akun Admin siap: ${adminUser.email} (password: admin123)`);

  // 2. Seed Katalog Produk
  const products = [
    {
      title: "Open Trip Gunung Gede Pangrango 2D1N",
      slug: "open-trip-gunung-gede-pangrango",
      category: "TRIP",
      price: 450000,
      description:
        "Pendakian Gunung Gede via Putri/Cibodas 2 Hari 1 Malam. Termasuk SIMAKSI, tenda kelompok, alat masak, makan 3x, dan guide bersertifikat.",
      image: "/images/BROMO4.jpg",
      stock: 20,
    },
    {
      title: "Open Trip Gunung Papandayan Sunrise",
      slug: "open-trip-gunung-papandayan",
      category: "TRIP",
      price: 380000,
      description:
        "Menikmati pesona Hutan Mati, Kawah Papandayan, dan padang Edelweiss Tegal Alun. Cocok untuk pendaki pemula.",
      image: "/images/BROMO4.jpg",
      stock: 25,
    },
    {
      title: "Paket Outbound & Team Building Pangalengan",
      slug: "paket-outbound-pangalengan",
      category: "OUTBOUND",
      price: 275000,
      description:
        "Paket fun games, ice breaking, flying fox, dan makan siang prasmanan di area pinus Pangalengan.",
      image: "/images/BROMO4.jpg",
      stock: 50,
    },
    {
      title: "Sewa Tenda Dome Kapasitas 4 Orang (Double Layer)",
      slug: "sewa-tenda-dome-4p",
      category: "GEAR",
      price: 65000,
      description:
        "Tenda camping waterproof double layer kapasitas 4 orang, frame alloy kokoh, sudah termasuk pasak dan tali guyline.",
      image: "/images/BROMO4.jpg",
      stock: 15,
    },
  ];

  for (const item of products) {
    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {},
      create: item,
    });
  }

  console.log("Seed katalog produk berhasil dijalankan!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
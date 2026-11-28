"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Store,
  ClipboardList,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Eye,
  X,
  Sparkles,
  Upload,
  MapPin,
  Ban,
  Calendar,
  Crop,
  ZoomIn,
  Move,
  RotateCcw,
  Star,
  Bell,
  MessageCircle,
  CheckCheck,
  Tag,
  AlertTriangle,
  Send,
  Layers,
} from "lucide-react";

const TRIP_SUBCATEGORIES = ["HIKING", "TEKTOK", "ROCK_CLIMBING", "CAVING"];
const OUTBOUND_SUBCATEGORIES = [
  "FLYING_FOX",
  "RAPELING",
  "FLYING_FOX_RAPELING",
];
const RENTAL_SUBCATEGORIES = [
  "PAKET",
  "TAS_CARRIER",
  "ALAS_KAKI",
  "PAKAIAN",
  "PERLENGKAPAN_TIDUR_TENDA",
  "PENERANGAN",
  "LAINNYA",
];

type ProductMainCategory = "TRIP" | "OUTBOUND" | "RENTAL";

const REVIEWS_STORAGE_KEY = "alam_memanggil_customer_reviews_v1";
const REVIEWS_SYNC_EVENT = "alam_memanggil_reviews_sync_v1";
const ADMIN_NOTIFS_STORAGE_KEY = "alam_memanggil_admin_notifs_v1";
const ADMIN_NOTIFS_SYNC_EVENT = "alam_memanggil_admin_notifs_sync_v1";

type CropPresetKey = "16:9" | "4:3" | "1:1" | "3:4" | "4:5" | "free";

interface CropPresetOption {
  key: CropPresetKey;
  label: string;
  layoutHint: string;
  ratio: number | null;
}

const CROP_PRESETS: CropPresetOption[] = [
  {
    key: "4:3",
    label: "Katalog 4:3",
    layoutHint: "Pas Untuk Card Katalog & E-Commerce",
    ratio: 4 / 3,
  },
  {
    key: "1:1",
    label: "Square 1:1",
    layoutHint: "Grid Kotak / Keranjang / Thumbnail",
    ratio: 1,
  },
  {
    key: "16:9",
    label: "Landscape 16:9",
    layoutHint: "Banner / Galeri Lebar",
    ratio: 16 / 9,
  },
  {
    key: "3:4",
    label: "Portrait 3:4",
    layoutHint: "Card Vertikal / Galeri Tinggi",
    ratio: 3 / 4,
  },
  {
    key: "4:5",
    label: "Portrait 4:5",
    layoutHint: "Feed / Poster Vertikal",
    ratio: 4 / 5,
  },
  {
    key: "free",
    label: "Rasio Asli",
    layoutHint: "Mengikuti Proporsi Asli Foto",
    ratio: null,
  },
];

export interface ItineraryEntry {
  day: number;
  startTime: string;
  endTime: string;
  activity: string;
}

export interface EssentialEntry {
  no: number;
  itemName: string;
  quantity: string;
  note: string;
}

export interface RuleEntry {
  no: number;
  rule: string;
}

export interface RentalPackageItem {
  name: string;
  quantity: string;
  note?: string;
}

export interface TimeTripSlot {
  id: string;
  dateLabel: string;
  quota: number;
  sold?: boolean;
}

export interface ProductMeta {
  isRecommended?: boolean;
  location?: string;
  elevation?: string;
  grade?: string;
  route?: string;
  duration?: string;
  quota?: string;
  mapsUrl?: string;
  documentationImages?: string[];
  documentationCaptions?: string[];
  timeTrips?: TimeTripSlot[];
  unavailableDates?: string[];
  bookedDates?: string[];
  packageItems?: RentalPackageItem[];
  servicesItems?: string[];
  advantagesItems?: string[];
  meetingPoints?: string[];
  trailPosts?: string[];
  includeItems?: string[];
  itineraryItems?: ItineraryEntry[];
  essentialItems?: EssentialEntry[];
  rulesItems?: RuleEntry[];
  includesText?: string;
  rulesText?: string;
}

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  subCategory?: string | null;
  price: number;
  description: string;
  image: string;
  stock: number;
  metaData?: ProductMeta | null;
}

interface AdminOrderItem {
  id: string;
  productId?: string;
  quantity: number;
  price: number;
  selectedSchedule?: string | null;
  product: {
    id?: string;
    title: string;
    category: string;
  };
}

interface AdminOrder {
  id: string;
  totalAmount: number;
  status: "WAITING_CONFIRMATION" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  senderName?: string | null;
  bankName?: string | null;
  paymentProof?: string | null;
  notes?: string | null;
  createdAt: string;
  user: {
    id?: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  items: AdminOrderItem[];
}

interface DiscountCodeItem {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

interface CustomerReviewRecord {
  id: string;
  orderId: string;
  orderCode: string;
  rating: number;
  tags: string[];
  comment: string;
  createdAt: string;
}

interface AdminNotificationItem {
  id: string;
  type:
    | "NEW_ORDER"
    | "REUPLOAD_PROOF"
    | "CANCELLED_BY_CUSTOMER"
    | "NEW_REVIEW"
    | "GENERAL";
  title: string;
  message: string;
  orderCode?: string;
  customerName?: string;
  isRead: boolean;
  createdAt: string;
}

type AdminOrderFilterTab =
  | "WAITING_CONFIRMATION"
  | "COMPLETED"
  | "CANCELLED"
  | "REVIEWS";

const DEFAULT_TRIP_INCLUDE_TEMPLATE: string[] = [
  "Transportasi PP dari meeting point",
  "Basecamp Tempat Singgah",
  "Porter Kelompok",
  "Pickup BC",
  "Tour Crew Berpengalaman",
  "Simaksi / Tiket Masuk",
  "Tenda Kapasitas 4 Orang",
  "Alat Masak & Makan",
  "Tenda Toilet",
  "Makan Sebelum Pendakian",
  "Makan Selama Pendakian",
  "Minuman Hangat",
  "Sop Jelly & Buah",
  "Dokumentasi",
  "P3K Kelompok",
  "Sertifikat Apresiasi Digital",
];

const DEFAULT_TRIP_ITINERARY_TEMPLATE: ItineraryEntry[] = [
  {
    day: 1,
    startTime: "20.00",
    endTime: "20.30",
    activity: "Berkumpul di Meeting Point & Registrasi Peserta",
  },
  {
    day: 1,
    startTime: "20.30",
    endTime: "02.00",
    activity: "Perjalanan Menuju Basecamp Pendakian",
  },
  {
    day: 2,
    startTime: "02.00",
    endTime: "06.00",
    activity: "Istirahat di Basecamp, Sarapan & Packing Ulang",
  },
  {
    day: 2,
    startTime: "06.00",
    endTime: "07.00",
    activity: "Briefing, Pemanasan & Doa Bersama sebelum Pendakian",
  },
  {
    day: 2,
    startTime: "07.00",
    endTime: "13.00",
    activity: "Pendakian Menuju Area Camp",
  },
  {
    day: 2,
    startTime: "13.00",
    endTime: "18.00",
    activity: "Mendirikan Tenda, Makan Siang & Istirahat Bebas",
  },
  {
    day: 2,
    startTime: "18.00",
    endTime: "21.00",
    activity: "Makan Malam, Briefing Summit & Istirahat",
  },
  {
    day: 3,
    startTime: "02.30",
    endTime: "03.30",
    activity: "Bangun Pagi, Minuman Hangat & Persiapan Summit Attack",
  },
  {
    day: 3,
    startTime: "03.30",
    endTime: "06.00",
    activity: "Summit Attack Menuju Puncak Gunung",
  },
  {
    day: 3,
    startTime: "06.00",
    endTime: "07.30",
    activity: "Menikmati Sunrise & Sesi Dokumentasi di Puncak",
  },
  {
    day: 3,
    startTime: "10.30",
    endTime: "15.00",
    activity: "Perjalanan Turun Menuju Basecamp",
  },
  {
    day: 3,
    startTime: "15.00",
    endTime: "17.00",
    activity: "Bersih-bersih, Makan & Persiapan Kembali ke Meeting Point",
  },
  {
    day: 3,
    startTime: "17.00",
    endTime: "23.00",
    activity: "Perjalanan Pulang ke Meeting Point & Trip Selesai",
  },
];

const DEFAULT_ESSENTIAL_TEMPLATE: EssentialEntry[] = [
  { no: 1, itemName: "Tas Carrier", quantity: "1", note: "Ukuran 45 - 60 L" },
  { no: 2, itemName: "Raincover", quantity: "1", note: "Sesuai Ukuran Carrier" },
  {
    no: 3,
    itemName: "Baju Ganti",
    quantity: "minimal 2",
    note: "Disarankan bahan olahraga",
  },
  {
    no: 4,
    itemName: "Celana Ganti",
    quantity: "minimal 2",
    note: "Disarankan panjang, tidak boleh jeans",
  },
  { no: 5, itemName: "Pakaian Dalam", quantity: "minimal 2", note: "-" },
  {
    no: 6,
    itemName: "Kaos Kaki",
    quantity: "minimal 3",
    note: "Disarankan kaos kaki tebal dan panjang",
  },
  {
    no: 7,
    itemName: "Jaket",
    quantity: "1",
    note: "Disarankan jaket tebal atau windbreaker",
  },
  {
    no: 8,
    itemName: "Sepatu Gunung",
    quantity: "1",
    note: "Dilarang mengenakan sandal gunung",
  },
  { no: 9, itemName: "Ponco/Jas Hujan", quantity: "1", note: "-" },
  { no: 10, itemName: "Sleeping Bag", quantity: "1", note: "-" },
  { no: 11, itemName: "Matras Gulung", quantity: "1", note: "-" },
  {
    no: 12,
    itemName: "Sarung Tangan",
    quantity: "1",
    note: "Untuk menahan dingin",
  },
  { no: 13, itemName: "Buff", quantity: "1", note: "Untuk menahan debu" },
  {
    no: 14,
    itemName: "Air mineral",
    quantity: "2 ( 600 ml )",
    note: "Untuk minum pribadi selama di gunung",
  },
  {
    no: 15,
    itemName: "Air mineral",
    quantity: "2 ( 1,5 L )",
    note: "Untuk minum pribadi selama di gunung",
  },
  {
    no: 16,
    itemName: "Headlamp",
    quantity: "1",
    note: "Headlamp kepala agar memudahkan tangan memegang yang lain",
  },
  {
    no: 17,
    itemName: "Baterai Ganti",
    quantity: "1 set",
    note: "Jumlah dan ukuran disesuaikan dengan baterai headlamp",
  },
  {
    no: 18,
    itemName: "Plastik Sampah",
    quantity: "sesuaikan",
    note: "Untuk Sampah Pribadi",
  },
  {
    no: 19,
    itemName: "Snack Pribadi",
    quantity: "sesuaikan",
    note: "Jumlah dibebaskan",
  },
  { no: 20, itemName: "Handwarmer", quantity: "1", note: "-" },
  { no: 21, itemName: "Thermal Blanket", quantity: "1", note: "-" },
  {
    no: 22,
    itemName: "Dompet",
    quantity: "1",
    note: "Berisi uang cash dan KTP",
  },
  { no: 23, itemName: "Powerbank", quantity: "1", note: "Beserta kabel cas" },
];

const DEFAULT_TRIP_RULES_TEMPLATE: RuleEntry[] = [
  {
    no: 1,
    rule: "Harga hanya berlaku untuk WNI (Warga Negara Indonesia) dan harga ini tidak berlaku untuk WNA (Warga Negara Asing).",
  },
  {
    no: 2,
    rule: "Open Trip merupakan Trip Gabungan, dimana selama trip nanti peserta akan di gabung dengan peserta/group lainnya.",
  },
  {
    no: 3,
    rule: "Minimal Peserta 12 orang. Apabila peserta Open Trip kurang dari minimal Kuota, maka trip akan tetap berjalan dengan menyesuaikan harga dengan jumlah pesertanya.",
  },
  {
    no: 4,
    rule: "Peserta di harapkan untuk mempersiapkan Fisik dan memastikan dalam keadaan sehat sebelum melakukan pendakian. Bagi yang kurang sehat di harapkan untuk tidak memaksakan pendakian.",
  },
  {
    no: 5,
    rule: "Bagi Peserta yang memiliki penyakit khusus di harapkan untuk melakukan konsultasi terlebih dahulu dengan Dokter.",
  },
  {
    no: 6,
    rule: "Pembookingan Open Trip konfirmasi melalui WA kami.",
  },
  {
    no: 7,
    rule: "Pembookingan bisa di lakukan dengan melakukan pembayaran DP 50% dan Pelunasan bisa di lakukan H-7 sebelum trip berlangsung.",
  },
  {
    no: 8,
    rule: "Alam Memanggil tidak menerima booking tanpa adanya pembayaran DP terlebih dahulu.",
  },
  {
    no: 9,
    rule: "Setelah melakukan Pembayaran di harapkan untuk melakukan konfirmasi ke nomor WA Alam Memanggil.",
  },
  {
    no: 10,
    rule: "Peserta Open Trip di anggap fix apabila sudah melakukan pembayaran sejumlah yang tertera di form booking.",
  },
  {
    no: 11,
    rule: "Pembatalan Trip dari pihak Peserta secara sepihak, maka tidak ada pengembalian uang.",
  },
  {
    no: 12,
    rule: "Pembatalan keberangkatan tidak bisa pengembalian uang namun bisa digantikan oleh orang lain ( keluarga atau teman ).",
  },
  {
    no: 13,
    rule: "Alam Memanggil berhak untuk membatalkan trip dengan pertimbangan tertentu di luar kemampuan seperti cuaca buruk, kondisi atau situasi dimana membahayakan peserta akan tetapi ada pengembalian (refund) sebesar 50% atau tapi bisa pindah ke tanggal atau destinasi (gunung) lainnya.",
  },
  {
    no: 14,
    rule: "Pembayaran via Transfer hanya dikirimkan ke Nomor Rekening dibawah ini: Bank Central Asia (BCA) - No Rek: 7445357324 - Atas Nama: Dimas Alifio",
  },
];

const DEFAULT_OUTBOUND_RULES_TEMPLATE: RuleEntry[] = [
  {
    no: 1,
    rule: "Seluruh peserta dan pihak penyelenggara wajib mengikuti prosedur, arahan, serta tata tertib yang telah ditentukan oleh tim Alam Memanggil demi menjaga keamanan dan kelancaran kegiatan.",
  },
  {
    no: 2,
    rule: "Perubahan konsep kegiatan, lokasi, jumlah peserta, atau waktu pelaksanaan setelah proses kesepakatan dapat memengaruhi biaya dan teknis pelaksanaan.",
  },
  {
    no: 3,
    rule: "Pihak Penyelenggara wajib menanggung kerusakan alat akibat tindakan dari peserta.",
  },
  {
    no: 4,
    rule: "Pihak Penyelenggara tidak mengubah instalasi alat tanpa izin.",
  },
  {
    no: 5,
    rule: "Alam Memanggil memiliki hak untuk menghentikan sementara atau membatalkan aktivitas apabila ditemukan kondisi yang dapat membahayakan peserta.",
  },
  {
    no: 6,
    rule: "Alam Memanggil berhak menentukan kelayakan suatu lokasi pemasangan berdasarkan standar keamanan operasional yang berlaku.",
  },
  {
    no: 7,
    rule: "Setiap peserta wajib mengikuti briefing keselamatan sebelum melakukan aktivitas.",
  },
  {
    no: 8,
    rule: "Peserta harus memenuhi batas usia ( 6th - 60th ) dan berat badan ( < 100 kg ) yang telah ditentukan oleh operator.",
  },
  {
    no: 9,
    rule: "Peserta wajib dalam kondisi sehat saat mengikuti aktivitas.",
  },
  {
    no: 10,
    rule: "Peserta dengan kondisi khusus (contoh: riwayat penyakit jantung, tekanan darah tinggi, cedera tulang/sendi) wajib memberikan informasi kepada operator.",
  },
  {
    no: 11,
    rule: "Peserta tidak diperbolehkan melakukan aktivitas apabila sedang mengalami cedera, mengalami gangguan kesehatan yang dapat membahayakan keselamatan, dalam pengaruh alkohol atau zat terlarang.",
  },
  {
    no: 12,
    rule: "Peserta wajib menggunakan pakaian dan alas kaki yang aman.",
  },
  {
    no: 13,
    rule: "Peserta wajib menjaga sikap dan tidak melakukan tindakan yang dapat membahayakan diri sendiri maupun orang lain.",
  },
  {
    no: 14,
    rule: "Peserta wajib mengikuti seluruh arahan dari instruktur/operator.",
  },
  {
    no: 15,
    rule: "DP minimal 50% dari total biaya untuk mengunci jadwal.",
  },
  {
    no: 16,
    rule: "Pelunasan maksimal dilakukan sebelum hari pelaksanaan atau sesuai kesepakatan.",
  },
  {
    no: 17,
    rule: "Pembayaran hanya dilakukan melalui transfer bank BCA 7445357324 A/N Dimas Alifio.",
  },
  {
    no: 18,
    rule: "Bukti pembayaran wajib dikirimkan kepada pihak Alam Memanggil untuk proses administrasi.",
  },
  {
    no: 19,
    rule: "Pembatalan kegiatan tidak bisa pengembalian uang namun bisa digantikan tanggal lain dengan diskusi bersama.",
  },
  {
    no: 20,
    rule: "Perubahan tanggal kegiatan wajib diinformasikan minimal 7 hari sebelum acara.",
  },
  {
    no: 21,
    rule: "Perubahan jadwal menyesuaikan ketersediaan tim Alam Memanggil.",
  },
];

const DEFAULT_RENTAL_RULES_TEMPLATE: RuleEntry[] = [
  {
    no: 1,
    rule: "Durasi sewa dihitung per malam (24 jam sejak waktu pengambilan/pengiriman sesuai kesepakatan).",
  },
  {
    no: 2,
    rule: "Pengambilan alat maksimal H-1 dan pengembalian maksimal H+1 dari jadwal sewa (atau tepat hari H / tanggal sewa). Pengambilan H-2 seterusnya atau pengembalian H+2 seterusnya akan dikenakan tarif perhitungan tambahan.",
  },
  {
    no: 3,
    rule: "Penyewa wajib menyertakan identitas valid (KTP/SIM) serta mengecek kondisi fisik alat saat diterima bersama tim Alam Memanggil.",
  },
  {
    no: 4,
    rule: "Kerusakan, robek, patah, atau kehilangan alat selama masa sewa menjadi tanggung jawab penyewa sesuai tingkat kerusakan atau biaya penggantian.",
  },
  {
    no: 5,
    rule: "Keterlambatan pengembalian melewati batas waktu dikenakan denda sesuai ketentuan sewa yang berlaku.",
  },
];

const DEFAULT_RENTAL_PACKAGE_ITEMS: RentalPackageItem[] = [
  { name: "Sleeping Bag", quantity: "1", note: "-" },
  { name: "Matras Gulung", quantity: "1", note: "-" },
  { name: "Tas Carrier", quantity: "1", note: "45 - 60 L" },
];

function cloneTripIncludeTemplate(): string[] {
  return [...DEFAULT_TRIP_INCLUDE_TEMPLATE];
}

function cloneTripItineraryTemplate(): ItineraryEntry[] {
  return DEFAULT_TRIP_ITINERARY_TEMPLATE.map((item) => ({ ...item }));
}

function cloneEssentialTemplate(): EssentialEntry[] {
  return DEFAULT_ESSENTIAL_TEMPLATE.map((item) => ({ ...item }));
}

function cloneRulesTemplate(cat: ProductMainCategory): RuleEntry[] {
  const source =
    cat === "OUTBOUND"
      ? DEFAULT_OUTBOUND_RULES_TEMPLATE
      : cat === "RENTAL"
      ? DEFAULT_RENTAL_RULES_TEMPLATE
      : DEFAULT_TRIP_RULES_TEMPLATE;
  return source.map((item) => ({ ...item }));
}

function cloneRentalPackageItemsTemplate(): RentalPackageItem[] {
  return DEFAULT_RENTAL_PACKAGE_ITEMS.map((item) => ({ ...item }));
}

function getDefaultSubCategory(cat: ProductMainCategory): string {
  if (cat === "OUTBOUND") return "FLYING_FOX";
  if (cat === "RENTAL") return "PAKET";
  return "HIKING";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function renderCroppedDataUrl(
  imageSrc: string,
  presetKey: CropPresetKey,
  zoom: number,
  offsetX: number,
  offsetY: number
): Promise<string> {
  const img = await loadImageElement(imageSrc);
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;

  const preset =
    CROP_PRESETS.find((p) => p.key === presetKey) || CROP_PRESETS[0];
  const targetRatio =
    preset.ratio !== null
      ? preset.ratio
      : Math.max(0.4, Math.min(2.5, natW / natH));

  const currentRatio = natW / natH;
  let baseCropW = natW;
  let baseCropH = natH;

  if (currentRatio > targetRatio) {
    baseCropW = natH * targetRatio;
    baseCropH = natH;
  } else {
    baseCropW = natW;
    baseCropH = natW / targetRatio;
  }

  const safeZoom = Math.max(1, zoom);
  const cropW = baseCropW / safeZoom;
  const cropH = baseCropH / safeZoom;

  const maxShiftX = Math.max(0, (natW - cropW) / 2);
  const maxShiftY = Math.max(0, (natH - cropH) / 2);

  const normX = Math.max(-1, Math.min(1, offsetX / 100));
  const normY = Math.max(-1, Math.min(1, offsetY / 100));

  const centerX = natW / 2 + normX * maxShiftX;
  const centerY = natH / 2 + normY * maxShiftY;

  const sx = Math.max(0, Math.min(natW - cropW, centerX - cropW / 2));
  const sy = Math.max(0, Math.min(natH - cropH, centerY - cropH / 2));

  const maxOutputWidth = 1280;
  const outW = Math.min(maxOutputWidth, Math.round(cropW));
  const outH = Math.max(1, Math.round(outW / targetRatio));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return imageSrc;

  ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function getAdminUnitLabel(category?: string | null): string {
  const cat = String(category || "TRIP").toUpperCase();
  if (cat === "OUTBOUND") return "Hari";
  if (cat === "RENTAL" || cat === "GEAR") return "Item";
  return "Pax";
}

function extractScheduleFromNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Jadwal\s*:\s*([^\n]+)/i);
  if (match?.[1]?.trim()) return match[1].trim();
  const rentalFallback = notes.match(/(Rental\s+[^\n]+)/i);
  return rentalFallback?.[1]?.trim() || null;
}

function getScheduleForAdminItem(
  item: AdminOrderItem,
  order: AdminOrder
): string | null {
  if (item.selectedSchedule && item.selectedSchedule.trim()) {
    return item.selectedSchedule.trim();
  }
  const notesSchedule = extractScheduleFromNotes(order.notes);
  if (!notesSchedule) return null;

  const segments = notesSchedule
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const titleLower = item.product.title.trim().toLowerCase();

  const matchedSeg = segments.find((seg) =>
    seg.toLowerCase().startsWith(titleLower)
  );
  if (matchedSeg) {
    const cleaned = matchedSeg
      .replace(new RegExp(`^${item.product.title}\\s*:\\s*`, "i"), "")
      .trim();
    return cleaned || matchedSeg;
  }

  return notesSchedule;
}

function getAdminItemSubtotal(
  item: AdminOrderItem,
  scheduleText: string | null
): number {
  const cat = String(item.product.category || "").toUpperCase();
  if (cat === "RENTAL") {
    const mlmMatch = (scheduleText || "").match(/(\d+)\s*(?:mlm|malam)/i);
    const nights = mlmMatch?.[1] ? Math.max(1, Number(mlmMatch[1])) : 1;
    return item.price * item.quantity * nights;
  }
  return item.price * item.quantity;
}

function splitAdminNoteLines(notes?: string | null): string[] {
  if (!notes) return [];
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractReturnDateFromOrder(order: AdminOrder): string | null {
  const combined = [
    order.notes || "",
    ...order.items.map((it) => it.selectedSchedule || ""),
  ].join(" ");
  const retMatch = combined.match(/Kembali\s*:\s*(\d{4}-\d{2}-\d{2})/i);
  if (retMatch?.[1]) return retMatch[1];

  const batasMatch = combined.match(/Batas Kembali\s*:\s*(\d{4}-\d{2}-\d{2})/i);
  if (batasMatch?.[1]) return batasMatch[1];

  const dates = combined.match(/\d{4}-\d{2}-\d{2}/g);
  return dates && dates.length > 0 ? dates[dates.length - 1] : null;
}

function getTodayIsoStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isOrderRentalOverdue(order: AdminOrder): boolean {
  const hasRental = order.items.some(
    (it) => String(it.product?.category || "").toUpperCase() === "RENTAL"
  );
  if (!hasRental) return false;
  if (order.status === "CANCELLED") return false;
  const returnDate = extractReturnDateFromOrder(order);
  if (!returnDate) return false;
  return returnDate < getTodayIsoStr();
}

function isCancelledByCustomer(order: AdminOrder): boolean {
  return (
    order.status === "CANCELLED" &&
    /Dibatalkan oleh pelanggan/i.test(order.notes || "")
  );
}

function extractIsoDatesFromText(text?: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/\d{4}-\d{2}-\d{2}/g);
  return matches ? Array.from(new Set(matches)) : [];
}

function resolveOrderCodeOnly(rawCode?: string, rawOrderId?: string): string {
  const cleanCode = (rawCode || "").trim();
  if (cleanCode && cleanCode.startsWith("#")) {
    return cleanCode;
  }
  if (cleanCode && !/open trip|outbound|gunung/i.test(cleanCode)) {
    return cleanCode;
  }
  if (rawOrderId && rawOrderId !== "MANUAL") {
    return `#${String(rawOrderId).slice(-6).toUpperCase()}`;
  }
  return "#ORDER";
}

function normalizeWaPhone(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    digits = `62${digits}`;
  }
  return digits.length >= 8 ? digits : null;
}

function buildCustomerWaContactUrl(
  order: AdminOrder,
  formatRupiahFn: (n: number) => string
): string | null {
  const waNumber = normalizeWaPhone(order.user?.phone);
  if (!waNumber) return null;

  const code = `#${order.id.slice(-6).toUpperCase()}`;
  const customerName = order.user?.name || order.user?.email || "Pelanggan";
  const overdue = isOrderRentalOverdue(order);
  const returnDate = extractReturnDateFromOrder(order);

  if (overdue) {
    const lines = [
      `Halo Kak *${customerName}*, kami dari tim *Alam Memanggil* ingin mengingatkan pengembalian alat rental pada pesanan *${code}*.`,
      "",
      `Tanggal Kembali Terjadwal: *${returnDate || "-"}* (sudah melewati jadwal).`,
      "Mohon segera mengonfirmasi pengembalian alat atau menghubungi admin terkait proses pengembalian dan ketentuan keterlambatannya ya.",
    ];
    return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const isCompleted =
    order.status === "COMPLETED" || order.status === "PROCESSING";
  const isCancelled = order.status === "CANCELLED";

  const statusText = isCompleted
    ? "Selesai / Dikonfirmasi"
    : isCancelled
    ? isCancelledByCustomer(order)
      ? "Dibatalkan Pelanggan"
      : "Ditolak Admin"
    : "Menunggu Konfirmasi";

  const lines = [
    `Halo Kak *${customerName}*, kami dari tim *Alam Memanggil* ingin menghubungi terkait pesanan *${code}*.`,
    "",
    `Status Pesanan: *${statusText}*`,
    `Total Pembayaran: *${formatRupiahFn(order.totalAmount)}*`,
  ];

  return `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export default function AdminDashboardPage() {
  const [activeMenu, setActiveMenu] = useState<
    "catalog" | "orders" | "discounts" | "notifications" | "settings"
  >("catalog");
  const [toast, setToast] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [filterCategory, setFilterCategory] =
    useState<ProductMainCategory>("TRIP");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ProductMainCategory>("TRIP");
  const [subCategory, setSubCategory] = useState("HIKING");
  const [isRecommended, setIsRecommended] = useState(false);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [coverImage, setCoverImage] = useState("");
  const [documentationImages, setDocumentationImages] = useState<string[]>([]);
  const [documentationCaptions, setDocumentationCaptions] = useState<string[]>(
    []
  );
  const [mapsUrl, setMapsUrl] = useState("");
  const [description, setDescription] = useState("");

  const [cropTarget, setCropTarget] = useState<"COVER" | "DOCS">("DOCS");
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [cropPreset, setCropPreset] = useState<CropPresetKey>("4:3");
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropOffsetX, setCropOffsetX] = useState<number>(0);
  const [cropOffsetY, setCropOffsetY] = useState<number>(0);
  const [applyingCrop, setApplyingCrop] = useState<boolean>(false);

  const [location, setLocation] = useState("");
  const [elevation, setElevation] = useState("");
  const [grade, setGrade] = useState("2");
  const [route, setRoute] = useState("");
  const [duration, setDuration] = useState("");
  const [quota, setQuota] = useState("");

  const [timeTrips, setTimeTrips] = useState<TimeTripSlot[]>([
    { id: "slot-1", dateLabel: "", quota: 10, sold: false },
  ]);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [newUnavailableDate, setNewUnavailableDate] = useState("");
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [packageItems, setPackageItems] = useState<RentalPackageItem[]>(
    cloneRentalPackageItemsTemplate()
  );

  const [servicesItems, setServicesItems] = useState<string[]>([""]);
  const [advantagesItems, setAdvantagesItems] = useState<string[]>([""]);
  const [meetingPoints, setMeetingPoints] = useState<string[]>([""]);
  const [trailPosts, setTrailPosts] = useState<string[]>([""]);
  const [includeItems, setIncludeItems] = useState<string[]>(
    cloneTripIncludeTemplate()
  );
  const [itineraryItems, setItineraryItems] = useState<ItineraryEntry[]>(
    cloneTripItineraryTemplate()
  );
  const [essentialItems, setEssentialItems] = useState<EssentialEntry[]>(
    cloneEssentialTemplate()
  );
  const [rulesItems, setRulesItems] = useState<RuleEntry[]>(
    cloneRulesTemplate("TRIP")
  );

  const [savingProduct, setSavingProduct] = useState(false);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderTab, setOrderTab] =
    useState<AdminOrderFilterTab>("WAITING_CONFIRMATION");
  const [previewProof, setPreviewProof] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [remindingOrderId, setRemindingOrderId] = useState<string | null>(null);

  const [discounts, setDiscounts] = useState<DiscountCodeItem[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newMinPurchase, setNewMinPurchase] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [creatingDiscount, setCreatingDiscount] = useState(false);
  const [deletingDiscountId, setDeletingDiscountId] = useState<string | null>(
    null
  );

  const [customerReviews, setCustomerReviews] = useState<CustomerReviewRecord[]>(
    []
  );
  const [storedAdminNotifs, setStoredAdminNotifs] = useState<
    AdminNotificationItem[]
  >([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  const [storeName, setStoreName] = useState("Alam Memanggil");
  const [waAdminNumber, setWaAdminNumber] = useState("6281292548524");
  const [bankName, setBankName] = useState("Bank Central Asia (BCA)");
  const [accountNumber, setAccountNumber] = useState("7445357324");
  const [accountHolder, setAccountHolder] = useState("Dimas Alifio");
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const loadCustomerReviews = useCallback(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (!saved) {
        setCustomerReviews([]);
        return;
      }
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setCustomerReviews(
          parsed.map((item) => ({
            id: String(item.id || Date.now()),
            orderId: String(item.orderId || ""),
            orderCode: resolveOrderCodeOnly(item.orderCode, item.orderId),
            rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
            tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
            comment: String(item.comment || ""),
            createdAt: String(item.createdAt || new Date().toISOString()),
          }))
        );
      }
    } catch {
      // abaikan error storage
    }
  }, []);

  const loadStoredAdminNotifs = useCallback(() => {
    try {
      const saved = localStorage.getItem(ADMIN_NOTIFS_STORAGE_KEY);
      if (!saved) {
        setStoredAdminNotifs([]);
        return;
      }
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setStoredAdminNotifs(parsed);
      }
    } catch {
      // abaikan error storage
    }
  }, []);

  const handleDeleteCustomerReview = (reviewId: string) => {
    const updated = customerReviews.filter((r) => r.id !== reviewId);
    setCustomerReviews(updated);
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(REVIEWS_SYNC_EVENT));
    } catch {
      // abaikan error storage
    }
    showToast("Ulasan dihapus di admin dan ikut terhapus di sisi customer.");
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/products?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/orders?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchDiscounts = async () => {
    setLoadingDiscounts(true);
    try {
      const res = await fetch(`/api/admin/discounts?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setDiscounts(data.discounts || []);
      }
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/admin/settings?_t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.setting) {
        setStoreName(data.setting.storeName);
        setWaAdminNumber(data.setting.waAdminNumber);
        setBankName(data.setting.bankName);
        setAccountNumber(data.setting.accountNumber);
        setAccountHolder(data.setting.accountHolder);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchDiscounts();
    fetchSettings();
    loadCustomerReviews();
    loadStoredAdminNotifs();

    const onReviewsSync = () => loadCustomerReviews();
    const onNotifsSync = () => loadStoredAdminNotifs();

    window.addEventListener("storage", onReviewsSync);
    window.addEventListener("storage", onNotifsSync);
    window.addEventListener(REVIEWS_SYNC_EVENT, onReviewsSync);
    window.addEventListener(ADMIN_NOTIFS_SYNC_EVENT, onNotifsSync);

    return () => {
      window.removeEventListener("storage", onReviewsSync);
      window.removeEventListener("storage", onNotifsSync);
      window.removeEventListener(REVIEWS_SYNC_EVENT, onReviewsSync);
      window.removeEventListener(ADMIN_NOTIFS_SYNC_EVENT, onNotifsSync);
    };
  }, [loadCustomerReviews, loadStoredAdminNotifs]);

  useEffect(() => {
    if (activeMenu === "orders" || activeMenu === "notifications") {
      loadCustomerReviews();
      loadStoredAdminNotifs();
    }
    if (activeMenu === "discounts") {
      fetchDiscounts();
    }
  }, [activeMenu, orderTab, loadCustomerReviews, loadStoredAdminNotifs]);

  const handleSendReturnReminder = async (order: AdminOrder) => {
    setRemindingOrderId(order.id);
    const code = `#${order.id.slice(-6).toUpperCase()}`;
    const returnDate = extractReturnDateFromOrder(order);
    const rentalTitles = order.items
      .filter(
        (it) => String(it.product?.category || "").toUpperCase() === "RENTAL"
      )
      .map((it) => it.product.title)
      .join(", ");

    const messageText = `Pengingat Pengembalian Rental (${code}): Jadwal pengembalian ${
      rentalTitles ? `untuk ${rentalTitles} ` : ""
    }pada ${
      returnDate || "tanggal sewa"
    } telah lewat. Mohon segera kembalikan alat atau hubungi admin Alam Memanggil.`;

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          action: "SEND_RETURN_REMINDER",
          returnDate,
          reminderMessage: messageText,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.message ||
            `Pemberitahuan pengembalian dikirim ke customer pesanan ${code}.`
        );
      } else {
        showToast(data.message || "Gagal mengirim pemberitahuan pengembalian.");
      }
    } catch {
      showToast("Terjadi kesalahan saat mengirim pemberitahuan.");
    } finally {
      setRemindingOrderId(null);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDiscount(true);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newDiscountCode.trim().toUpperCase(),
          discountType: newDiscountType,
          discountValue: Number(newDiscountValue),
          minPurchase: Number(newMinPurchase) || 0,
          expiresAt: newExpiresAt || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Kode diskon berhasil dibuat!");
        setNewDiscountCode("");
        setNewDiscountValue("");
        setNewMinPurchase("");
        setNewExpiresAt("");
        fetchDiscounts();
      } else {
        showToast(data.message || "Gagal membuat kode diskon.");
      }
    } finally {
      setCreatingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    setDeletingDiscountId(id);
    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Kode diskon dihapus.");
        fetchDiscounts();
      } else {
        showToast(data.message || "Gagal menghapus kode diskon.");
      }
    } finally {
      setDeletingDiscountId(null);
    }
  };

  const adminNotifications = useMemo<AdminNotificationItem[]>(() => {
    const list: AdminNotificationItem[] = storedAdminNotifs
      .filter((n) => !dismissedNotifIds.includes(n.id))
      .map((n) => ({
        ...n,
        isRead: n.isRead || readNotifIds.includes(n.id),
      }));

    const existingText = list
      .map((i) => `${i.title} ${i.message}`.toLowerCase())
      .join(" ");

    for (const ord of orders) {
      const code = `#${ord.id.slice(-6).toUpperCase()}`;
      const custName = ord.user?.name || ord.user?.email || "Pelanggan";
      const orderNotifId = `ord-masuk-${ord.id}-${ord.status}`;

      if (
        ord.status === "WAITING_CONFIRMATION" &&
        !dismissedNotifIds.includes(orderNotifId) &&
        !existingText.includes(code.toLowerCase())
      ) {
        list.push({
          id: orderNotifId,
          type: "NEW_ORDER",
          title: `Pesanan masuk ${code} (${custName})`,
          message: `Bukti transfer dari ${ord.senderName || custName} (${
            ord.bankName || "-"
          }) siap diverifikasi admin.`,
          orderCode: code,
          customerName: custName,
          isRead: readNotifIds.includes(orderNotifId),
          createdAt: ord.createdAt,
        });
      } else if (isCancelledByCustomer(ord)) {
        const cancelNotifId = `ord-cancel-${ord.id}`;
        if (
          !dismissedNotifIds.includes(cancelNotifId) &&
          !existingText.includes(`${code.toLowerCase()} dibatalkan`)
        ) {
          list.push({
            id: cancelNotifId,
            type: "CANCELLED_BY_CUSTOMER",
            title: `Pesanan ${code} dibatalkan pelanggan`,
            message: `${custName} membatalkan pesanan ${code}.`,
            orderCode: code,
            customerName: custName,
            isRead: readNotifIds.includes(cancelNotifId),
            createdAt: ord.createdAt,
          });
        }
      }
    }

    for (const rev of customerReviews) {
      const code = resolveOrderCodeOnly(rev.orderCode, rev.orderId);
      const revNotifId = `rev-masuk-${rev.id}`;
      if (
        !dismissedNotifIds.includes(revNotifId) &&
        !existingText.includes(`ulasan baru ${code.toLowerCase()}`)
      ) {
        list.push({
          id: revNotifId,
          type: "NEW_REVIEW",
          title: `Ulasan baru ${code} (${rev.rating}/5 ⭐)`,
          message: rev.comment,
          orderCode: code,
          isRead: readNotifIds.includes(revNotifId),
          createdAt: rev.createdAt,
        });
      }
    }

    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [
    storedAdminNotifs,
    orders,
    customerReviews,
    readNotifIds,
    dismissedNotifIds,
  ]);

  const unreadAdminNotifCount = adminNotifications.filter((n) => !n.isRead).length;

  const markAdminNotifRead = (id: string) => {
    setReadNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    try {
      const updated = storedAdminNotifs.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      localStorage.setItem(ADMIN_NOTIFS_STORAGE_KEY, JSON.stringify(updated));
      setStoredAdminNotifs(updated);
    } catch {
      // abaikan
    }
  };

  const markAllAdminNotifsRead = () => {
    setReadNotifIds(adminNotifications.map((n) => n.id));
    try {
      const updated = storedAdminNotifs.map((n) => ({ ...n, isRead: true }));
      localStorage.setItem(ADMIN_NOTIFS_STORAGE_KEY, JSON.stringify(updated));
      setStoredAdminNotifs(updated);
    } catch {
      // abaikan
    }
  };

  const handleDeleteAdminNotif = (id: string) => {
    setDismissedNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    try {
      const updated = storedAdminNotifs.filter((n) => n.id !== id);
      localStorage.setItem(ADMIN_NOTIFS_STORAGE_KEY, JSON.stringify(updated));
      setStoredAdminNotifs(updated);
    } catch {
      // abaikan
    }
    showToast("Notifikasi admin dihapus.");
  };

  const handleClearAllAdminNotifs = () => {
    const allIds = adminNotifications.map((n) => n.id);
    setDismissedNotifIds((prev) => Array.from(new Set([...prev, ...allIds])));
    try {
      localStorage.setItem(ADMIN_NOTIFS_STORAGE_KEY, JSON.stringify([]));
      setStoredAdminNotifs([]);
    } catch {
      // abaikan
    }
    showToast("Semua notifikasi admin dibersihkan.");
  };

  const resetFormForAdd = (initialCat: ProductMainCategory = "TRIP") => {
    setEditingId(null);
    setTitle("");
    setCategory(initialCat);
    setSubCategory(getDefaultSubCategory(initialCat));
    setIsRecommended(false);
    setPrice("");
    setStock("10");
    setCoverImage("");
    setDocumentationImages([]);
    setDocumentationCaptions([]);
    setCropQueue([]);
    setCropPreset("4:3");
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    setMapsUrl("");
    setDescription("");
    setLocation("");
    setElevation("");
    setGrade("2");
    setRoute("");
    setDuration("");
    setQuota("");
    setTimeTrips([
      { id: `slot-${Date.now()}`, dateLabel: "", quota: 10, sold: false },
    ]);
    setUnavailableDates([]);
    setNewUnavailableDate("");
    setBookedDates([]);
    setPackageItems(cloneRentalPackageItemsTemplate());
    setServicesItems([""]);
    setAdvantagesItems([""]);
    setMeetingPoints([""]);
    setTrailPosts([""]);
    setIncludeItems(
      initialCat === "TRIP" ? cloneTripIncludeTemplate() : [""]
    );
    setItineraryItems(
      initialCat === "TRIP"
        ? cloneTripItineraryTemplate()
        : [{ day: 1, startTime: "", endTime: "", activity: "" }]
    );
    setEssentialItems(cloneEssentialTemplate());
    setRulesItems(cloneRulesTemplate(initialCat));
  };

  const openAddModal = () => {
    resetFormForAdd(filterCategory);
    setIsModalOpen(true);
  };

  const handleCategoryChangeInModal = (nextCat: ProductMainCategory) => {
    setCategory(nextCat);
    setSubCategory(getDefaultSubCategory(nextCat));
    if (nextCat !== "TRIP") {
      setIsRecommended(false);
    }
    if (nextCat === "RENTAL" && packageItems.length === 0) {
      setPackageItems(cloneRentalPackageItemsTemplate());
    }
    if (!editingId) {
      setRulesItems(cloneRulesTemplate(nextCat));
      if (nextCat === "TRIP") {
        setIncludeItems(cloneTripIncludeTemplate());
        setItineraryItems(cloneTripItineraryTemplate());
        setEssentialItems(cloneEssentialTemplate());
      } else {
        setIncludeItems([""]);
        setItineraryItems([
          { day: 1, startTime: "", endTime: "", activity: "" },
        ]);
      }
    }
  };

  const openEditModal = (prod: ProductItem) => {
    const meta = (prod.metaData || {}) as ProductMeta;
    const rawCat = String(prod.category || "TRIP").toUpperCase();
    const resolvedCat: ProductMainCategory =
      rawCat === "OUTBOUND"
        ? "OUTBOUND"
        : rawCat === "RENTAL"
        ? "RENTAL"
        : "TRIP";

    setEditingId(prod.id);
    setTitle(prod.title);
    setCategory(resolvedCat);
    setSubCategory(prod.subCategory || getDefaultSubCategory(resolvedCat));
    setIsRecommended(Boolean(meta.isRecommended) && resolvedCat === "TRIP");
    setPrice(String(prod.price));
    setStock(String(prod.stock ?? 10));
    setCoverImage(prod.image || "");
    setDocumentationImages(meta.documentationImages || []);
    setDocumentationCaptions(meta.documentationCaptions || []);
    setCropQueue([]);
    setMapsUrl(meta.mapsUrl || "");
    setDescription(prod.description || "");
    setLocation(meta.location || "");
    setElevation(meta.elevation || "");
    setGrade(meta.grade || "2");
    setRoute(meta.route || "");
    setDuration(meta.duration || "");
    setQuota(meta.quota || "");

    setTimeTrips(
      meta.timeTrips && meta.timeTrips.length > 0
        ? meta.timeTrips
        : [{ id: `slot-${Date.now()}`, dateLabel: "", quota: 10, sold: false }]
    );
    setUnavailableDates(meta.unavailableDates || []);
    setNewUnavailableDate("");
    setBookedDates(meta.bookedDates || []);
    setPackageItems(
      Array.isArray(meta.packageItems) && meta.packageItems.length > 0
        ? meta.packageItems.map((p) => ({
            name: String(p.name || ""),
            quantity: String(p.quantity || "1"),
            note: String(p.note || ""),
          }))
        : cloneRentalPackageItemsTemplate()
    );

    setServicesItems(
      meta.servicesItems && meta.servicesItems.length > 0
        ? meta.servicesItems
        : [""]
    );
    setAdvantagesItems(
      meta.advantagesItems && meta.advantagesItems.length > 0
        ? meta.advantagesItems
        : [""]
    );
    setMeetingPoints(
      meta.meetingPoints && meta.meetingPoints.length > 0
        ? meta.meetingPoints
        : [""]
    );
    setTrailPosts(
      meta.trailPosts && meta.trailPosts.length > 0 ? meta.trailPosts : [""]
    );

    if (meta.includeItems && meta.includeItems.length > 0) {
      setIncludeItems(meta.includeItems);
    } else if (meta.includesText) {
      const parsedInc = meta.includesText.split("\n").filter(Boolean);
      setIncludeItems(
        parsedInc.length > 0
          ? parsedInc
          : resolvedCat === "TRIP"
          ? cloneTripIncludeTemplate()
          : [""]
      );
    } else {
      setIncludeItems(
        resolvedCat === "TRIP" ? cloneTripIncludeTemplate() : [""]
      );
    }

    setItineraryItems(
      meta.itineraryItems && meta.itineraryItems.length > 0
        ? meta.itineraryItems
        : resolvedCat === "TRIP"
        ? cloneTripItineraryTemplate()
        : [{ day: 1, startTime: "", endTime: "", activity: "" }]
    );

    setEssentialItems(
      meta.essentialItems && meta.essentialItems.length > 0
        ? meta.essentialItems
        : cloneEssentialTemplate()
    );

    if (meta.rulesItems && meta.rulesItems.length > 0) {
      setRulesItems(meta.rulesItems);
    } else if (meta.rulesText) {
      const parsed = meta.rulesText
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean)
        .map((rule, idx) => ({ no: idx + 1, rule }));
      setRulesItems(parsed.length > 0 ? parsed : cloneRulesTemplate(resolvedCat));
    } else {
      setRulesItems(cloneRulesTemplate(resolvedCat));
    }

    setIsModalOpen(true);
  };

  const openCropperForImages = (
    images: string[],
    target: "COVER" | "DOCS",
    defaultPreset: CropPresetKey = "4:3"
  ) => {
    setCropTarget(target);
    setCropPreset(defaultPreset);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
    setCropQueue(images);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    e.target.value = "";
    openCropperForImages([dataUrl], "COVER", "4:3");
  };

  const handleDocumentationUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const converted = await Promise.all(files.map(fileToDataUrl));
    e.target.value = "";
    openCropperForImages(converted, "DOCS", "4:3");
  };

  const activeCropImage = cropQueue[0] || null;

  const activeCropPresetObj = useMemo(
    () => CROP_PRESETS.find((p) => p.key === cropPreset) || CROP_PRESETS[0],
    [cropPreset]
  );

  const commitCropResult = (imgDataUrl: string) => {
    if (cropTarget === "COVER") {
      setCoverImage(imgDataUrl);
      return;
    }
    setDocumentationImages((prev) => {
      const nextIndex = prev.length + 1;
      setDocumentationCaptions((caps) => [
        ...caps,
        `Dokumentasi ${nextIndex}`,
      ]);
      return [...prev, imgDataUrl];
    });
  };

  const handleApplyCrop = async () => {
    if (!activeCropImage) return;
    setApplyingCrop(true);
    try {
      const croppedUrl = await renderCroppedDataUrl(
        activeCropImage,
        cropPreset,
        cropZoom,
        cropOffsetX,
        cropOffsetY
      );
      commitCropResult(croppedUrl);
      setCropQueue((prev) => prev.slice(1));
      setCropZoom(1);
      setCropOffsetX(0);
      setCropOffsetY(0);
    } finally {
      setApplyingCrop(false);
    }
  };

  const handleSkipCropCurrent = () => {
    if (!activeCropImage) return;
    commitCropResult(activeCropImage);
    setCropQueue((prev) => prev.slice(1));
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
  };

  const handleCancelCropQueue = () => {
    setCropQueue([]);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
  };

  const removeDocumentationImage = (idx: number) => {
    setDocumentationImages((prev) => prev.filter((_, i) => i !== idx));
    setDocumentationCaptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addPackageItemRow = () => {
    setPackageItems((prev) => [...prev, { name: "", quantity: "1", note: "" }]);
  };

  const updatePackageItemRow = (
    index: number,
    field: keyof RentalPackageItem,
    value: string
  ) => {
    setPackageItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removePackageItemRow = (index: number) => {
    setPackageItems((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const addTimeTripSlot = () => {
    const maxAllowedQuota = Math.max(1, Number(stock) || 10);
    setTimeTrips((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}-${prev.length}`,
        dateLabel: "",
        quota: maxAllowedQuota,
        sold: false,
      },
    ]);
  };

  const updateTimeTripSlot = (id: string, patch: Partial<TimeTripSlot>) => {
    const maxAllowedQuota = Math.max(0, Number(stock) || 0);
    setTimeTrips((prev) =>
      prev.map((slot) => {
        if (slot.id !== id) return slot;
        const clampedQuota =
          typeof patch.quota === "number"
            ? Math.max(0, Math.min(maxAllowedQuota, patch.quota))
            : slot.quota;
        const next: TimeTripSlot = {
          ...slot,
          ...patch,
          ...(typeof patch.quota === "number" ? { quota: clampedQuota } : {}),
        };
        if (
          (typeof patch.quota === "number" && clampedQuota <= 0) ||
          maxAllowedQuota <= 0
        ) {
          next.quota = 0;
          next.sold = true;
        } else if (typeof patch.quota === "number" && clampedQuota > 0) {
          next.sold = false;
        }
        return next;
      })
    );
  };

  const removeTimeTripSlot = (id: string) => {
    setTimeTrips((prev) =>
      prev.length > 1 ? prev.filter((s) => s.id !== id) : prev
    );
  };

  const addUnavailableDate = () => {
    const val = newUnavailableDate.trim();
    if (!val) return;
    if (!unavailableDates.includes(val)) {
      setUnavailableDates((prev) => [...prev, val].sort());
    }
    setNewUnavailableDate("");
  };

  const removeUnavailableDate = (dateStr: string) => {
    setUnavailableDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const releaseBookedDate = (dateStr: string) => {
    setBookedDates((prev) => prev.filter((d) => d !== dateStr));
  };

  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => prev.map((val, i) => (i === index ? value : val)));
  };

  const removeListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setter((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const addItineraryRow = () => {
    const lastDay =
      itineraryItems.length > 0
        ? itineraryItems[itineraryItems.length - 1].day
        : 1;
    setItineraryItems((prev) => [
      ...prev,
      { day: lastDay, startTime: "", endTime: "", activity: "" },
    ]);
  };

  const updateItineraryRow = (
    index: number,
    field: keyof ItineraryEntry,
    value: string | number
  ) => {
    setItineraryItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removeItineraryRow = (index: number) => {
    setItineraryItems((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const addEssentialRow = () => {
    setEssentialItems((prev) => [
      ...prev,
      { no: prev.length + 1, itemName: "", quantity: "1", note: "-" },
    ]);
  };

  const updateEssentialRow = (
    index: number,
    field: keyof EssentialEntry,
    value: string | number
  ) => {
    setEssentialItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removeEssentialRow = (index: number) => {
    setEssentialItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({ ...item, no: idx + 1 }));
    });
  };

  const addRuleRow = () => {
    setRulesItems((prev) => [
      ...prev,
      { no: prev.length + 1, rule: "" },
    ]);
  };

  const updateRuleRow = (
    index: number,
    field: keyof RuleEntry,
    value: string | number
  ) => {
    setRulesItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removeRuleRow = (index: number) => {
    setRulesItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({ ...item, no: idx + 1 }));
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coverImage) {
      showToast("Silakan upload gambar / foto produk terlebih dahulu!");
      return;
    }

    setSavingProduct(true);

    const parsedStock = Math.max(0, Number(stock) || 0);

    const cleanedTimeTrips = timeTrips
      .filter((t) => t.dateLabel.trim() !== "")
      .map((t) => {
        const clampedQuota = Math.max(
          0,
          Math.min(parsedStock, Number(t.quota) || 0)
        );
        return {
          ...t,
          dateLabel: t.dateLabel.trim(),
          quota: clampedQuota,
          sold: Boolean(t.sold) || clampedQuota <= 0,
        };
      });

    const cleanedPackageItems: RentalPackageItem[] =
      category === "RENTAL" && subCategory === "PAKET"
        ? packageItems
            .map((p) => ({
              name: p.name.trim(),
              quantity: p.quantity.trim() || "1",
              note: p.note?.trim() || "",
            }))
            .filter((p) => p.name !== "")
        : [];

    const cleanedServices = servicesItems.map((s) => s.trim()).filter(Boolean);
    const cleanedAdvantages = advantagesItems
      .map((a) => a.trim())
      .filter(Boolean);
    const cleanedMeetingPoints = meetingPoints
      .map((m) => m.trim())
      .filter(Boolean);
    const cleanedTrailPosts = trailPosts.map((p) => p.trim()).filter(Boolean);
    const cleanedIncludes = includeItems.map((inc) => inc.trim()).filter(Boolean);
    const cleanedItinerary = itineraryItems.filter(
      (item) => item.activity.trim() !== ""
    );
    const cleanedEssential = essentialItems
      .filter((item) => item.itemName.trim() !== "")
      .map((item, idx) => ({ ...item, no: Number(item.no) || idx + 1 }));
    const cleanedRules = rulesItems
      .filter((item) => item.rule.trim() !== "")
      .map((item, idx) => ({
        no: Number(item.no) || idx + 1,
        rule: item.rule.trim(),
      }));

    const autoPackageDesc =
      cleanedPackageItems.length > 0
        ? `Paket rental ${title.trim()} berisi: ${cleanedPackageItems
            .map((p) => `${p.quantity}x ${p.name}`)
            .join(", ")}.`
        : "";

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      title,
      category,
      subCategory,
      price: Number(price),
      stock: parsedStock,
      image: coverImage,
      description:
        description.trim() ||
        autoPackageDesc ||
        (category === "RENTAL"
          ? `Sewa ${title} per malam di Alam Memanggil.`
          : description),
      metaData: {
        isRecommended: category === "TRIP" ? Boolean(isRecommended) : false,
        location,
        elevation,
        grade,
        route,
        duration,
        quota,
        mapsUrl: category === "TRIP" ? mapsUrl : "",
        documentationImages,
        documentationCaptions,
        timeTrips: cleanedTimeTrips,
        unavailableDates,
        bookedDates,
        packageItems: cleanedPackageItems,
        servicesItems: cleanedServices,
        advantagesItems: cleanedAdvantages,
        meetingPoints: cleanedMeetingPoints,
        trailPosts: cleanedTrailPosts,
        includeItems: cleanedIncludes,
        includesText: cleanedIncludes.join("\n"),
        itineraryItems: cleanedItinerary,
        essentialItems: cleanedEssential,
        rulesItems: cleanedRules,
        rulesText: cleanedRules.map((r) => r.rule).join("\n"),
      },
    };

    try {
      const res = await fetch("/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Paket / alat rental tersimpan!");
        setIsModalOpen(false);
        resetFormForAdd(category);
        fetchProducts();
        window.dispatchEvent(new Event("catalog-updated"));
      } else {
        showToast(data.message || "Gagal menyimpan paket.");
      }
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || "Paket dihapus.");
      fetchProducts();
      window.dispatchEvent(new Event("catalog-updated"));
    } else {
      showToast(data.message || "Gagal menghapus paket.");
    }
  };

  const releaseScheduleForDeletedOrder = async (targetOrder: AdminOrder) => {
    const notesSchedule = extractScheduleFromNotes(targetOrder.notes);
    const wasConfirmedCompleted =
      targetOrder.status === "COMPLETED" || targetOrder.status === "PROCESSING";

    for (const item of targetOrder.items) {
      const prodId = item.productId || item.product?.id;
      const matchedProd = products.find(
        (p) =>
          (prodId && p.id === prodId) || p.title === item.product?.title
      );
      if (!matchedProd) continue;

      const meta = (matchedProd.metaData || {}) as ProductMeta;
      const scheduleStr = item.selectedSchedule || notesSchedule || "";
      const extractedDates = extractIsoDatesFromText(scheduleStr);
      const qtyToRestore = Math.max(1, Number(item.quantity || 1));

      let changed = false;
      let nextStock = Math.max(0, Number(matchedProd.stock) || 0);

      if (wasConfirmedCompleted) {
        nextStock += qtyToRestore;
        changed = true;
      }

      const nextMeta: ProductMeta = { ...meta };

      if (
        Array.isArray(meta.bookedDates) &&
        meta.bookedDates.length > 0 &&
        extractedDates.length > 0
      ) {
        const filteredBooked = meta.bookedDates.filter(
          (d) => !extractedDates.includes(d)
        );
        if (filteredBooked.length !== meta.bookedDates.length) {
          nextMeta.bookedDates = filteredBooked;
          changed = true;
        }
      }

      if (
        Array.isArray(meta.timeTrips) &&
        meta.timeTrips.length > 0 &&
        scheduleStr
      ) {
        nextMeta.timeTrips = meta.timeTrips.map((slot) => {
          if (
            slot.dateLabel.trim().toLowerCase() ===
            scheduleStr.trim().toLowerCase()
          ) {
            changed = true;
            const maxCap = Math.max(0, Number(nextStock) || 0);
            const rawRestored =
              Math.max(0, Number(slot.quota || 0)) + qtyToRestore;
            const restoredQuota =
              maxCap > 0 ? Math.min(maxCap, rawRestored) : rawRestored;
            return {
              ...slot,
              quota: restoredQuota,
              sold: restoredQuota <= 0,
            };
          }
          return slot;
        });
      }

      if (changed) {
        await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: matchedProd.id,
            title: matchedProd.title,
            category: matchedProd.category,
            subCategory: matchedProd.subCategory || "ALL",
            price: matchedProd.price,
            stock: nextStock,
            image: matchedProd.image,
            description: matchedProd.description,
            metaData: nextMeta,
          }),
        });
      }
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: "COMPLETED" | "CANCELLED",
    reasonNote?: string
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: nextStatus,
          ...(reasonNote ? { revisionNote: reasonNote } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (nextStatus === "COMPLETED") {
          showToast(
            "Pesanan dikonfirmasi: stok rental & kuota jadwal trip telah diperbarui!"
          );
        } else {
          showToast("Pesanan ditolak admin.");
        }
        await fetchOrders();
        await fetchProducts();
        window.dispatchEvent(new Event("catalog-updated"));
      } else {
        showToast(data.message || "Gagal mengubah status pesanan.");
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrderHistory = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    const targetOrder = orders.find((o) => o.id === orderId);
    try {
      const res = await fetch(`/api/admin/orders?orderId=${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (targetOrder) {
          await releaseScheduleForDeletedOrder(targetOrder);
        }
        showToast(
          "Riwayat pesanan dihapus, stok & jadwal terbooking dipulihkan."
        );
        await fetchOrders();
        await fetchProducts();
        window.dispatchEvent(new Event("catalog-updated"));
      } else {
        showToast(data.message || "Gagal menghapus riwayat pesanan.");
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          waAdminNumber,
          bankName,
          accountNumber,
          accountHolder,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Pengaturan toko tersimpan.");
      } else {
        showToast(data.message || "Gagal menyimpan pengaturan.");
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredProducts = products.filter(
    (p) => String(p.category || "").toUpperCase() === filterCategory
  );

  const waitingOrders = orders.filter(
    (o) => o.status === "WAITING_CONFIRMATION"
  );
  const completedOrders = orders.filter(
    (o) => o.status === "COMPLETED" || o.status === "PROCESSING"
  );
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  const displayedOrders = useMemo(() => {
    switch (orderTab) {
      case "WAITING_CONFIRMATION":
        return waitingOrders;
      case "COMPLETED":
        return completedOrders;
      case "CANCELLED":
        return cancelledOrders;
      default:
        return [];
    }
  }, [orderTab, waitingOrders, completedOrders, cancelledOrders]);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-neutral-900 overflow-x-hidden">
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-5 sm:right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-amber-400/40">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="line-clamp-2">{toast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Top Bar Toko ala Shopee di HP, utuh di Desktop */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-amber-900/10 p-3.5 sm:p-6 mb-3.5 sm:mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-100 text-[#6F4E37] mb-1 sm:mb-2">
              <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Seller Center
            </span>
            <h1 className="text-base sm:text-2xl font-black text-neutral-900 truncate">
              {storeName}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveMenu("catalog")}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black transition cursor-pointer shrink-0 ${
                activeMenu === "catalog"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Etalase</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("orders");
                loadCustomerReviews();
              }}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black transition cursor-pointer shrink-0 ${
                activeMenu === "orders"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Pesanan ({waitingOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("discounts");
                fetchDiscounts();
              }}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black transition cursor-pointer shrink-0 ${
                activeMenu === "discounts"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Diskon ({discounts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("notifications");
                loadStoredAdminNotifs();
              }}
              className={`relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black transition cursor-pointer shrink-0 ${
                activeMenu === "notifications"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Notif</span>
              {unreadAdminNotifCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500 text-black font-black leading-none">
                  {unreadAdminNotifCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("settings")}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black transition cursor-pointer shrink-0 ${
                activeMenu === "settings"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Pengaturan</span>
            </button>
          </div>
        </div>

        {/* Stat Ringkas ala Shopee di HP (3 kolom sejajar), utuh di Desktop */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3.5 sm:mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveMenu("orders");
              setOrderTab("WAITING_CONFIRMATION");
            }}
            className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 p-2.5 sm:p-4 shadow-2xs sm:shadow-sm text-left cursor-pointer"
          >
            <p className="text-[10px] sm:text-[11px] font-bold text-amber-700 truncate">
              Perlu Cek
            </p>
            <p className="text-lg sm:text-2xl font-black text-amber-600 mt-0.5 sm:mt-1">
              {waitingOrders.length}
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMenu("orders");
              setOrderTab("COMPLETED");
            }}
            className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 p-2.5 sm:p-4 shadow-2xs sm:shadow-sm text-left cursor-pointer"
          >
            <p className="text-[10px] sm:text-[11px] font-bold text-emerald-700 truncate">
              Selesai
            </p>
            <p className="text-lg sm:text-2xl font-black text-emerald-600 mt-0.5 sm:mt-1">
              {completedOrders.length}
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMenu("orders");
              setOrderTab("CANCELLED");
            }}
            className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 p-2.5 sm:p-4 shadow-2xs sm:shadow-sm text-left cursor-pointer"
          >
            <p className="text-[10px] sm:text-[11px] font-bold text-rose-700 truncate">
              Ditolak/Batal
            </p>
            <p className="text-lg sm:text-2xl font-black text-rose-600 mt-0.5 sm:mt-1">
              {cancelledOrders.length}
            </p>
          </button>
        </div>

        {activeMenu === "catalog" && (
          <div className="space-y-3 sm:space-y-5">
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-2.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 shadow-2xs sm:shadow-sm">
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
                {(["TRIP", "OUTBOUND", "RENTAL"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-black transition cursor-pointer truncate ${
                      filterCategory === cat
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {cat === "TRIP"
                      ? "Open Trip"
                      : cat === "OUTBOUND"
                      ? "Outbound"
                      : "Rental"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-1.5 bg-[#6F4E37] hover:bg-[#5a3e2b] text-white text-xs font-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-10 sm:p-12 text-center">
                <p className="text-xs sm:text-sm font-bold text-neutral-700">
                  Belum ada produk pada filter ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
                {filteredProducts.map((prod) => {
                  const pCat = String(prod.category || "").toUpperCase();
                  const isRentalPackage =
                    pCat === "RENTAL" &&
                    String(prod.subCategory || "").toUpperCase() === "PAKET";
                  const unitPriceSuffix =
                    pCat === "RENTAL"
                      ? isRentalPackage
                        ? "/ mlm"
                        : "/ mlm"
                      : pCat === "OUTBOUND"
                      ? "/ hari"
                      : "/ pax";
                  const meta = (prod.metaData || {}) as ProductMeta;
                  const pkgList = Array.isArray(meta.packageItems)
                    ? meta.packageItems
                    : [];

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200/80 sm:border-neutral-200/95 overflow-hidden shadow-2xs sm:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.16)] sm:hover:shadow-[0_18px_40px_-10px_rgba(15,23,42,0.22)] sm:transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-28 sm:h-44 bg-neutral-100">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] sm:text-xs text-neutral-400">
                              Tanpa Gambar
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-wrap gap-1 sm:gap-1.5">
                            <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-black/75 text-white">
                              {pCat}
                            </span>
                            {pCat === "TRIP" && meta.isRecommended && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-500 text-white">
                                <Star className="w-2.5 h-2.5 fill-white" />
                                <span className="hidden sm:inline">
                                  Rekomendasi
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-2">
                          <h3 className="text-xs sm:text-sm font-black text-neutral-900 line-clamp-1">
                            {prod.title}
                          </h3>
                          <p className="text-xs sm:text-sm font-extrabold text-[#6F4E37]">
                            {formatRupiah(prod.price)}{" "}
                            <span className="text-[10px] sm:text-[11px] font-normal text-neutral-500">
                              {unitPriceSuffix}
                            </span>
                          </p>

                          {pCat === "TRIP" ? (
                            <>
                              <p className="hidden sm:block text-[11px] text-neutral-500 sm:line-clamp-1">
                                {prod.description}
                              </p>
                              <div className="hidden sm:grid sm:grid-cols-2 gap-x-2 gap-y-1 pt-1.5 border-t border-neutral-100 text-[11px] text-neutral-700">
                                <div className="truncate">
                                  <span className="text-neutral-400 font-semibold">
                                    Daerah:{" "}
                                  </span>
                                  <span className="font-bold">
                                    {meta.location || "-"}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <span className="text-neutral-400 font-semibold">
                                    MDPL:{" "}
                                  </span>
                                  <span className="font-bold">
                                    {meta.elevation || "-"}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <span className="text-neutral-400 font-semibold">
                                    Grade:{" "}
                                  </span>
                                  <span className="font-bold">
                                    {meta.grade || "-"}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <span className="text-neutral-400 font-semibold">
                                    Jalur:{" "}
                                  </span>
                                  <span className="font-bold">
                                    {meta.route || "-"}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <span className="text-neutral-400 font-semibold">
                                    Durasi:{" "}
                                  </span>
                                  <span className="font-bold">
                                    {meta.duration || "-"}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <span className="text-neutral-400 font-semibold">
                                    Kuota:{" "}
                                  </span>
                                  <span className="font-bold">
                                    {meta.quota || `Stok ${prod.stock}`}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="hidden sm:block text-[11px] text-neutral-500 line-clamp-2">
                                {prod.description}
                              </p>

                              {isRentalPackage && pkgList.length > 0 && (
                                <div className="hidden sm:flex pt-1.5 flex-wrap gap-1">
                                  {pkgList.map((pk, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-[#6F4E37]"
                                    >
                                      {pk.quantity}x {pk.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          <div className="pt-0.5 sm:pt-1 flex flex-wrap gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-bold text-neutral-600">
                            <span className="bg-neutral-100 px-1.5 sm:px-2 py-0.5 rounded">
                              Stok: {prod.stock}
                            </span>
                            {pCat === "RENTAL" ? (
                              <>
                                <span className="hidden sm:inline bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                                  {(meta.unavailableDates || []).length} Tgl Tutup
                                </span>
                                <span className="hidden sm:inline bg-amber-50 text-[#6F4E37] px-2 py-0.5 rounded">
                                  {(meta.bookedDates || []).length} Tgl Terbooking
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="hidden sm:inline bg-neutral-100 px-2 py-0.5 rounded">
                                  {(meta.timeTrips || []).length} Jadwal
                                </span>
                                <span className="hidden sm:inline bg-neutral-100 px-2 py-0.5 rounded">
                                  {(meta.itineraryItems || []).length} Itinerary
                                </span>
                                <span className="hidden sm:inline bg-neutral-100 px-2 py-0.5 rounded">
                                  {(meta.rulesItems || []).length} Rules
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-2.5 py-2 sm:px-4 sm:py-3 border-t border-neutral-100 flex items-center justify-end gap-1.5 sm:gap-2 bg-neutral-50/70">
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-100 hover:bg-amber-200 text-[#6F4E37] cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeMenu === "orders" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden">
            {/* Sub-tab Pesanan ala Shopee di HP */}
            <div className="grid grid-cols-4 border-b border-neutral-200 bg-neutral-50/70">
              {[
                {
                  key: "WAITING_CONFIRMATION" as const,
                  label: "Cek TF",
                  fullLabel: "Konfirmasi",
                  count: waitingOrders.length,
                },
                {
                  key: "COMPLETED" as const,
                  label: "Selesai",
                  fullLabel: "Selesai",
                  count: completedOrders.length,
                },
                {
                  key: "CANCELLED" as const,
                  label: "Batal",
                  fullLabel: "Ditolak / Batal",
                  count: cancelledOrders.length,
                },
                {
                  key: "REVIEWS" as const,
                  label: "Ulasan",
                  fullLabel: "Ulasan",
                  count: customerReviews.length,
                },
              ].map((t) => {
                const isSelected = orderTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setOrderTab(t.key)}
                    className={`relative py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-[11px] sm:text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? "text-[#6F4E37] bg-white"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70"
                    }`}
                  >
                    <span className="sm:hidden truncate">{t.label}</span>
                    <span className="hidden sm:inline truncate">
                      {t.fullLabel}
                    </span>
                    {t.count > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black leading-none ${
                          isSelected
                            ? "bg-[#6F4E37] text-white"
                            : "bg-neutral-200 text-neutral-800"
                        }`}
                      >
                        {t.count}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6F4E37]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-2.5 sm:p-6 space-y-2.5 sm:space-y-4 bg-neutral-100/60 sm:bg-white">
              {orderTab === "REVIEWS" ? (
                customerReviews.length === 0 ? (
                  <div className="p-10 text-center space-y-2 bg-white rounded-2xl sm:rounded-none">
                    <Star className="w-10 h-10 text-neutral-300 mx-auto" />
                    <p className="text-sm font-black text-neutral-800">
                      Belum ada ulasan dari customer
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {customerReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white sm:bg-neutral-50/70 p-3.5 sm:p-4 space-y-2 sm:space-y-2.5 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-[#6F4E37]">
                              Pesanan {rev.orderCode}
                            </span>
                            <div className="flex items-center gap-1 mt-1.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                    s <= rev.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-neutral-300"
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-[11px] sm:text-xs font-black text-neutral-800">
                                ({rev.rating}/5)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-500">
                              {new Date(rev.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomerReview(rev.id)}
                              title="Hapus ulasan"
                              className="p-1.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {rev.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {rev.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 sm:bg-white border border-amber-200 text-[#6F4E37]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-neutral-800 font-medium leading-relaxed bg-neutral-50 sm:bg-white p-2.5 sm:p-3 rounded-xl border border-neutral-200/80">
                          “{rev.comment}”
                        </p>
                      </div>
                    ))}
                  </div>
                )
              ) : loadingOrders ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
                </div>
              ) : displayedOrders.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl sm:rounded-none">
                  <p className="text-xs sm:text-sm font-bold text-neutral-700">
                    Tidak ada pesanan pada tab ini.
                  </p>
                </div>
              ) : (
                displayedOrders.map((order) => {
                  const isWaiting = order.status === "WAITING_CONFIRMATION";
                  const isCompleted =
                    order.status === "COMPLETED" ||
                    order.status === "PROCESSING";
                  const isCancelled = order.status === "CANCELLED";
                  const cancelledByCust = isCancelledByCustomer(order);
                  const overdue = isOrderRentalOverdue(order);
                  const returnDate = extractReturnDateFromOrder(order);
                  const customerWaUrl = buildCustomerWaContactUrl(
                    order,
                    formatRupiah
                  );
                  const noteLines = splitAdminNoteLines(order.notes);

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 shadow-2xs space-y-2.5 sm:space-y-4 ${
                        overdue
                          ? "bg-rose-50/70 border-rose-300"
                          : "bg-white border-neutral-200/90"
                      }`}
                    >
                      {/* Top Header ala Shopee di HP: Order ID + Customer di kiri, Badge Status di kanan */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 border-b border-neutral-100 pb-2.5 sm:pb-3.5">
                        <div className="space-y-0.5 sm:space-y-1 min-w-0">
                          <div className="flex items-center justify-between md:justify-start gap-2">
                            <span className="text-xs font-black text-neutral-900">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isWaiting && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  <Clock className="w-3 h-3" /> Menunggu TF
                                </span>
                              )}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Selesai
                                </span>
                              )}
                              {isCancelled && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    cancelledByCust
                                      ? "bg-neutral-200 text-neutral-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  <Ban className="w-3 h-3" />{" "}
                                  {cancelledByCust
                                    ? "Batal Customer"
                                    : "Ditolak"}
                                </span>
                              )}
                              {overdue && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                                  <AlertTriangle className="w-3 h-3" /> Telat
                                  ({returnDate})
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] sm:text-xs text-neutral-700 truncate">
                            <strong className="text-neutral-900">
                              {order.user.name || order.user.email}
                            </strong>{" "}
                            <span className="text-neutral-500">
                              • {order.user.phone || "No HP kosong"}
                            </span>
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-neutral-500 truncate">
                            TF:{" "}
                            <strong className="text-neutral-700">
                              {order.senderName || "-"}
                            </strong>{" "}
                            ({order.bankName || "-"})
                          </p>
                        </div>

                        {/* Deretan Aksi: ringkas & padat di HP, penuh di Desktop */}
                        <div className="flex items-center justify-end flex-wrap gap-1.5 sm:gap-2 pt-1 md:pt-0">
                          {order.paymentProof && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewProof(order.paymentProof!)
                              }
                              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 cursor-pointer"
                            >
                              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span>Bukti TF</span>
                            </button>
                          )}

                          {overdue && (
                            <button
                              type="button"
                              disabled={remindingOrderId === order.id}
                              onClick={() => handleSendReturnReminder(order)}
                              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer disabled:opacity-60"
                            >
                              {remindingOrderId === order.id ? (
                                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              )}
                              <span className="sm:hidden">Ingatkan</span>
                              <span className="hidden sm:inline">
                                Pemberitahuan Pengembalian
                              </span>
                            </button>
                          )}

                          {customerWaUrl && (
                            <a
                              href={customerWaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black shadow-2xs transition ${
                                overdue
                                  ? "bg-amber-400 hover:bg-amber-500 text-black"
                                  : "bg-emerald-500 hover:bg-emerald-600 text-black"
                              }`}
                            >
                              <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" />
                              <span className="sm:hidden">WA</span>
                              <span className="hidden sm:inline">
                                {overdue
                                  ? "Hubungi WA (Terlambat)"
                                  : "Hubungi Pelanggan (WA)"}
                              </span>
                            </a>
                          )}

                          {isWaiting && (
                            <>
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, "COMPLETED")
                                }
                                className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="sm:hidden">ACC</span>
                                <span className="hidden sm:inline">
                                  Konfirmasi & Selesai
                                </span>
                              </button>

                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    order.id,
                                    "CANCELLED",
                                    "Ditolak admin: bukti transfer belum sesuai."
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
                              >
                                <Ban className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </>
                          )}

                          {isCancelled && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() =>
                                handleDeleteOrderHistory(order.id)
                              }
                              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black bg-neutral-900 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="sm:hidden">Hapus</span>
                              <span className="hidden sm:inline">
                                Hapus Riwayat & Buka Tanggal
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Item Ringkas ala Shopee di HP */}
                      <div className="space-y-1.5 sm:space-y-2.5 text-xs">
                        {order.items.map((it) => {
                          const unitLabel = getAdminUnitLabel(
                            it.product.category
                          );
                          const itemSched = getScheduleForAdminItem(it, order);
                          const itemSubtotal = getAdminItemSubtotal(
                            it,
                            itemSched
                          );
                          return (
                            <div
                              key={it.id}
                              className="flex items-start justify-between gap-2 bg-neutral-50/90 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-neutral-200/80"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-neutral-900 line-clamp-1 sm:line-clamp-none leading-snug">
                                  {it.product.title}{" "}
                                  <span className="text-[11px] text-neutral-600 font-semibold">
                                    x{it.quantity} {unitLabel}
                                  </span>
                                </p>
                                {itemSched && (
                                  <div className="mt-0.5 sm:mt-1.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#6F4E37] leading-snug">
                                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                    <span className="truncate sm:whitespace-normal sm:break-words">
                                      {itemSched}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-bold text-neutral-900 shrink-0">
                                {formatRupiah(itemSubtotal)}
                              </span>
                            </div>
                          );
                        })}

                        <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t border-neutral-100 font-black text-xs sm:text-sm">
                          <span className="text-neutral-600 sm:text-neutral-900">
                            Total Bayar
                          </span>
                          <span className="text-sm sm:text-base text-[#6F4E37]">
                            {formatRupiah(order.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {noteLines.length > 0 && (
                        <div className="bg-amber-50/80 border border-amber-200 rounded-lg sm:rounded-xl px-2.5 py-2 sm:p-3.5 text-[10px] sm:text-xs text-neutral-800 space-y-0.5 sm:space-y-1.5">
                          {noteLines.map((line, idx) => (
                            <p
                              key={idx}
                              className="leading-snug sm:leading-relaxed break-words line-clamp-2 sm:line-clamp-none"
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeMenu === "discounts" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <form
              onSubmit={handleCreateDiscount}
              className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4 h-fit"
            >
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-2.5 sm:pb-3">
                <Tag className="w-4 h-4 text-[#6F4E37]" />
                <h2 className="text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                  Buat Kode Diskon Baru
                </h2>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold mb-1">
                  Kode Promo / Voucher *
                </label>
                <input
                  type="text"
                  required
                  value={newDiscountCode}
                  onChange={(e) =>
                    setNewDiscountCode(e.target.value.toUpperCase())
                  }
                  placeholder="Contoh: ALAM10 / RENTAL20K"
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs font-black uppercase text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold mb-1">
                    Jenis Potongan *
                  </label>
                  <select
                    value={newDiscountType}
                    onChange={(e) =>
                      setNewDiscountType(
                        e.target.value as "PERCENTAGE" | "FIXED"
                      )
                    }
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 bg-white"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Nominal (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold mb-1">
                    {newDiscountType === "PERCENTAGE"
                      ? "Diskon (%) *"
                      : "Potongan (Rp) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={newDiscountType === "PERCENTAGE" ? 100 : undefined}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    placeholder={
                      newDiscountType === "PERCENTAGE" ? "10" : "25000"
                    }
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold mb-1">
                    Min. Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newMinPurchase}
                    onChange={(e) => setNewMinPurchase(e.target.value)}
                    placeholder="0"
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold mb-1">
                    Kadaluarsa
                  </label>
                  <input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingDiscount}
                className="w-full bg-[#6F4E37] hover:bg-[#5a3e2b] text-white font-black py-2.5 sm:py-3 rounded-full text-xs shadow cursor-pointer disabled:opacity-60"
              >
                {creatingDiscount ? "Menyimpan..." : "Simpan Kode Diskon"}
              </button>
            </form>

            <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 sm:pb-3">
                <h2 className="text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                  Daftar Kode Diskon ({discounts.length})
                </h2>
              </div>

              {loadingDiscounts ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-7 h-7 animate-spin text-[#6F4E37]" />
                </div>
              ) : discounts.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Tag className="w-10 h-10 text-neutral-300 mx-auto" />
                  <p className="text-xs font-black text-neutral-800">
                    Belum ada kode diskon
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {discounts.map((disc) => (
                    <div
                      key={disc.id}
                      className="flex items-center justify-between gap-2.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-neutral-200 bg-neutral-50/70"
                    >
                      <div className="space-y-0.5 sm:space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[#6F4E37] text-[11px] sm:text-xs font-black tracking-wide">
                            {disc.code}
                          </span>
                          <span className="text-xs font-black text-neutral-900">
                            {disc.discountType === "PERCENTAGE"
                              ? `Diskon ${disc.discountValue}%`
                              : `Diskon ${formatRupiah(disc.discountValue)}`}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-600 truncate">
                          Min:{" "}
                          {disc.minPurchase > 0
                            ? formatRupiah(disc.minPurchase)
                            : "Bebas"}{" "}
                          • Exp:{" "}
                          {disc.expiresAt
                            ? new Date(disc.expiresAt).toLocaleDateString(
                                "id-ID"
                              )
                            : "Selamanya"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={deletingDiscountId === disc.id}
                        onClick={() => handleDeleteDiscount(disc.id)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-black bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeMenu === "notifications" && (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-3.5 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2.5 sm:pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#6F4E37]" />
                <h2 className="text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
                  Notifikasi ({adminNotifications.length})
                </h2>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {unreadAdminNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAdminNotifsRead}
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Baca semua</span>
                  </button>
                )}

                {adminNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllAdminNotifs}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-black bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>
            </div>

            {adminNotifications.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Bell className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-xs font-black text-neutral-800">
                  Belum ada notifikasi masuk
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {adminNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAdminNotifRead(notif.id)}
                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-xs cursor-pointer transition ${
                      notif.isRead
                        ? "bg-white border-neutral-200 text-neutral-800"
                        : "bg-amber-50/90 border-amber-300 text-neutral-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase ${
                            notif.type === "NEW_REVIEW"
                              ? "bg-amber-200 text-[#6F4E37]"
                              : notif.type === "CANCELLED_BY_CUSTOMER"
                              ? "bg-rose-100 text-rose-800"
                              : notif.type === "REUPLOAD_PROOF"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {notif.type === "NEW_REVIEW"
                            ? "Ulasan"
                            : notif.type === "CANCELLED_BY_CUSTOMER"
                            ? "Batal"
                            : notif.type === "REUPLOAD_PROOF"
                            ? "Reupload TF"
                            : "Order"}
                        </span>
                        <p className="text-xs font-black text-neutral-950 truncate">
                          {notif.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span className="text-[10px] sm:text-[11px] font-medium text-neutral-500">
                          {new Date(notif.createdAt).toLocaleDateString("id-ID")}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAdminNotif(notif.id);
                          }}
                          title="Hapus notifikasi"
                          className="p-1 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] sm:text-xs font-medium leading-snug sm:leading-relaxed text-neutral-700">
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeMenu === "settings" && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 p-4 sm:p-6 shadow-sm max-w-2xl space-y-3 sm:space-y-4"
          >
            <h2 className="text-xs sm:text-sm font-black text-neutral-900 uppercase tracking-wider">
              Pengaturan Rekening & Kontak Toko
            </h2>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold mb-1">
                Nama Toko
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold mb-1">
                Nomor WhatsApp Admin (Format 628xxx)
              </label>
              <input
                type="text"
                required
                value={waAdminNumber}
                onChange={(e) => setWaAdminNumber(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold mb-1">
                  Nama Bank Tujuan
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold mb-1">
                Nama Pemilik Rekening
              </label>
              <input
                type="text"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="bg-[#6F4E37] hover:bg-[#5a3e2b] text-white text-xs font-black px-6 py-2.5 sm:py-3 rounded-full shadow cursor-pointer"
            >
              {savingSettings ? "Menyimpan..." : "Simpan Pengaturan Toko"}
            </button>
          </form>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-neutral-200 space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="text-sm sm:text-base font-black text-neutral-900">
                {editingId ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  {category === "RENTAL"
                    ? subCategory === "PAKET"
                      ? "Nama Paket Rental *"
                      : "Nama Alat Rental *"
                    : "Nama Paket / Gunung *"}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === "RENTAL"
                      ? subCategory === "PAKET"
                        ? "Contoh: Paket Gokil (SB + Matras + Carrier)"
                        : "Contoh: Carrier Osprey Atmos 65L"
                      : "Contoh: Open Trip Gunung Prau 2H1M"
                  }
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Kategori Utama *
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    handleCategoryChangeInModal(
                      e.target.value as ProductMainCategory
                    )
                  }
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs bg-white font-bold"
                >
                  <option value="TRIP">TRIP (Open Trip)</option>
                  <option value="OUTBOUND">OUTBOUND</option>
                  <option value="RENTAL">RENTAL (Perlengkapan Outdoor)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  {category === "RENTAL"
                    ? "Kategori / Jenis Rental *"
                    : "Sub Kategori *"}
                </label>
                <select
                  value={subCategory}
                  onChange={(e) => {
                    const nextSub = e.target.value;
                    setSubCategory(nextSub);
                    if (category === "RENTAL" && nextSub === "PAKET") {
                      setPackageItems((prev) =>
                        prev.length > 0
                          ? prev
                          : cloneRentalPackageItemsTemplate()
                      );
                    }
                  }}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs bg-white"
                >
                  {(category === "TRIP"
                    ? TRIP_SUBCATEGORIES
                    : category === "OUTBOUND"
                    ? OUTBOUND_SUBCATEGORIES
                    : RENTAL_SUBCATEGORIES
                  ).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub === "PAKET"
                        ? "PAKET (Paket Rental Set)"
                        : sub.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  {category === "RENTAL"
                    ? subCategory === "PAKET"
                      ? "Harga Paket / Malam (Rp) *"
                      : "Harga Sewa / Malam (Rp) *"
                    : category === "OUTBOUND"
                    ? "Harga / Hari (Rp) *"
                    : "Harga / Pax (Rp) *"}
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={
                    category === "RENTAL"
                      ? subCategory === "PAKET"
                        ? "85000"
                        : "35000"
                      : "450000"
                  }
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  {category === "RENTAL"
                    ? subCategory === "PAKET"
                      ? "Stok Paket Tersedia *"
                      : "Stok Unit Tersedia *"
                    : "Kuota Maksimal / Stok *"}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={stock}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setStock(nextVal);
                    const cap = Math.max(0, Number(nextVal) || 0);
                    setTimeTrips((prev) =>
                      prev.map((slot) => ({
                        ...slot,
                        quota: Math.min(
                          cap,
                          Math.max(0, Number(slot.quota) || 0)
                        ),
                      }))
                    );
                  }}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
                />
              </div>
            </div>

            {category === "TRIP" && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-[#6F4E37]">
                    Rekomendasi Open Trip
                  </p>
                  <p className="text-[11px] text-neutral-600">
                    Paket Open Trip untuk{" "}
                    <strong>Rekomendasi Trip</strong> pada halaman utama.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isRecommended}
                    onChange={(e) => setIsRecommended(e.target.checked)}
                    className="w-4 h-4 accent-[#6F4E37] rounded cursor-pointer"
                  />
                  <span className="text-xs font-black text-neutral-900">
                    {isRecommended ? "Aktif" : "Nonaktif"}
                  </span>
                </label>
              </div>
            )}

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-black text-neutral-800">
                  {category === "RENTAL"
                    ? "Foto Utama Alat / Paket Rental * (Crop otomatis saat upload)"
                    : "Cover Gambar Utama * (Crop sesuai layout kartu)"}
                </label>
                {coverImage && (
                  <button
                    type="button"
                    onClick={() =>
                      openCropperForImages([coverImage], "COVER", "4:3")
                    }
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 hover:bg-amber-200 text-[#6F4E37] cursor-pointer"
                  >
                    <Crop className="w-3 h-3" /> Crop Ulang Cover
                  </button>
                )}
              </div>

              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 hover:border-[#6F4E37] rounded-2xl p-4 cursor-pointer bg-white">
                <Upload className="w-4 h-4 text-[#6F4E37]" />
                <span className="text-xs font-bold text-neutral-700">
                  {coverImage
                    ? "Ganti Foto Cover (Otomatis Cropper)"
                    : "Pilih File Gambar Cover"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>

              {coverImage && (
                <img
                  src={coverImage}
                  alt="Preview Cover"
                  className="max-h-40 rounded-xl border border-neutral-200 object-contain bg-white p-1.5"
                />
              )}
            </div>

            {category === "RENTAL" && (
              <>
                {subCategory === "PAKET" && (
                  <div className="bg-amber-50/70 border border-amber-300/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black text-[#6F4E37] uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Isi Paket Rental
                          (Item di Dalam Paket)
                        </h4>
                        <p className="text-[11px] text-neutral-600 mt-0.5">
                          Contoh: Sleeping Bag, Matras, Tas Carrier, Headlamp,
                          dll. beserta jumlah itemnya.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addPackageItemRow}
                        className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer shrink-0"
                      >
                        + Tambah Item Paket
                      </button>
                    </div>

                    <div className="space-y-2">
                      {packageItems.map((pkg, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                        >
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) =>
                              updatePackageItemRow(idx, "name", e.target.value)
                            }
                            placeholder="Nama Item (Mis: Sleeping Bag)"
                            className="sm:col-span-5 border border-amber-300 rounded-xl px-3 py-2 text-xs bg-white font-semibold"
                          />
                          <input
                            type="text"
                            value={pkg.quantity}
                            onChange={(e) =>
                              updatePackageItemRow(
                                idx,
                                "quantity",
                                e.target.value
                              )
                            }
                            placeholder="Qty (Mis: 1)"
                            className="sm:col-span-2 border border-amber-300 rounded-xl px-2.5 py-2 text-xs bg-white font-bold text-center"
                          />
                          <input
                            type="text"
                            value={pkg.note || ""}
                            onChange={(e) =>
                              updatePackageItemRow(idx, "note", e.target.value)
                            }
                            placeholder="Keterangan (Mis: 60L)"
                            className="sm:col-span-4 border border-amber-300 rounded-xl px-3 py-2 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removePackageItemRow(idx)}
                            className="sm:col-span-1 p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {subCategory === "PAKET"
                      ? "Deskripsi Singkat Paket Rental"
                      : "Deskripsi Singkat Alat Rental"}
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      subCategory === "PAKET"
                        ? "Contoh: Paket hemat pendakian berisi SB, matras, dan carrier siap pakai."
                        : "Contoh: Kapasitas 65L, frame ringan, lengkap dengan raincover."
                    }
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Tanggal Tidak
                      Tersedia (Tutup / Libur / Maintenance)
                    </h4>
                    <p className="text-[11px] text-rose-800/80 mt-0.5">
                      Tanggal yang ditutup akan tampil merah pada kalender sewa
                      pelanggan.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={newUnavailableDate}
                      onChange={(e) => setNewUnavailableDate(e.target.value)}
                      className="border border-rose-300 rounded-xl px-3 py-2 text-xs font-bold bg-white"
                    />
                    <button
                      type="button"
                      onClick={addUnavailableDate}
                      className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-full cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tutup Tanggal
                    </button>
                  </div>

                  {unavailableDates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {unavailableDates.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 text-[11px] font-bold"
                        >
                          {d}
                          <button
                            type="button"
                            onClick={() => removeUnavailableDate(d)}
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {bookedDates.length > 0 && (
                    <div className="pt-2 border-t border-rose-200/80 space-y-1.5">
                      <p className="text-[11px] font-black text-[#6F4E37]">
                        Tanggal Terbooking Pelanggan (Otomatis terkunci saat
                        checkout):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bookedDates.map((d) => (
                          <span
                            key={d}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-[#6F4E37] text-[11px] font-bold"
                          >
                            {d}
                            <button
                              type="button"
                              onClick={() => releaseBookedDate(d)}
                              title="Lepas booking tanggal ini"
                              className="hover:text-rose-700 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                      Peraturan Rental Alat
                    </h4>
                    <button
                      type="button"
                      onClick={addRuleRow}
                      className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                    >
                      + Tambah Baris Rules
                    </button>
                  </div>

                  <div className="space-y-2">
                    {rulesItems.map((row, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <input
                          type="number"
                          min={1}
                          value={row.no}
                          onChange={(e) =>
                            updateRuleRow(idx, "no", Number(e.target.value))
                          }
                          className="w-12 border border-neutral-300 rounded-xl px-2 py-2 text-xs text-center font-bold bg-white"
                        />
                        <textarea
                          rows={2}
                          value={row.rule}
                          onChange={(e) =>
                            updateRuleRow(idx, "rule", e.target.value)
                          }
                          placeholder="Tulis ketentuan rental..."
                          className="flex-1 border border-neutral-300 rounded-xl px-3 py-2 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeRuleRow(idx)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {category !== "RENTAL" && (
              <>
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-black text-neutral-800">
                      Foto Dokumentasi
                    </label>
                    <span className="text-[11px] font-bold text-[#6F4E37]">
                      Rekomendasi Rasio: 4:3 atau 16:9
                    </span>
                  </div>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 hover:border-[#6F4E37] rounded-2xl p-3.5 cursor-pointer bg-white">
                    <Upload className="w-4 h-4 text-[#6F4E37]" />
                    <span className="text-xs font-bold text-neutral-700">
                      Upload Foto Dokumentasi
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleDocumentationUpload}
                      className="hidden"
                    />
                  </label>

                  {documentationImages.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {documentationImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="border border-neutral-200 rounded-xl p-2 bg-white space-y-1.5 relative"
                        >
                          <img
                            src={imgUrl}
                            alt={`Dokumentasi ${idx + 1}`}
                            className="w-full h-28 object-cover rounded-lg"
                          />
                          <input
                            type="text"
                            value={documentationCaptions[idx] || ""}
                            onChange={(e) =>
                              setDocumentationCaptions((prev) =>
                                prev.map((c, i) =>
                                  i === idx ? e.target.value : c
                                )
                              )
                            }
                            placeholder={`Keterangan Foto ${idx + 1}`}
                            className="w-full border border-neutral-300 rounded-lg px-2 py-1 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => removeDocumentationImage(idx)}
                            className="absolute top-3 right-3 bg-rose-600 text-white rounded-full p-1 shadow cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {category === "TRIP" && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-black text-[#6F4E37]">
                      <MapPin className="w-4 h-4" /> Link Google Maps
                    </label>
                    <input
                      type="url"
                      value={mapsUrl}
                      onChange={(e) => setMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/?q=Basecamp+Gunung+Prau"
                      className="w-full border border-amber-300 rounded-xl px-3.5 py-2 text-xs bg-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lokasi (Mis: Wonosobo, Jateng)"
                    className="border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    placeholder="Ketinggian (Mis: 2.590 MDPL)"
                    className="border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Tingkat Kesulitan (1-5)"
                    className="border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder="Jalur (Mis: Via Patak Banteng)"
                    className="border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Durasi (Mis: 2 Hari 1 Malam)"
                    className="border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    placeholder="Info Kuota (Mis: Min. 12 Pax)"
                    className="border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                      Jadwal Keberangkatan & Kuota
                    </h4>
                    <button
                      type="button"
                      onClick={addTimeTripSlot}
                      className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                    >
                      + Tambah Jadwal
                    </button>
                  </div>

                  <div className="space-y-2">
                    {timeTrips.map((slot) => (
                      <div
                        key={slot.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={slot.dateLabel}
                          onChange={(e) =>
                            updateTimeTripSlot(slot.id, {
                              dateLabel: e.target.value,
                            })
                          }
                          placeholder="Tanggal (Mis: 15 - 17 Agustus 2026)"
                          className="sm:col-span-6 border border-neutral-300 rounded-xl px-3 py-2 text-xs bg-white"
                        />
                        <input
                          type="number"
                          min={0}
                          max={Math.max(0, Number(stock) || 0)}
                          value={slot.quota}
                          onChange={(e) =>
                            updateTimeTripSlot(slot.id, {
                              quota: Number(e.target.value),
                            })
                          }
                          placeholder="Sisa Kuota"
                          className="sm:col-span-3 border border-neutral-300 rounded-xl px-3 py-2 text-xs bg-white"
                        />
                        <label className="sm:col-span-2 inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(slot.sold) || slot.quota <= 0}
                            onChange={(e) =>
                              updateTimeTripSlot(slot.id, {
                                sold: e.target.checked,
                              })
                            }
                          />
                          <span>Full / Sold</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeTimeTripSlot(slot.id)}
                          className="sm:col-span-1 p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    Deskripsi Paket *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan daya tarik gunung, rute, atau keseruan paket outbound..."
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                {category === "OUTBOUND" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-neutral-800 uppercase">
                          Layanan Outbound
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            setServicesItems((prev) => [...prev, ""])
                          }
                          className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                      {servicesItems.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              updateListItem(
                                setServicesItems,
                                idx,
                                e.target.value
                              )
                            }
                            placeholder="Contoh: Instruktur Bersertifikat"
                            className="flex-1 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(setServicesItems, idx)
                            }
                            className="p-1.5 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-neutral-800 uppercase">
                          Keunggulan Paket
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            setAdvantagesItems((prev) => [...prev, ""])
                          }
                          className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                        >
                          + Tambah
                        </button>
                      </div>
                      {advantagesItems.map((val, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              updateListItem(
                                setAdvantagesItems,
                                idx,
                                e.target.value
                              )
                            }
                            placeholder="Contoh: Peralatan Standar UIAA"
                            className="flex-1 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeListItem(setAdvantagesItems, idx)
                            }
                            className="p-1.5 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-neutral-800 uppercase">
                        Meeting Point
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          setMeetingPoints((prev) => [...prev, ""])
                        }
                        className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                      >
                        + Tambah
                      </button>
                    </div>
                    {meetingPoints.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            updateListItem(
                              setMeetingPoints,
                              idx,
                              e.target.value
                            )
                          }
                          placeholder="Contoh: Plaza Semanggi Jakarta"
                          className="flex-1 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setMeetingPoints, idx)}
                          className="p-1.5 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-neutral-800 uppercase">
                        Pos Pendakian / Area Kegiatan
                      </h4>
                      <button
                        type="button"
                        onClick={() => setTrailPosts((prev) => [...prev, ""])}
                        className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                      >
                        + Tambah
                      </button>
                    </div>
                    {trailPosts.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            updateListItem(setTrailPosts, idx, e.target.value)
                          }
                          placeholder="Contoh: Pos 1 - Pos 2 - Sunrise Camp"
                          className="flex-1 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setTrailPosts, idx)}
                          className="p-1.5 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-neutral-800 uppercase">
                      Fasilitas Include
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIncludeItems((prev) => [...prev, ""])}
                      className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                    >
                      + Tambah Include
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {includeItems.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            updateListItem(setIncludeItems, idx, e.target.value)
                          }
                          placeholder="Contoh: Transportasi PP"
                          className="flex-1 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setIncludeItems, idx)}
                          className="p-1.5 text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-neutral-800 uppercase">
                      Susunan Itinerary
                    </h4>
                    <button
                      type="button"
                      onClick={addItineraryRow}
                      className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                    >
                      + Tambah Baris Itinerary
                    </button>
                  </div>

                  <div className="space-y-2">
                    {itineraryItems.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <input
                          type="number"
                          min={1}
                          value={row.day}
                          onChange={(e) =>
                            updateItineraryRow(
                              idx,
                              "day",
                              Number(e.target.value)
                            )
                          }
                          placeholder="Hari"
                          className="sm:col-span-2 border border-neutral-300 rounded-xl px-2.5 py-2 text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={row.startTime}
                          onChange={(e) =>
                            updateItineraryRow(idx, "startTime", e.target.value)
                          }
                          placeholder="Mulai (20.00)"
                          className="sm:col-span-2 border border-neutral-300 rounded-xl px-2.5 py-2 text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={row.endTime}
                          onChange={(e) =>
                            updateItineraryRow(idx, "endTime", e.target.value)
                          }
                          placeholder="Selesai (22.00)"
                          className="sm:col-span-2 border border-neutral-300 rounded-xl px-2.5 py-2 text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={row.activity}
                          onChange={(e) =>
                            updateItineraryRow(idx, "activity", e.target.value)
                          }
                          placeholder="Kegiatan..."
                          className="sm:col-span-5 border border-neutral-300 rounded-xl px-3 py-2 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeItineraryRow(idx)}
                          className="sm:col-span-1 p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {category === "TRIP" && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-neutral-800 uppercase">
                        Perlengkapan Pribadi Wajib (Essential)
                      </h4>
                      <button
                        type="button"
                        onClick={addEssentialRow}
                        className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                      >
                        + Tambah Perlengkapan
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {essentialItems.map((row, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                        >
                          <input
                            type="number"
                            min={1}
                            value={row.no}
                            onChange={(e) =>
                              updateEssentialRow(
                                idx,
                                "no",
                                Number(e.target.value)
                              )
                            }
                            className="sm:col-span-1 border border-neutral-300 rounded-xl px-2 py-1.5 text-xs text-center bg-white"
                          />
                          <input
                            type="text"
                            value={row.itemName}
                            onChange={(e) =>
                              updateEssentialRow(
                                idx,
                                "itemName",
                                e.target.value
                              )
                            }
                            placeholder="Nama Barang"
                            className="sm:col-span-4 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                          />
                          <input
                            type="text"
                            value={row.quantity}
                            onChange={(e) =>
                              updateEssentialRow(
                                idx,
                                "quantity",
                                e.target.value
                              )
                            }
                            placeholder="Jumlah"
                            className="sm:col-span-2 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs bg-white"
                          />
                          <input
                            type="text"
                            value={row.note}
                            onChange={(e) =>
                              updateEssentialRow(idx, "note", e.target.value)
                            }
                            placeholder="Keterangan"
                            className="sm:col-span-4 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeEssentialRow(idx)}
                            className="sm:col-span-1 p-1.5 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-neutral-800 uppercase">
                      Rules & Syarat Ketentuan Paket
                    </h4>
                    <button
                      type="button"
                      onClick={addRuleRow}
                      className="text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                    >
                      + Tambah Baris Rules
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {rulesItems.map((row, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <input
                          type="number"
                          min={1}
                          value={row.no}
                          onChange={(e) =>
                            updateRuleRow(idx, "no", Number(e.target.value))
                          }
                          className="w-12 border border-neutral-300 rounded-xl px-2 py-2 text-xs text-center font-bold bg-white"
                        />
                        <textarea
                          rows={2}
                          value={row.rule}
                          onChange={(e) =>
                            updateRuleRow(idx, "rule", e.target.value)
                          }
                          placeholder="Tulis aturan paket..."
                          className="flex-1 border border-neutral-300 rounded-xl px-3 py-2 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeRuleRow(idx)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 sticky bottom-0 bg-white z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="px-6 py-2.5 rounded-full text-xs font-black bg-[#6F4E37] hover:bg-[#5a3e2b] text-white shadow cursor-pointer"
              >
                {savingProduct
                  ? "Menyimpan..."
                  : editingId
                  ? "Simpan Perubahan"
                  : "Simpan ke Etalase"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeCropImage && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-[#6F4E37]">
                  <Crop className="w-3 h-3" /> Crop Foto{" "}
                  {cropTarget === "COVER"
                    ? "Cover Utama"
                    : `Dokumentasi (${cropQueue.length} tersisa)`}
                </span>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 mt-1">
                  Sesuaikan Framing Foto dengan Layout Tampilan
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCancelCropQueue}
                className="p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {CROP_PRESETS.map((preset) => {
                  const selected = cropPreset === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setCropPreset(preset.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer ${
                        selected
                          ? "bg-[#6F4E37] text-white shadow"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-bold text-[#6F4E37]">
                {activeCropPresetObj.layoutHint}
              </p>
            </div>

            <div className="bg-neutral-950 rounded-2xl p-4 flex items-center justify-center min-h-[240px] sm:min-h-[260px] overflow-hidden">
              <div
                style={{
                  aspectRatio:
                    activeCropPresetObj.ratio !== null
                      ? String(activeCropPresetObj.ratio)
                      : "4 / 3",
                }}
                className="relative w-full max-w-md max-h-[300px] overflow-hidden rounded-xl border-2 border-amber-400/90 shadow-lg bg-neutral-900 flex items-center justify-center"
              >
                <img
                  src={activeCropImage}
                  alt="Pratinjau Crop"
                  style={{
                    transform: `translate(${cropOffsetX}%, ${cropOffsetY}%) scale(${cropZoom})`,
                  }}
                  className="w-full h-full object-contain transition-transform duration-75 select-none"
                />
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-1.5 font-bold text-neutral-700 shrink-0">
                  <ZoomIn className="w-3.5 h-3.5 text-[#6F4E37]" />
                  <span>Zoom: {cropZoom.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="w-full accent-[#6F4E37] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 font-bold text-neutral-700 shrink-0">
                    <Move className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Geser X</span>
                  </label>
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    step={1}
                    value={cropOffsetX}
                    onChange={(e) => setCropOffsetX(Number(e.target.value))}
                    className="w-full accent-[#6F4E37] cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 font-bold text-neutral-700 shrink-0">
                    <Move className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Geser Y</span>
                  </label>
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    step={1}
                    value={cropOffsetY}
                    onChange={(e) => setCropOffsetY(Number(e.target.value))}
                    className="w-full accent-[#6F4E37] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setCropZoom(1);
                  setCropOffsetX(0);
                  setCropOffsetY(0);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Posisi
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkipCropCurrent}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                >
                  Pakai Tanpa Crop
                </button>
                <button
                  type="button"
                  disabled={applyingCrop}
                  onClick={handleApplyCrop}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-black bg-[#6F4E37] hover:bg-[#5a3e2b] text-white shadow cursor-pointer"
                >
                  {applyingCrop ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Terapkan Crop</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewProof && (
        <div
          onClick={() => setPreviewProof(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">Bukti Transfer Pelanggan</h3>
              <button
                type="button"
                onClick={() => setPreviewProof(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewProof}
              alt="Bukti Transfer"
              className="w-full max-h-[70vh] object-contain rounded-2xl bg-neutral-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}
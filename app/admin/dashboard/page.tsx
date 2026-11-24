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
} from "lucide-react";

const TRIP_SUBCATEGORIES = ["ALL", "HIKING", "TEKTOK", "ROCK_CLIMBING", "CAVING"];
const OUTBOUND_SUBCATEGORIES = [
  "ALL",
  "FLYING_FOX",
  "RAPELING",
  "FLYING_FOX_RAPELING",
];
const RENTAL_SUBCATEGORIES = [
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
    startTime: "07.30",
    endTime: "10.30",
    activity: "Turun Kembali ke Area Camp, Sarapan & Bongkar Tenda",
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

function getDefaultSubCategory(cat: ProductMainCategory): string {
  if (cat === "OUTBOUND") return "FLYING_FOX";
  if (cat === "RENTAL") return "TAS_CARRIER";
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

function extractScheduleFromNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Jadwal\s*:\s*([^\n|]+)/i);
  return match?.[1]?.trim() || null;
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
  const [filterCategory, setFilterCategory] = useState<
    "ALL" | ProductMainCategory
  >("ALL");
  const [filterSub, setFilterSub] = useState<string>("ALL");

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
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await res.json();
      setOrders(data.orders || []);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchDiscounts = async () => {
    setLoadingDiscounts(true);
    try {
      const res = await fetch("/api/admin/discounts", { cache: "no-store" });
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
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
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
      .filter((it) => String(it.product?.category || "").toUpperCase() === "RENTAL")
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
    resetFormForAdd("TRIP");
    setIsModalOpen(true);
  };

  const handleCategoryChangeInModal = (nextCat: ProductMainCategory) => {
    setCategory(nextCat);
    setSubCategory(getDefaultSubCategory(nextCat));
    if (nextCat !== "TRIP") {
      setIsRecommended(false);
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

  const addTimeTripSlot = () => {
    setTimeTrips((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}-${prev.length}`,
        dateLabel: "",
        quota: 10,
        sold: false,
      },
    ]);
  };

  const updateTimeTripSlot = (id: string, patch: Partial<TimeTripSlot>) => {
    setTimeTrips((prev) =>
      prev.map((slot) => {
        if (slot.id !== id) return slot;
        const next = { ...slot, ...patch };
        if (typeof patch.quota === "number" && patch.quota <= 0) {
          next.sold = true;
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

    const cleanedTimeTrips = timeTrips
      .filter((t) => t.dateLabel.trim() !== "")
      .map((t) => ({
        ...t,
        dateLabel: t.dateLabel.trim(),
        quota: Math.max(0, Number(t.quota) || 0),
        sold: Boolean(t.sold) || Number(t.quota) <= 0,
      }));

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

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      title,
      category,
      subCategory,
      price: Number(price),
      stock: Math.max(0, Number(stock) || 0),
      image: coverImage,
      description:
        description.trim() ||
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
        resetFormForAdd("TRIP");
        fetchProducts();
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
    } else {
      showToast(data.message || "Gagal menghapus paket.");
    }
  };

  const releaseScheduleForDeletedOrder = async (targetOrder: AdminOrder) => {
    const notesSchedule = extractScheduleFromNotes(targetOrder.notes);

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

      let changed = false;
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
            const restoredQuota =
              Math.max(0, Number(slot.quota || 0)) +
              Math.max(1, Number(item.quantity || 1));
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
          showToast("Pesanan dikonfirmasi dan ditandai Selesai!");
        } else {
          showToast("Pesanan ditolak admin.");
        }
        fetchOrders();
        fetchProducts();
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
          "Riwayat pesanan dihapus & jadwal terbooking dikembalikan tersedia."
        );
        await fetchOrders();
        await fetchProducts();
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

  const filteredProducts = products.filter((p) => {
    const pCat = String(p.category || "").toUpperCase();
    const matchCat = filterCategory === "ALL" || pCat === filterCategory;
    const matchSub =
      filterSub === "ALL" || (p.subCategory || "ALL") === filterSub;
    return matchCat && matchSub;
  });

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

  const subFilterOptions =
    filterCategory === "TRIP"
      ? TRIP_SUBCATEGORIES
      : filterCategory === "OUTBOUND"
      ? OUTBOUND_SUBCATEGORIES
      : filterCategory === "RENTAL"
      ? ["ALL", ...RENTAL_SUBCATEGORIES]
      : [];

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-neutral-900">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-amber-400/40">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-amber-900/10 p-6 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-[#6F4E37] mb-2">
              <Store className="w-3.5 h-3.5" /> Merchant Seller Center
            </span>
            <h1 className="text-2xl font-black text-neutral-900">
              Dashboard Toko {storeName}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveMenu("catalog")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer ${
                activeMenu === "catalog"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Etalase Paket</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("orders");
                loadCustomerReviews();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer ${
                activeMenu === "orders"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Pesanan ({waitingOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("discounts");
                fetchDiscounts();
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer ${
                activeMenu === "discounts"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Diskon ({discounts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenu("notifications");
                loadStoredAdminNotifs();
              }}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer ${
                activeMenu === "notifications"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifikasi</span>
              {unreadAdminNotifCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500 text-black font-black">
                  {unreadAdminNotifCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu("settings")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black transition cursor-pointer ${
                activeMenu === "settings"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings Toko</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-sm">
            <p className="text-[11px] font-bold text-amber-700">
              Menunggu Konfirmasi
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {waitingOrders.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-sm">
            <p className="text-[11px] font-bold text-emerald-700">Selesai</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {completedOrders.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-sm">
            <p className="text-[11px] font-bold text-rose-700">
              Ditolak / Dibatalkan
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {cancelledOrders.length}
            </p>
          </div>
        </div>

        {activeMenu === "catalog" && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {(["ALL", "TRIP", "OUTBOUND", "RENTAL"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFilterCategory(cat);
                      setFilterSub("ALL");
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      filterCategory === cat
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {cat === "ALL"
                      ? "Semua Kategori"
                      : cat === "TRIP"
                      ? "Open Trip"
                      : cat === "OUTBOUND"
                      ? "Outbound"
                      : "Rental Gear"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-full shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Paket Baru</span>
              </button>
            </div>

            {filterCategory !== "ALL" && subFilterOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-400 mr-1">
                  Sub-Kategori{" "}
                  {filterCategory === "TRIP"
                    ? "Open Trip"
                    : filterCategory === "OUTBOUND"
                    ? "Outbound"
                    : "Rental Gear"}
                  :
                </span>
                {subFilterOptions.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setFilterSub(sub)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                      filterSub === sub
                        ? "bg-[#6F4E37] text-white"
                        : "bg-amber-50 text-[#6F4E37] hover:bg-amber-100"
                    }`}
                  >
                    {sub.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            )}

            {loadingProducts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-500">
                Belum ada item pada kategori ini. Klik{" "}
                <strong>+ Tambah Paket Baru</strong> untuk mulai mengisi etalase.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((prod) => {
                  const isRental =
                    String(prod.category || "").toUpperCase() === "RENTAL";
                  const isRecTrip =
                    String(prod.category || "").toUpperCase() === "TRIP" &&
                    Boolean(prod.metaData?.isRecommended);

                  return (
                    <div
                      key={prod.id}
                      className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/40 flex flex-col justify-between gap-4 hover:border-[#6F4E37]/40 transition"
                    >
                      <div>
                        {prod.image && (
                          <div className="relative w-full h-36 rounded-xl mb-3 border border-neutral-200 bg-neutral-100 flex items-center justify-center p-2 overflow-hidden">
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-full h-full object-contain"
                            />
                            {isRecTrip && (
                              <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-neutral-950 shadow-xs">
                                <Star className="w-3 h-3 fill-neutral-950" />
                                Rekomendasi Home
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-[#6F4E37]">
                            {prod.category} •{" "}
                            {(prod.subCategory || "ALL").replace(/_/g, " ")}
                          </span>
                          {isRental && (
                            <span className="text-[10px] font-bold text-neutral-500">
                              Stok: {prod.stock}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-black text-neutral-900">
                          {prod.title}
                        </h3>
                        <p className="text-base font-black text-emerald-700 mt-1">
                          {formatRupiah(prod.price)}
                          {isRental ? (
                            <span className="text-[11px] font-bold text-neutral-500 ml-1">
                              / malam
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-neutral-500 mt-2 line-clamp-2">
                          {prod.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200/70">
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-neutral-300 hover:bg-neutral-100 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeMenu === "discounts" && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-black text-neutral-900">
                Manajemen Kode Diskon Checkout
              </h2>
            </div>

            <form
              onSubmit={handleCreateDiscount}
              className="bg-[#FFFDF5] border border-amber-200/90 p-5 rounded-2xl space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-neutral-800 mb-1.5">
                    Kode Diskon *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDiscountCode}
                    onChange={(e) =>
                      setNewDiscountCode(e.target.value.toUpperCase())
                    }
                    placeholder="HEMAT5 / ALAM25K"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 uppercase placeholder:normal-case placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-neutral-800 mb-1.5">
                    Tipe Diskon *
                  </label>
                  <select
                    value={newDiscountType}
                    onChange={(e) =>
                      setNewDiscountType(
                        e.target.value === "FIXED" ? "FIXED" : "PERCENTAGE"
                      )
                    }
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/30"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Nominal (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-neutral-800 mb-1.5">
                    {newDiscountType === "PERCENTAGE"
                      ? "Besar Diskon (%) *"
                      : "Besar Diskon (Rp) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={newDiscountType === "PERCENTAGE" ? 100 : undefined}
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    placeholder={
                      newDiscountType === "PERCENTAGE"
                        ? "Contoh: 5"
                        : "Contoh: 25000"
                    }
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-neutral-800 mb-1.5">
                    Minimal Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newMinPurchase}
                    onChange={(e) => setNewMinPurchase(e.target.value)}
                    placeholder="0 (tanpa minimal)"
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-neutral-800 mb-1.5">
                    Berlaku Sampai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={newExpiresAt}
                    onChange={(e) => setNewExpiresAt(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6F4E37]/30"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={creatingDiscount}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#6F4E37] hover:bg-[#5a3e2b] text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60"
                  >
                    {creatingDiscount ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Buat Diskon</span>
                  </button>
                </div>
              </div>
            </form>

            {loadingDiscounts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
              </div>
            ) : discounts.length === 0 ? (
              <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-xs font-medium text-neutral-500">
                Belum ada kode diskon yang dibuat.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discounts.map((disc) => {
                  const isExpired =
                    disc.expiresAt && new Date(disc.expiresAt) < new Date();
                  const labelValue =
                    disc.discountType === "PERCENTAGE"
                      ? `Diskon ${disc.discountValue}%`
                      : `Diskon ${formatRupiah(disc.discountValue)}`;

                  return (
                    <div
                      key={disc.id}
                      className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-[#6F4E37] font-black text-xs tracking-wide">
                            {disc.code}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              !disc.isActive || isExpired
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isExpired
                              ? "Kadaluarsa"
                              : disc.isActive
                              ? "Aktif"
                              : "Nonaktif"}
                          </span>
                        </div>

                        <p className="text-base font-black text-neutral-900 pt-1">
                          {labelValue}
                        </p>
                        <p className="text-[11px] text-neutral-600">
                          Min. Belanja:{" "}
                          <strong>
                            {disc.minPurchase > 0
                              ? formatRupiah(disc.minPurchase)
                              : "Tanpa minimum"}
                          </strong>
                        </p>
                        <p className="text-[11px] text-neutral-600">
                          Masa Berlaku:{" "}
                          <strong>
                            {disc.expiresAt
                              ? new Date(disc.expiresAt).toLocaleDateString(
                                  "id-ID"
                                )
                              : "Selamanya (sampai dihapus)"}
                          </strong>
                        </p>
                      </div>

                      <div className="flex justify-end pt-2 border-t border-neutral-200/70">
                        <button
                          type="button"
                          disabled={deletingDiscountId === disc.id}
                          onClick={() => handleDeleteDiscount(disc.id)}
                          className="inline-flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
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
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4">
              <button
                type="button"
                onClick={() => setOrderTab("WAITING_CONFIRMATION")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                  orderTab === "WAITING_CONFIRMATION"
                    ? "bg-amber-500 text-black shadow"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu Konfirmasi ({waitingOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderTab("COMPLETED")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                  orderTab === "COMPLETED"
                    ? "bg-emerald-600 text-white shadow"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesai ({completedOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderTab("CANCELLED")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                  orderTab === "CANCELLED"
                    ? "bg-rose-600 text-white shadow"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Ditolak / Dibatalkan ({cancelledOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  loadCustomerReviews();
                  setOrderTab("REVIEWS");
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                  orderTab === "REVIEWS"
                    ? "bg-[#6F4E37] text-white shadow"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Ulasan ({customerReviews.length})</span>
              </button>
            </div>

            {orderTab === "REVIEWS" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-black text-neutral-900">
                      Ulasan Pelanggan Berdasarkan Kode Orderan
                    </h2>
                    <p className="text-[11px] text-neutral-500">
                      Menghapus ulasan di sini akan langsung menghapusnya dari sisi customer juga.
                    </p>
                  </div>
                </div>

                {customerReviews.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                    <p className="text-xs font-bold text-neutral-600">
                      Belum ada ulasan dari pelanggan.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerReviews.map((rev) => {
                      const codeLabel = resolveOrderCodeOnly(
                        rev.orderCode,
                        rev.orderId
                      );
                      return (
                        <div
                          key={rev.id}
                          className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 space-y-2.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-[#6F4E37] font-black text-[11px]">
                                Pesanan {codeLabel}
                              </span>
                              <div className="flex items-center gap-1 mt-1.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= rev.rating
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-neutral-300"
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 font-black text-neutral-800">
                                  ({rev.rating}/5)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-neutral-500">
                                {new Date(rev.createdAt).toLocaleDateString(
                                  "id-ID"
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCustomerReview(rev.id)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>

                          {rev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {rev.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-neutral-200 text-neutral-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-neutral-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-neutral-200/70">
                            {rev.comment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : loadingOrders ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                <p className="text-xs font-bold text-neutral-600">
                  Belum ada data pesanan pada tab ini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedOrders.map((order) => {
                  const notesSchedule = extractScheduleFromNotes(order.notes);
                  const cancelledByCust = isCancelledByCustomer(order);
                  const isCompletedOrder =
                    order.status === "COMPLETED" ||
                    order.status === "PROCESSING";
                  const overdue = isOrderRentalOverdue(order);
                  const returnDate = extractReturnDateFromOrder(order);
                  const customerWaUrl = buildCustomerWaContactUrl(
                    order,
                    formatRupiah
                  );

                  return (
                    <div
                      key={order.id}
                      className={`border rounded-2xl p-5 space-y-4 ${
                        overdue
                          ? "border-rose-300 bg-rose-50/40"
                          : cancelledByCust
                          ? "border-neutral-300 bg-neutral-100/70"
                          : "border-neutral-200 bg-neutral-50/40"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-neutral-900">
                              Order #{order.id.slice(-6).toUpperCase()} •{" "}
                              {order.user.name || order.user.email}
                            </p>
                            {overdue && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                                <AlertTriangle className="w-3 h-3" />
                                Lewat Tgl Kembali ({returnDate})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-0.5">
                            No. WA Customer:{" "}
                            <strong className="text-neutral-900">
                              {order.user.phone || "Belum diisi"}
                            </strong>{" "}
                            • Pengirim TF:{" "}
                            <strong>{order.senderName || "-"}</strong> (
                            {order.bankName || "-"})
                          </p>
                        </div>

                        {order.status === "WAITING_CONFIRMATION" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900">
                            <Clock className="w-3.5 h-3.5" /> Menunggu Konfirmasi
                          </span>
                        )}
                        {isCompletedOrder && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        )}
                        {order.status === "CANCELLED" &&
                          (cancelledByCust ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-neutral-800 text-white">
                              <Ban className="w-3.5 h-3.5 text-amber-300" /> Dibatalkan Pelanggan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-900">
                              <Ban className="w-3.5 h-3.5" /> Ditolak Admin
                            </span>
                          ))}
                      </div>

                      <div className="text-xs space-y-2 border-t border-neutral-200/70 pt-3">
                        {order.items.map((it) => {
                          const chosenDate = it.selectedSchedule || notesSchedule;
                          return (
                            <div
                              key={it.id}
                              className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-neutral-200/70"
                            >
                              <div>
                                <p className="font-bold text-neutral-900">
                                  {it.product.title} × {it.quantity}
                                </p>
                                {chosenDate && (
                                  <p className="inline-flex items-center gap-1 text-[11px] font-black text-[#6F4E37] mt-0.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>Jadwal Dipilih: {chosenDate}</span>
                                  </p>
                                )}
                              </div>
                              <span className="font-bold">
                                {formatRupiah(it.price * it.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {order.notes && (
                        <div
                          className={`border rounded-xl p-3 text-[11px] whitespace-pre-line ${
                            cancelledByCust
                              ? "bg-amber-50 border-amber-300 text-neutral-900 font-semibold"
                              : "bg-white border-neutral-200 text-neutral-700"
                          }`}
                        >
                          {order.notes}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-neutral-300">
                        <p className="text-sm font-black text-[#6F4E37]">
                          Total: {formatRupiah(order.totalAmount)}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {overdue && (
                            <button
                              type="button"
                              disabled={remindingOrderId === order.id}
                              onClick={() => handleSendReturnReminder(order)}
                              className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-black shadow-2xs transition cursor-pointer disabled:opacity-60"
                            >
                              {remindingOrderId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Kirim Pemberitahuan Kembali</span>
                            </button>
                          )}

                          {customerWaUrl && (
                            <a
                              href={customerWaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black shadow-2xs transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Hubungi Customer</span>
                            </a>
                          )}

                          {order.paymentProof && (
                            <button
                              type="button"
                              onClick={() => setPreviewProof(order.paymentProof!)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full bg-white border border-neutral-300 hover:bg-neutral-100 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Bukti TF</span>
                            </button>
                          )}

                          {order.status === "WAITING_CONFIRMATION" && (
                            <>
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() =>
                                  handleUpdateOrderStatus(order.id, "COMPLETED")
                                }
                                className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Konfirmasi & Selesaikan</span>
                              </button>
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() =>
                                  handleUpdateOrderStatus(
                                    order.id,
                                    "CANCELLED",
                                    "Ditolak admin: bukti transfer belum sesuai, silakan upload ulang bukti pembayaran yang benar."
                                  )
                                }
                                className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Tolak Pesanan</span>
                              </button>
                            </>
                          )}

                          {(isCompletedOrder || order.status === "CANCELLED") && (
                            <button
                              type="button"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleDeleteOrderHistory(order.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Riwayat</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeMenu === "notifications" && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
              <div>
                <h2 className="text-sm font-black text-neutral-900 uppercase tracking-wider">
                  Pusat Notifikasi Admin ({adminNotifications.length})
                </h2>
                <p className="text-[11px] text-neutral-500">
                  Aktivitas terbaru dari customer: pesanan masuk, upload ulang bukti TF, pembatalan, dan ulasan baru
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {unreadAdminNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAdminNotifsRead}
                    className="inline-flex items-center gap-1 text-xs font-black text-[#6F4E37] hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Tandai semua dibaca</span>
                  </button>
                )}
                {adminNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllAdminNotifs}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus semua</span>
                  </button>
                )}
              </div>
            </div>

            {adminNotifications.length === 0 ? (
              <div className="py-10 text-center text-xs font-semibold text-neutral-500">
                Belum ada notifikasi masuk dari customer.
              </div>
            ) : (
              <div className="space-y-3">
                {adminNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAdminNotifRead(notif.id)}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition ${
                      notif.isRead
                        ? "bg-white border-neutral-200 text-neutral-800"
                        : "bg-amber-50/90 border-amber-300 text-neutral-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Bell className="w-4 h-4 text-[#6F4E37] shrink-0" />
                        <p className="font-black">{notif.title}</p>
                        {!notif.isRead && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#6F4E37] text-white">
                            Baru
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-neutral-500">
                          {new Date(notif.createdAt).toLocaleDateString("id-ID")}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAdminNotif(notif.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                    <p className="mt-1.5 text-neutral-700 leading-relaxed">
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
            className="bg-white rounded-3xl border border-neutral-200/80 p-6 shadow-sm max-w-2xl space-y-4"
          >
            <h2 className="text-base font-black text-neutral-900">
              Pengaturan Toko & Pembayaran Manual
            </h2>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Nama Toko
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Nomor WhatsApp Admin (format 628xxx)
              </label>
              <input
                type="text"
                value={waAdminNumber}
                onChange={(e) => setWaAdminNumber(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Atas Nama
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="bg-[#6F4E37] hover:bg-[#5a3e2b] text-white font-black px-6 py-2.5 rounded-full text-xs cursor-pointer"
            >
              {savingSettings ? "Menyimpan..." : "Simpan Pengaturan Toko"}
            </button>
          </form>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-black text-neutral-900">
                {editingId ? "Edit Paket / Alat Rental" : "Tambah Paket Baru"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="TRIP">Open Trip</option>
                  <option value="OUTBOUND">Outbound</option>
                  <option value="RENTAL">Rental Gear Outdoor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Sub-Kategori *
                </label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                >
                  {(category === "TRIP"
                    ? TRIP_SUBCATEGORIES
                    : category === "OUTBOUND"
                    ? OUTBOUND_SUBCATEGORIES
                    : RENTAL_SUBCATEGORIES
                  ).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {category === "TRIP" && (
              <label className="flex items-center justify-between gap-3 bg-amber-50/90 border border-amber-200 rounded-2xl px-4 py-3 cursor-pointer hover:bg-amber-100/70 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#6F4E37] text-white flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-neutral-900">
                      Tampilkan di Section Rekomendasi Trip (Home)
                    </p>
                    <p className="text-[11px] text-neutral-600">
                      Centang agar paket Open Trip ini muncul di bar berjalan Rekomendasi Trip halaman utama
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isRecommended}
                  onChange={(e) => setIsRecommended(e.target.checked)}
                  className="w-4 h-4 accent-[#6F4E37] rounded cursor-pointer shrink-0"
                />
              </label>
            )}

            <div
              className={`grid grid-cols-1 ${
                category === "RENTAL" ? "sm:grid-cols-3" : "sm:grid-cols-2"
              } gap-3`}
            >
              <div>
                <label className="block text-xs font-bold mb-1">
                  {category === "RENTAL" ? "Nama Alat Rental *" : "Judul Paket *"}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === "TRIP"
                      ? "Contoh: Open Trip Gunung Gede"
                      : category === "OUTBOUND"
                      ? "Contoh: Jasa Pemasangan Flying Fox"
                      : "Contoh: Carrier Osprey 60L"
                  }
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  {category === "RENTAL"
                    ? "Harga per Malam (Rp) *"
                    : "Harga / Pax (Rp) *"}
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={
                    category === "TRIP"
                      ? "650000"
                      : category === "OUTBOUND"
                      ? "5000000"
                      : "35000"
                  }
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              {category === "RENTAL" && (
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Stok Unit Tersedia *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50/90 p-4 rounded-2xl border border-neutral-200/80">
              <div className="space-y-2.5">
                <label className="block text-xs font-black text-neutral-800">
                  {category === "RENTAL"
                    ? "Foto Produk Rental *"
                    : "1. Gambar Cover Card *"}
                </label>
                <label className="flex items-center justify-center gap-2 border border-dashed border-neutral-300 hover:border-[#6F4E37] rounded-2xl p-3 text-xs font-bold text-neutral-700 cursor-pointer bg-white transition">
                  <Upload className="w-4 h-4 text-[#6F4E37]" />
                  <span>Pilih & Crop Foto Produk</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
                {coverImage && (
                  <div className="relative mt-2 rounded-2xl border border-black/[0.07] bg-white p-2 shadow-2xs">
                    <div className="w-full h-36 rounded-xl bg-neutral-100/80 flex items-center justify-center overflow-hidden">
                      <img
                        src={coverImage}
                        alt="Preview Cover"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          openCropperForImages([coverImage], "COVER", "4:3")
                        }
                        className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-[#6F4E37] text-white text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition"
                      >
                        <Crop className="w-3 h-3" />
                        <span>Crop Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage("")}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {category !== "RENTAL" && (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-neutral-800">
                    2. Gambar Dokumentasi (Galeri Detail)
                  </label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 hover:border-[#6F4E37] rounded-xl p-3 text-xs font-bold text-neutral-600 cursor-pointer bg-white">
                    <Upload className="w-4 h-4 text-[#6F4E37]" />
                    <span>Pilih & Crop Foto Dokumentasi</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleDocumentationUpload}
                      className="hidden"
                    />
                  </label>
                  {documentationImages.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {documentationImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-neutral-200"
                        >
                          <img
                            src={imgUrl}
                            alt={`Dok ${idx + 1}`}
                            className="w-14 h-12 object-cover rounded-lg shrink-0"
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
                            placeholder="Judul / caption dokumentasi..."
                            className="flex-1 border border-neutral-200 rounded-lg px-2 py-1 text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => removeDocumentationImage(idx)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {category === "TRIP" && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5 text-[#6F4E37]" />
                  <span>Link / Embed Google Maps Lokasi Gunung</span>
                </label>
                <input
                  type="text"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  placeholder="Tempel URL Embed Google Maps (https://www.google.com/maps/embed?...) atau kode <iframe>"
                  className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1">
                {category === "TRIP"
                  ? "Information — Deskripsi Singkat *"
                  : category === "RENTAL"
                  ? "Catatan / Spesifikasi Alat Rental"
                  : "Deskripsi Layanan Outbound *"}
              </label>
              <textarea
                rows={2}
                required={category !== "RENTAL"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  category === "RENTAL"
                    ? "Contoh: Kapasitas 60L, include raincover, kondisi bersih & terawat"
                    : undefined
                }
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            {/* BLOK TANGGAL TIDAK BISA DIRENTAL / DIBLOKIR ADMIN & TANGGAL TERBOOKING */}
            {category === "RENTAL" && (
              <div className="space-y-2.5 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-[#6F4E37]">
                    Kalender Rental — Tanggal Tidak Bisa Direntalkan (Diblokir Admin)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={newUnavailableDate}
                      onChange={(e) => setNewUnavailableDate(e.target.value)}
                      className="border border-neutral-300 rounded-lg px-2.5 py-1 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={addUnavailableDate}
                      className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full bg-rose-600 text-white cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Blokir Tanggal
                    </button>
                  </div>
                </div>

                {unavailableDates.length === 0 ? (
                  <p className="text-[11px] text-neutral-600">
                    Belum ada tanggal yang diblokir admin untuk alat rental ini.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {unavailableDates.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] font-bold"
                      >
                        <span>{d}</span>
                        <button
                          type="button"
                          onClick={() => removeUnavailableDate(d)}
                          className="hover:text-rose-900 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {bookedDates.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/80">
                    <p className="text-[10px] font-black uppercase text-neutral-600 mb-1">
                      Tanggal Terbooking Otomatis Saat Customer Checkout (Klik × untuk melepas):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {bookedDates.map((bd) => (
                        <span
                          key={bd}
                          className="inline-flex items-center gap-1.5 bg-amber-100 text-[#6F4E37] border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black"
                        >
                          <span>{bd} (Terbooking)</span>
                          <button
                            type="button"
                            title="Lepas tanggal terbooking"
                            onClick={() => releaseBookedDate(bd)}
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
            )}

            {category === "OUTBOUND" && (
              <div className="space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
                <p className="text-xs font-black text-[#6F4E37]">
                  Detail Outbound (Layanan Kami, Keunggulan Kami, Include & Kalender Tanggal Tidak Bersedia)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-800">
                        Layanan Kami
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setServicesItems((prev) => [...prev, ""])
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                    </div>
                    {servicesItems.map((srv, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={srv}
                          onChange={(e) =>
                            updateListItem(setServicesItems, idx, e.target.value)
                          }
                          placeholder="cth: Survey & Pemetaan Area"
                          className="flex-1 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setServicesItems, idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-800">
                        Keunggulan Kami
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setAdvantagesItems((prev) => [...prev, ""])
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                    </div>
                    {advantagesItems.map((adv, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={adv}
                          onChange={(e) =>
                            updateListItem(
                              setAdvantagesItems,
                              idx,
                              e.target.value
                            )
                          }
                          placeholder="cth: Sistem Keamanan Ganda"
                          className="flex-1 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setAdvantagesItems, idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-neutral-800">
                      Include Paket Outbound
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncludeItems((prev) => [...prev, ""])}
                      className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah Include
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {includeItems.map((inc, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={inc}
                          onChange={(e) =>
                            updateListItem(setIncludeItems, idx, e.target.value)
                          }
                          placeholder="cth: Jasa Pemasangan / Peralatan Safety"
                          className="flex-1 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setIncludeItems, idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-amber-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-neutral-800">
                      Kalender — Tanggal Tidak Bersedia / Diblokir Admin
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={newUnavailableDate}
                        onChange={(e) => setNewUnavailableDate(e.target.value)}
                        className="border border-neutral-300 rounded-lg px-2.5 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={addUnavailableDate}
                        className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full bg-red-600 text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Blokir Tanggal
                      </button>
                    </div>
                  </div>

                  {unavailableDates.length === 0 ? (
                    <p className="text-[11px] text-neutral-500">
                      Belum ada tanggal yang diblokir admin. Semua tanggal kosong tersedia untuk dibooking.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {unavailableDates.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-[11px] font-bold"
                        >
                          <span>{d}</span>
                          <button
                            type="button"
                            onClick={() => removeUnavailableDate(d)}
                            className="hover:text-red-900 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {bookedDates.length > 0 && (
                    <div className="pt-2 border-t border-neutral-100">
                      <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">
                        Tanggal Sudah Terbooking Otomatis oleh Customer (Klik × untuk melepas / reschedule):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bookedDates.map((bd) => (
                          <span
                            key={bd}
                            className="inline-flex items-center gap-1.5 bg-amber-100 text-[#6F4E37] border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black"
                          >
                            <span>{bd} (Terbooking)</span>
                            <button
                              type="button"
                              title="Lepas tanggal terbooking agar kembali tersedia"
                              onClick={() => releaseBookedDate(bd)}
                              className="hover:text-red-700 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {category === "TRIP" && (
              <div className="space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
                <p className="text-xs font-black text-[#6F4E37]">
                  Detail Open Trip (Grade Gunung, Time Trip, Titik Kumpul, Pos, Include, Itinerary, Essential)
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lokasi (cth: Bogor, Jawa Barat)"
                    className="border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                  />
                  <input
                    type="text"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    placeholder="Ketinggian (cth: 2958 MDPL)"
                    className="border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                  />
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder="Jalur (cth: Via Putri)"
                    className="border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                  />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Durasi (cth: 2 Hari 1 Malam)"
                    className="border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                  />
                  <div>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white font-bold"
                    >
                      <option value="1">Grade 1 (Sangat Ringan)</option>
                      <option value="2">Grade 2 (Ringan - Menengah)</option>
                      <option value="3">Grade 3 (Menengah)</option>
                      <option value="4">Grade 4 (Menengah - Berat)</option>
                      <option value="5">Grade 5 (Ekstrem / Berat)</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value)}
                    placeholder="Info Kuota (cth: Maks 12 Orang)"
                    className="border border-neutral-300 rounded-xl px-3 py-1.5 text-xs bg-white"
                  />
                </div>

                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-neutral-800">
                      Time Trip (Tanggal-Bulan-Tahun & Sisa Kuota)
                    </span>
                    <button
                      type="button"
                      onClick={addTimeTripSlot}
                      className="inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Tambah Jadwal
                    </button>
                  </div>

                  {timeTrips.map((slot) => {
                    const isSold = Boolean(slot.sold) || Number(slot.quota) <= 0;
                    return (
                      <div
                        key={slot.id}
                        className="grid grid-cols-12 gap-2 items-center pt-1"
                      >
                        <div className="col-span-5">
                          <label className="text-[10px] font-bold text-neutral-400">
                            Tanggal - Bulan - Tahun
                          </label>
                          <input
                            type="text"
                            value={slot.dateLabel}
                            onChange={(e) =>
                              updateTimeTripSlot(slot.id, {
                                dateLabel: e.target.value,
                              })
                            }
                            placeholder="cth: 12-12-2026"
                            className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="text-[10px] font-bold text-neutral-400">
                            Sisa Kuota
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={slot.quota}
                            onChange={(e) =>
                              updateTimeTripSlot(slot.id, {
                                quota: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
                          />
                        </div>
                        <div className="col-span-3 pt-4 flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isSold}
                            onChange={(e) =>
                              updateTimeTripSlot(slot.id, {
                                sold: e.target.checked,
                                quota: e.target.checked
                                  ? 0
                                  : Math.max(1, slot.quota),
                              })
                            }
                            className="rounded cursor-pointer"
                          />
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isSold
                                ? "bg-red-600 text-white"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isSold ? "SOLD" : `Sisa ${slot.quota}`}
                          </span>
                        </div>
                        <div className="col-span-1 pt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeTimeTripSlot(slot.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-800">
                        Titik Kumpul (Meeting Point)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setMeetingPoints((prev) => [...prev, ""])
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                    </div>
                    {meetingPoints.map((mp, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={mp}
                          onChange={(e) =>
                            updateListItem(
                              setMeetingPoints,
                              idx,
                              e.target.value
                            )
                          }
                          placeholder="cth: Cawang Uki"
                          className="flex-1 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setMeetingPoints, idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-800">
                        Pos Alur Pendakian
                      </span>
                      <button
                        type="button"
                        onClick={() => setTrailPosts((prev) => [...prev, ""])}
                        className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                    </div>
                    {trailPosts.map((post, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={post}
                          onChange={(e) =>
                            updateListItem(setTrailPosts, idx, e.target.value)
                          }
                          placeholder="cth: Basecamp Utama / Pos Simaksi"
                          className="flex-1 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setTrailPosts, idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-neutral-800">
                      Include Paket Trip
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!editingId && (
                        <button
                          type="button"
                          onClick={() =>
                            setIncludeItems(cloneTripIncludeTemplate())
                          }
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-[#6F4E37] hover:bg-amber-200 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Template
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIncludeItems((prev) => [...prev, ""])}
                        className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Include
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {includeItems.map((inc, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={inc}
                          onChange={(e) =>
                            updateListItem(setIncludeItems, idx, e.target.value)
                          }
                          placeholder="cth: Transportasi PP / Simaksi"
                          className="flex-1 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeListItem(setIncludeItems, idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-neutral-800">
                      Itinerary (Day, Jam Mulai - Selesai, Jenis Kegiatan)
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!editingId && (
                        <button
                          type="button"
                          onClick={() =>
                            setItineraryItems(cloneTripItineraryTemplate())
                          }
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-[#6F4E37] hover:bg-amber-200 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Template
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={addItineraryRow}
                        className="inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Baris
                      </button>
                    </div>
                  </div>

                  {itineraryItems.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center pt-1"
                    >
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-neutral-400">
                          Day
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={row.day}
                          onChange={(e) =>
                            updateItineraryRow(
                              idx,
                              "day",
                              Number(e.target.value) || 1
                            )
                          }
                          className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-neutral-400">
                          Jam Mulai
                        </label>
                        <input
                          type="text"
                          value={row.startTime}
                          onChange={(e) =>
                            updateItineraryRow(idx, "startTime", e.target.value)
                          }
                          placeholder="20.00"
                          className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-neutral-400">
                          Jam Selesai
                        </label>
                        <input
                          type="text"
                          value={row.endTime}
                          onChange={(e) =>
                            updateItineraryRow(idx, "endTime", e.target.value)
                          }
                          placeholder="20.30"
                          className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="text-[10px] font-bold text-neutral-400">
                          Jenis Kegiatan
                        </label>
                        <input
                          type="text"
                          value={row.activity}
                          onChange={(e) =>
                            updateItineraryRow(idx, "activity", e.target.value)
                          }
                          placeholder="Berkumpul di Meeting Point Cawang Uki"
                          className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-1 pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItineraryRow(idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-amber-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black text-neutral-800">
                      Essential (No, Nama Barang Wajib, Kuantitas, Catatan Khusus)
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!editingId && (
                        <button
                          type="button"
                          onClick={() =>
                            setEssentialItems(cloneEssentialTemplate())
                          }
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-[#6F4E37] hover:bg-amber-200 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Template
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={addEssentialRow}
                        className="inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Tambah Barang
                      </button>
                    </div>
                  </div>

                  {essentialItems.map((row, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center pt-1"
                    >
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold text-neutral-400">
                          No
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={row.no}
                          onChange={(e) =>
                            updateEssentialRow(
                              idx,
                              "no",
                              Number(e.target.value) || idx + 1
                            )
                          }
                          className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] font-bold text-neutral-400">
                          Nama Barang Wajib
                        </label>
                        <input
                          type="text"
                          value={row.itemName}
                          onChange={(e) =>
                            updateEssentialRow(idx, "itemName", e.target.value)
                          }
                          placeholder="Tas Carrier"
                          className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-neutral-400">
                          Kuantitas
                        </label>
                        <input
                          type="text"
                          value={row.quantity}
                          onChange={(e) =>
                            updateEssentialRow(idx, "quantity", e.target.value)
                          }
                          placeholder="1 / minimal 2"
                          className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-[10px] font-bold text-neutral-400">
                          Catatan Khusus
                        </label>
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) =>
                            updateEssentialRow(idx, "note", e.target.value)
                          }
                          placeholder="Ukuran 45 - 60 L"
                          className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="col-span-1 pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeEssentialRow(idx)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-[#6F4E37]">
                  Rules & Ketentuan ({category})
                </span>
                <div className="flex items-center gap-1.5">
                  {!editingId && (
                    <button
                      type="button"
                      onClick={() => setRulesItems(cloneRulesTemplate(category))}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-[#6F4E37] hover:bg-amber-200 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Template
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addRuleRow}
                    className="inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full bg-[#6F4E37] text-white cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah Aturan
                  </button>
                </div>
              </div>

              {rulesItems.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center pt-1"
                >
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-neutral-400">
                      No
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.no}
                      onChange={(e) =>
                        updateRuleRow(
                          idx,
                          "no",
                          Number(e.target.value) || idx + 1
                        )
                      }
                      className="w-full border border-neutral-300 rounded-lg px-2 py-1.5 text-xs bg-white"
                    />
                  </div>
                  <div className="col-span-9">
                    <label className="text-[10px] font-bold text-neutral-400">
                      Isi Aturan / Ketentuan
                    </label>
                    <input
                      type="text"
                      value={item.rule}
                      onChange={(e) =>
                        updateRuleRow(idx, "rule", e.target.value)
                      }
                      placeholder="Tulis aturan / ketentuan..."
                      className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
                    />
                  </div>
                  <div className="col-span-1 pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRuleRow(idx)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="px-6 py-2 rounded-full text-xs font-black bg-[#6F4E37] hover:bg-[#5a3e2b] text-white cursor-pointer"
              >
                {savingProduct ? "Menyimpan..." : "Simpan Paket"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeCropImage && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[28px] max-w-2xl w-full p-6 shadow-2xl border border-black/10 space-y-5 my-8">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-[#6F4E37]">
                  <Crop className="w-3 h-3" /> Cropper Foto ({cropQueue.length}{" "}
                  tersisa)
                </span>
                <h3 className="text-base font-black text-neutral-950 mt-1">
                  Sesuaikan Framing Foto{" "}
                  {cropTarget === "COVER"
                    ? "Produk / Card"
                    : "Dokumentasi Detail"}
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {activeCropPresetObj.layoutHint}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelCropQueue}
                className="p-1.5 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CROP_PRESETS.map((preset) => {
                const active = cropPreset === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setCropPreset(preset.key)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-black transition cursor-pointer ${
                      active
                        ? "bg-neutral-950 text-white shadow-2xs"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl bg-neutral-950/95 p-4 flex items-center justify-center min-h-[250px] max-h-[340px] overflow-hidden">
              <div
                style={{
                  aspectRatio:
                    activeCropPresetObj.ratio !== null
                      ? String(activeCropPresetObj.ratio)
                      : "4 / 3",
                }}
                className="relative h-56 max-w-full rounded-xl overflow-hidden border-2 border-amber-400/80 shadow-lg bg-neutral-900 flex items-center justify-center"
              >
                <img
                  src={activeCropImage}
                  alt="Preview Crop"
                  style={{
                    transform: `translate(${cropOffsetX * 0.45}%, ${
                      cropOffsetY * 0.45
                    }%) scale(${cropZoom})`,
                  }}
                  className="w-full h-full object-contain transition-transform duration-100 select-none"
                />
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-r border-b border-white/60" />
                  <div className="border-b border-white/60" />
                  <div className="border-r border-white/60" />
                  <div className="border-r border-white/60" />
                  <div />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200/80">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5 text-[#6F4E37]" /> Zoom
                  </span>
                  <span>{cropZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.1}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="w-full accent-[#6F4E37] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    <Move className="w-3.5 h-3.5 text-[#6F4E37]" /> Geser X
                  </span>
                  <span>{cropOffsetX}%</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={cropOffsetX}
                  onChange={(e) => setCropOffsetX(Number(e.target.value))}
                  className="w-full accent-[#6F4E37] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                  <span className="inline-flex items-center gap-1">
                    <Move className="w-3.5 h-3.5 text-[#6F4E37]" /> Geser Y
                  </span>
                  <span>{cropOffsetY}%</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={cropOffsetY}
                  onChange={(e) => setCropOffsetY(Number(e.target.value))}
                  className="w-full accent-[#6F4E37] cursor-pointer"
                />
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
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkipCropCurrent}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 cursor-pointer"
                >
                  Pakai Asli
                </button>
                <button
                  type="button"
                  disabled={applyingCrop}
                  onClick={handleApplyCrop}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-black bg-neutral-950 hover:bg-[#6F4E37] text-white cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">Bukti Transfer Customer</h3>
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
              className="w-full max-h-[70vh] object-contain rounded-2xl bg-neutral-100 p-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}
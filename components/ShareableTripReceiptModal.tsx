"use client";

import { useState } from "react";
import {
  X,
  Download,
  Mountain,
  Compass,
  Tent,
  Receipt,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Rotate3d,
  ShoppingBag,
} from "lucide-react";

export interface ReceiptOrderLineItem {
  title: string;
  category?: string;
  quantity: number;
  unitLabel?: string;
  price: number;
  schedule?: string;
}

export interface TripReceiptData {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  price: number;
  location?: string;
  elevation?: string;
  duration?: string;
  selectedDate: string;
  quotaLeft?: number;
  meetingPoints?: string[];
  shareUrl?: string;
  // Daftar seluruh item orderan (Open Trip, Outbound, Rental Gear, atau gabungan)
  orderItems?: ReceiptOrderLineItem[];
  orderCode?: string;
}

interface ShareableTripReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripReceiptData | null;
}

function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

function getUnitLabelByCategory(category?: string): string {
  const cat = (category || "TRIP").toUpperCase();
  if (cat === "OUTBOUND") return "Hari";
  if (cat === "GEAR" || cat === "RENTAL") return "Unit";
  return "Pax";
}

function resolveReceiptBadgeMeta(trip: TripReceiptData): {
  badgeText: string;
  headerTitle: string;
  footerCta: string;
  type: "TRIP" | "OUTBOUND" | "GEAR" | "MIXED";
} {
  const categories = new Set<string>();

  if (trip.orderItems && trip.orderItems.length > 0) {
    trip.orderItems.forEach((it) => {
      const cat = (it.category || "TRIP").toUpperCase();
      if (cat === "OUTBOUND") categories.add("OUTBOUND");
      else if (cat === "GEAR" || cat === "RENTAL") categories.add("GEAR");
      else categories.add("TRIP");
    });
  } else {
    const singleCat = (trip.category || "TRIP").toUpperCase();
    if (singleCat === "OUTBOUND") categories.add("OUTBOUND");
    else if (singleCat === "GEAR" || singleCat === "RENTAL")
      categories.add("GEAR");
    else categories.add("TRIP");
  }

  if (categories.size > 1) {
    return {
      badgeText: "ORDER PASS",
      headerTitle: trip.orderCode
        ? `Struk Pesanan ${trip.orderCode}`
        : trip.title,
      footerCta: "Terima kasih telah berpetualang bersama kami!",
      type: "MIXED",
    };
  }

  const only = Array.from(categories)[0];
  if (only === "OUTBOUND") {
    return {
      badgeText: "OUTBOUND PASS",
      headerTitle: trip.title,
      footerCta: "Siap seru-seruan bareng tim!",
      type: "OUTBOUND",
    };
  }
  if (only === "GEAR") {
    return {
      badgeText: "RENTAL GEAR PASS",
      headerTitle: trip.title,
      footerCta: "Perlengkapan siap menemani perjalananmu!",
      type: "GEAR",
    };
  }

  return {
    badgeText: "OPEN TRIP PASS",
    headerTitle: trip.title,
    footerCta: "Ajak temanmu join!",
    type: "TRIP",
  };
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function generateReceiptJpgDataUrl(trip: TripReceiptData): Promise<string> {
  const meta = resolveReceiptBadgeMeta(trip);
  const items = trip.orderItems || [];
  const extraItemsHeight = items.length > 0 ? items.length * 52 + 44 : 0;

  const width = 900;
  const height = 1140 + extraItemsHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background luar iOS soft warm stone
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#F3EFEA");
  bgGrad.addColorStop(1, "#E7DFD5");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Dekorasi glow lembut
  ctx.fillStyle = "rgba(111, 78, 55, 0.08)";
  ctx.beginPath();
  ctx.arc(140, 160, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
  ctx.beginPath();
  ctx.arc(780, height - 160, 240, 0, Math.PI * 2);
  ctx.fill();

  // Kartu Receipt utama (iOS elevated card)
  const cardX = 68;
  const cardY = 68;
  const cardW = width - 136;
  const cardH = height - 136;

  ctx.save();
  ctx.shadowColor = "rgba(24, 24, 27, 0.14)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 16;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 40);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  // Header gelap iOS widget style di bagian atas kartu
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, 205, 40);
  ctx.clip();
  const topGrad = ctx.createLinearGradient(
    cardX,
    cardY,
    cardX + cardW,
    cardY + 205
  );
  topGrad.addColorStop(0, "#1C1917");
  topGrad.addColorStop(1, "#4A3222");
  ctx.fillStyle = topGrad;
  ctx.fillRect(cardX, cardY, cardW, 205);
  ctx.restore();

  // Pill badge dinamis sesuai kategori orderan
  ctx.font =
    "800 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const badgeTextW = ctx.measureText(meta.badgeText).width;
  drawRoundedRect(ctx, cardX + 44, cardY + 36, badgeTextW + 44, 40, 20);
  ctx.fillStyle = "rgba(251, 191, 36, 0.2)";
  ctx.fill();
  ctx.fillStyle = "#FBBF24";
  ctx.fillText(meta.badgeText, cardX + 66, cardY + 62);

  // Brand nama
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font =
    "700 19px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("ALAM MEMANGGIL", cardX + cardW - 44, cardY + 62);
  ctx.textAlign = "left";

  // Judul Utama di Header
  ctx.fillStyle = "#FFFFFF";
  ctx.font =
    "900 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const titleLines = wrapCanvasText(ctx, meta.headerTitle, cardW - 88).slice(
    0,
    2
  );
  titleLines.forEach((line, i) => {
    ctx.fillText(line, cardX + 44, cardY + 124 + i * 44);
  });

  // Garis perforasi putus-putus ala struk/tiket
  const perfY = cardY + 240;
  ctx.save();
  ctx.setLineDash([12, 12]);
  ctx.strokeStyle = "#D6D3D1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cardX + 36, perfY);
  ctx.lineTo(cardX + cardW - 36, perfY);
  ctx.stroke();
  ctx.restore();

  // Nok tengah perforasi kiri & kanan
  ctx.fillStyle = "#ECE6DF";
  ctx.beginPath();
  ctx.arc(cardX, perfY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cardX + cardW, perfY, 22, 0, Math.PI * 2);
  ctx.fill();

  let cursorY = perfY + 56;
  const labelStyle =
    "700 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const valueStyle =
    "800 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  // Rincian Item Pesanan (jika berasal dari Orderan)
  if (items.length > 0) {
    ctx.fillStyle = "#78716C";
    ctx.font = labelStyle;
    ctx.fillText("RINCIAN PESANAN", cardX + 44, cursorY);
    cursorY += 36;

    items.forEach((item) => {
      const unit = item.unitLabel || getUnitLabelByCategory(item.category);
      const itemTitle = `${item.title} (${item.quantity} ${unit})`;
      const itemSubtotal = formatRupiah(item.price * item.quantity);

      ctx.fillStyle = "#18181B";
      ctx.font =
        "800 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      ctx.fillText(itemTitle, cardX + 44, cursorY);

      ctx.textAlign = "right";
      ctx.fillStyle = "#44403C";
      ctx.fillText(itemSubtotal, cardX + cardW - 44, cursorY);
      ctx.textAlign = "left";

      cursorY += 48;
    });

    // Garis pemisah tipis setelah daftar item
    ctx.strokeStyle = "#E7E5E4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 44, cursorY - 14);
    ctx.lineTo(cardX + cardW - 44, cursorY - 14);
    ctx.stroke();
    cursorY += 22;
  }

  const drawField = (label: string, value: string, highlight = false) => {
    ctx.fillStyle = "#78716C";
    ctx.font = labelStyle;
    ctx.fillText(label.toUpperCase(), cardX + 44, cursorY);

    ctx.fillStyle = highlight ? "#6F4E37" : "#18181B";
    ctx.font = valueStyle;
    const lines = wrapCanvasText(ctx, value || "-", cardW - 88);
    lines.forEach((line, idx) => {
      ctx.fillText(line, cardX + 44, cursorY + 34 + idx * 34);
    });

    cursorY += 46 + lines.length * 34;
  };

  drawField("Jadwal & Status", trip.selectedDate || "Jadwal Terkonfirmasi", true);

  const mpText =
    trip.meetingPoints && trip.meetingPoints.length > 0
      ? trip.meetingPoints.filter(Boolean).join(" • ")
      : "Sesuai Info Pesanan";
  drawField("Informasi & Pengirim", mpText);

  const quotaText =
    typeof trip.quotaLeft === "number" && trip.quotaLeft > 0
      ? `Tersisa ${trip.quotaLeft} Slot`
      : "Terverifikasi";
  drawField("Status Pesanan", quotaText, true);

  // Kotak Harga / Total ala struk
  const priceBoxY = cursorY + 8;
  drawRoundedRect(ctx, cardX + 44, priceBoxY, cardW - 88, 124, 24);
  ctx.fillStyle = "#FAF7F2";
  ctx.fill();
  ctx.strokeStyle = "#E7E5E4";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#78716C";
  ctx.font =
    "700 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText("TOTAL PEMBAYARAN", cardX + 72, priceBoxY + 42);

  ctx.fillStyle = "#15803D";
  ctx.font =
    "900 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(formatRupiah(trip.price), cardX + 72, priceBoxY + 94);

  // Footer caption ajakan
  const footerY = cardY + cardH - 64;
  ctx.fillStyle = "#18181B";
  ctx.font =
    "800 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillText(meta.footerCta, cardX + 44, footerY);

  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function ShareableTripReceiptModal({
  isOpen,
  onClose,
  trip,
}: ShareableTripReceiptModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 20 });
  const [spin360, setSpin360] = useState(false);

  if (!isOpen || !trip) return null;

  const meta = resolveReceiptBadgeMeta(trip);
  const orderItems = trip.orderItems || [];

  const mpLabel =
    trip.meetingPoints && trip.meetingPoints.length > 0
      ? trip.meetingPoints.filter(Boolean).join(", ")
      : "Sesuai info pesanan";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (spin360) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const ry = (x - 0.5) * 26;
    const rx = (0.5 - y) * 22;
    setTilt({
      rx,
      ry,
      gx: Math.round(x * 100),
      gy: Math.round(y * 100),
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 20 });
  };

  const handleToggle360 = () => {
    setSpin360((prev) => !prev);
  };

  const handleDownloadJpg = async () => {
    setDownloading(true);
    try {
      const jpgDataUrl = await generateReceiptJpgDataUrl(trip);
      if (!jpgDataUrl) return;
      const safeSlug = (trip.slug || trip.orderCode || trip.title || "receipt")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const link = document.createElement("a");
      link.href = jpgDataUrl;
      link.download = `receipt-${safeSlug}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  const renderPassIcon = () => {
    if (meta.type === "OUTBOUND") return <Compass className="w-3 h-3" />;
    if (meta.type === "GEAR") return <Tent className="w-3 h-3" />;
    if (meta.type === "MIXED") return <Receipt className="w-3 h-3" />;
    return <Mountain className="w-3 h-3" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#F5F2EE] rounded-[32px] max-w-md w-full p-5 sm:p-6 shadow-2xl border border-white/80 space-y-5 my-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-2xl bg-[#1C1917] text-amber-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-neutral-900">
                Digital Order Receipt
              </h3>
              <p className="text-[11px] text-neutral-500">
                Gerakkan kursor / klik 360° untuk lihat efek 3D
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggle360}
              title="Putar 360° 3D"
              className={`inline-flex items-center gap-1 px-2.5 h-8 rounded-full text-[11px] font-black transition cursor-pointer ${
                spin360
                  ? "bg-[#1C1917] text-amber-400"
                  : "bg-white/90 hover:bg-white text-neutral-800 border border-neutral-200"
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>360°</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-700 flex items-center justify-center shadow-2xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D / 360° iOS Receipt Card Preview */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ perspective: "1200px" }}
          className="py-1"
        >
          <div
            style={{
              transformStyle: "preserve-3d",
              transform: spin360
                ? "rotateY(360deg) rotateX(6deg)"
                : `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: spin360
                ? "transform 1.1s cubic-bezier(0.22, 1, 0.36, 1)"
                : "transform 140ms ease-out",
            }}
            className="relative bg-white rounded-[28px] shadow-[0_22px_45px_rgba(24,24,27,0.18)] border border-white overflow-hidden"
          >
            {/* Sheen / cahaya specular 3D */}
            <div
              style={{
                background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.42), transparent 60%)`,
              }}
              className="pointer-events-none absolute inset-0 z-10"
            />

            {/* Header gelap ala iOS widget */}
            <div
              style={{ transform: "translateZ(18px)" }}
              className="bg-gradient-to-br from-[#1C1917] via-[#2E2118] to-[#573A26] px-5 py-4 text-white"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/20">
                  {renderPassIcon()} {meta.badgeText}
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-white/70">
                  Alam Memanggil
                </span>
              </div>
              <h4 className="text-base font-black leading-snug">
                {meta.headerTitle}
              </h4>
            </div>

            {/* Garis perforasi receipt */}
            <div className="relative flex items-center px-4 py-1 bg-white">
              <span className="w-4 h-4 rounded-full bg-[#F5F2EE] -ml-6 shrink-0" />
              <div className="flex-1 border-b-2 border-dashed border-neutral-200" />
              <span className="w-4 h-4 rounded-full bg-[#F5F2EE] -mr-6 shrink-0" />
            </div>

            {/* Detail Struk */}
            <div
              style={{ transform: "translateZ(12px)" }}
              className="px-5 py-4 space-y-3 text-xs"
            >
              {/* Rincian seluruh item orderan (Open Trip / Outbound / Gear / Gabungan) */}
              {orderItems.length > 0 && (
                <div className="space-y-1.5 pb-2.5 border-b border-dashed border-neutral-200">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    <ShoppingBag className="w-3 h-3 text-[#6F4E37]" /> Rincian
                    Pesanan
                  </p>
                  {orderItems.map((item, idx) => {
                    const unit =
                      item.unitLabel || getUnitLabelByCategory(item.category);
                    return (
                      <div
                        key={`${item.title}-${idx}`}
                        className="flex items-start justify-between gap-2 text-xs"
                      >
                        <span className="font-bold text-neutral-900">
                          {item.title}{" "}
                          <span className="text-neutral-500 font-semibold">
                            ({item.quantity} {unit})
                          </span>
                        </span>
                        <span className="font-black text-neutral-800 shrink-0">
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-neutral-500 font-semibold shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#6F4E37]" /> Jadwal
                </span>
                <span className="font-black text-neutral-900 text-right">
                  {trip.selectedDate || "Jadwal Terkonfirmasi"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-neutral-500 font-semibold shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#6F4E37]" /> Detail
                </span>
                <span className="font-bold text-neutral-800 text-right">
                  {mpLabel}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-neutral-500 font-semibold shrink-0">
                  <Users className="w-3.5 h-3.5 text-[#6F4E37]" /> Status
                </span>
                <span className="font-bold text-emerald-700 text-right">
                  {typeof trip.quotaLeft === "number" && trip.quotaLeft > 0
                    ? `Sisa ${trip.quotaLeft} slot`
                    : "Terverifikasi"}
                </span>
              </div>

              <div className="mt-2 pt-3 border-t border-neutral-100 bg-[#FAF7F2] -mx-5 px-5 py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Total Pembayaran
                  </p>
                  <p className="text-base font-black text-emerald-700">
                    {formatRupiah(trip.price)}
                  </p>
                </div>
                <span className="text-[11px] font-extrabold text-[#6F4E37] bg-amber-100/90 px-3 py-1 rounded-full text-right">
                  {meta.footerCta}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Unduh JPG */}
        <button
          type="button"
          disabled={downloading}
          onClick={handleDownloadJpg}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#1C1917] hover:bg-neutral-800 text-white font-black py-3 rounded-2xl text-xs shadow-md transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>{downloading ? "Menyiapkan JPG..." : "Unduh Receipt (JPG)"}</span>
        </button>
      </div>
    </div>
  );
}
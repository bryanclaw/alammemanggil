"use client";

import { useState } from "react";
import {
  Clock,
  Loader2,
  CheckCircle2,
  Ban,
  MessageCircle,
  Pencil,
  Upload,
  X,
} from "lucide-react";

export interface CustomerOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    category: string;
    image?: string;
  };
}

export interface CustomerOrder {
  id: string;
  totalAmount: number;
  status: "WAITING_CONFIRMATION" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  senderName?: string | null;
  bankName?: string | null;
  paymentProof?: string | null;
  notes?: string | null;
  createdAt: string;
  items: CustomerOrderItem[];
}

interface CustomerOrdersSectionProps {
  orders: CustomerOrder[];
  waAdminNumber?: string;
  onRefresh?: () => void;
}

function extractSchedule(notes?: string | null): string {
  if (!notes) return "-";
  const match = notes.match(/Jadwal\s*:\s*([^\n|]+)/i);
  return match?.[1]?.trim() || "-";
}

export default function CustomerOrdersSection({
  orders,
  waAdminNumber = "6281292548524",
  onRefresh,
}: CustomerOrdersSectionProps) {
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [senderName, setSenderName] = useState("");
  const [bankName, setBankName] = useState("BCA");
  const [notes, setNotes] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const openReuploadModal = (order: CustomerOrder) => {
    setEditingOrder(order);
    setSenderName(order.senderName || "");
    setBankName(order.bankName || "BCA");
    setNotes("");
    setPaymentProof(order.paymentProof || "");
    setFileName("");
    setErrorMsg(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal 4MB.");
      return;
    }
    setErrorMsg(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPaymentProof(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSaveReupload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!paymentProof) {
      setErrorMsg("Silakan upload bukti transfer baru.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: editingOrder.id,
          senderName,
          bankName,
          paymentProof,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || "Gagal memperbarui bukti transfer.");
        setSaving(false);
        return;
      }

      setEditingOrder(null);
      onRefresh?.();
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  const buildWaAdminLink = (order: CustomerOrder) => {
    const cleanPhone = (waAdminNumber || "6281292548524").replace(/\D/g, "");
    const itemLines = order.items
      .map((it) => {
        const unitLabel = it.product.category === "OUTBOUND" ? "Hari" : "Pax";
        return `- ${it.product.title} (${it.quantity} ${unitLabel}) : ${formatRupiah(
          it.price * it.quantity
        )}`;
      })
      .join("\n");

    const scheduleInfo = extractSchedule(order.notes);
    const rulesAgreedInfo = /Persetujuan Rules\s*:\s*DISETUJUI/i.test(
      order.notes || ""
    )
      ? "Sudah Disetujui"
      : "Tercatat";

    const message = [
      `Halo Admin Alam Memanggil, pembayaran pesanan saya sudah dikonfirmasi sesuai:`,
      ``,
      `ID Pesanan: #${order.id.slice(-6).toUpperCase()}`,
      `Nama Pengirim: ${order.senderName || "-"} (${order.bankName || "-"})`,
      `Jadwal: ${scheduleInfo}`,
      `Detail Item:\n${itemLines}`,
      `Total Pembayaran: ${formatRupiah(order.totalAmount)}`,
      `Persetujuan Rules: ${rulesAgreedInfo}`,
      ``,
      `Mohon informasi koordinasi selanjutnya ya Min. Terima kasih!`,
    ].join("\n");

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-neutral-200 p-10 text-center text-xs text-neutral-500">
        Belum ada pesanan yang tercatat.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const isConfirmedByAdmin =
          order.status === "PROCESSING" || order.status === "COMPLETED";

        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black text-neutral-900">
                  Pesanan #{order.id.slice(-6).toUpperCase()}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Pengirim: <strong>{order.senderName || "-"}</strong> •{" "}
                  {order.bankName || "-"}
                </p>
              </div>

              {order.status === "WAITING_CONFIRMATION" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  <Clock className="w-3.5 h-3.5" /> Menunggu Konfirmasi
                </span>
              )}
              {order.status === "PROCESSING" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                  <Loader2 className="w-3.5 h-3.5" /> Dikonfirmasi • Diproses
                </span>
              )}
              {order.status === "COMPLETED" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dikonfirmasi • Selesai
                </span>
              )}
              {order.status === "CANCELLED" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                  <Ban className="w-3.5 h-3.5" /> Dibatalkan Admin
                </span>
              )}
            </div>

            <div className="space-y-1.5 border-t border-neutral-100 pt-3 text-xs">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span className="font-bold text-neutral-800">
                    {it.product.title} × {it.quantity}{" "}
                    {it.product.category === "OUTBOUND" ? "Hari" : "Pax"}
                  </span>
                  <span className="font-bold text-neutral-900">
                    {formatRupiah(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {order.notes && (
              <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-3 text-[11px] text-neutral-600 whitespace-pre-line">
                {order.notes}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dashed border-neutral-200">
              <p className="text-sm font-black text-[#6F4E37]">
                Total: {formatRupiah(order.totalAmount)}
              </p>

              <div className="flex flex-wrap gap-2">
                {order.status === "CANCELLED" && (
                  <button
                    type="button"
                    onClick={() => openReuploadModal(order)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit / Upload Ulang Bukti TF</span>
                  </button>
                )}

                {isConfirmedByAdmin && (
                  <a
                    href={buildWaAdminLink(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat WA Admin (Detail Otomatis)</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* MODAL EDIT / RE-UPLOAD BUKTI TRANSFER */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveReupload}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-black text-neutral-900">
                Upload Ulang Bukti Transfer (#
                {editingOrder.id.slice(-6).toUpperCase()})
              </h3>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1 rounded-full hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-2 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1">
                Nama Pengirim *
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Bank / E-Wallet Pengirim *
              </label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Bukti Transfer Baru *
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 hover:border-[#6F4E37] rounded-2xl p-4 cursor-pointer bg-neutral-50">
                <Upload className="w-5 h-5 text-[#6F4E37] mb-1" />
                <span className="text-xs font-bold text-neutral-700">
                  {fileName || "Pilih gambar bukti transfer baru"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {paymentProof && (
                <img
                  src={paymentProof}
                  alt="Preview Bukti TF"
                  className="mt-2 max-h-40 rounded-xl border border-neutral-200 object-contain"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                Catatan Perbaikan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sudah transfer ulang sesuai nominal"
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 rounded-full text-xs font-bold bg-neutral-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-full text-xs font-black bg-emerald-600 text-white cursor-pointer"
              >
                {saving ? "Mengirim..." : "Kirim Bukti Baru"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
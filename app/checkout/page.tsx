"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Calendar,
  ScrollText,
  UserCircle,
  AlertCircle,
  Tag,
  X,
} from "lucide-react";

interface RuleEntry {
  no: number;
  rule: string;
}

interface OutboundBookingMeta {
  startDate: string;
  endDate: string;
  days: number;
  dates: string[];
  label: string;
}

export interface RentalBookingMeta {
  productId: string;
  rentalStartDate: string;
  rentalEndDate: string;
  pickupDate: string;
  returnDate: string;
  baseNights: number;
  extraChargeNights: number;
  totalBilledNights: number;
  datesToLock: string[];
  scheduleLabel: string;
  qty?: number;
}

interface ProductMetaRules {
  rulesItems?: RuleEntry[];
  rulesText?: string;
  timeTrips?: Array<{
    id?: string;
    dateLabel: string;
    quota: number;
    sold?: boolean;
  }>;
}

interface CartItemType {
  id: string;
  paxCount: number;
  selectedSchedule?: string | null;
  product: {
    id: string;
    title: string;
    slug?: string;
    category: string;
    price: number;
    stock?: number;
    image: string;
    metaData?: ProductMetaRules | null;
  };
}

interface StoreSettingType {
  storeName: string;
  waAdminNumber: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface CustomerProfileSummary {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface AppliedDiscountData {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minPurchase: number;
  discountAmount: number;
  finalAmount: number;
}

const DEFAULT_SETTING: StoreSettingType = {
  storeName: "Alam Memanggil",
  waAdminNumber: "6281292548524",
  bankName: "Bank Central Asia (BCA)",
  accountNumber: "7445357324",
  accountHolder: "Dimas Alifio",
};

async function safeParseJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getRulesForProduct(product: CartItemType["product"]): string[] {
  const meta = product.metaData;
  if (meta?.rulesItems && meta.rulesItems.length > 0) {
    return meta.rulesItems
      .map((r) => String(r.rule || "").trim())
      .filter(Boolean);
  }
  if (meta?.rulesText) {
    return meta.rulesText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
  }
  return [
    `Peserta/pemesan wajib mematuhi seluruh ketentuan pelaksanaan ${product.title} dan instruksi tim lapangan Alam Memanggil.`,
  ];
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [setting, setSetting] = useState<StoreSettingType>(DEFAULT_SETTING);
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [senderName, setSenderName] = useState("");
  const [bankName, setBankName] = useState("BCA");
  const [notes, setNotes] = useState("");
  const [paymentProof, setPaymentProof] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const [discountInput, setDiscountInput] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountFeedback, setDiscountFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [appliedDiscount, setAppliedDiscount] =
    useState<AppliedDiscountData | null>(null);

  const [agreedProductIds, setAgreedProductIds] = useState<
    Record<string, boolean>
  >({});

  const [outboundDaysByKey, setOutboundDaysByKey] = useState<
    Record<string, number>
  >({});
  const [rentalBookingsByKey, setRentalBookingsByKey] = useState<
    Record<string, RentalBookingMeta>
  >({});
  const [scheduleByKey, setScheduleByKey] = useState<Record<string, string>>(
    {}
  );

  const syncLocalBookingMeta = (cartItems: CartItemType[]) => {
    let savedOutbound: Record<string, OutboundBookingMeta> = {};
    let savedRental: Record<string, RentalBookingMeta> = {};
    let savedSchedules: Record<string, { dateLabel?: string } | string> = {};

    try {
      const rawOb = localStorage.getItem("alam_memanggil_outbound_bookings");
      savedOutbound = rawOb ? JSON.parse(rawOb) : {};
    } catch {
      savedOutbound = {};
    }

    try {
      const rawRent = localStorage.getItem("alam_memanggil_rental_bookings");
      savedRental = rawRent ? JSON.parse(rawRent) : {};
    } catch {
      savedRental = {};
    }

    try {
      const rawSched = localStorage.getItem("alam_memanggil_selected_schedules");
      savedSchedules = rawSched ? JSON.parse(rawSched) : {};
    } catch {
      savedSchedules = {};
    }

    const nextDays: Record<string, number> = {};
    const nextRental: Record<string, RentalBookingMeta> = {};
    const nextSched: Record<string, string> = {};

    for (const item of cartItems) {
      const key = item.product.slug || item.product.id;

      if (item.product.category === "OUTBOUND") {
        const ob = savedOutbound[key] || savedOutbound[item.product.id];
        const daysVal = Math.max(1, Number(ob?.days || 1));
        nextDays[key] = daysVal;
        nextDays[item.product.id] = daysVal;

        const sc =
          item.selectedSchedule ||
          savedSchedules[key] ||
          savedSchedules[item.product.id];
        const label =
          typeof sc === "string"
            ? sc
            : sc?.dateLabel || ob?.label || `${daysVal} Hari`;
        nextSched[key] = label;
        nextSched[item.product.id] = label;
      } else if (item.product.category === "RENTAL") {
        const rent = savedRental[key] || savedRental[item.product.id];
        const itemQty = Math.max(1, Number(rent?.qty || item.paxCount || 1));
        if (rent) {
          const nights = Math.max(1, Number(rent.totalBilledNights || 1));
          const label =
            rent.scheduleLabel ||
            (rent.rentalStartDate && rent.rentalEndDate
              ? `Rental ${rent.rentalStartDate} s/d ${rent.rentalEndDate} (${nights} mlm, ${itemQty} item) | Ambil: ${rent.pickupDate || "-"} | Kembali: ${rent.returnDate || "-"}`
              : `Rental ${nights} Malam (${itemQty} Item)`);
          const normalizedRent: RentalBookingMeta = {
            ...rent,
            productId: item.product.id,
            qty: itemQty,
            totalBilledNights: nights,
            scheduleLabel: label,
          };
          nextRental[key] = normalizedRent;
          nextRental[item.product.id] = normalizedRent;
          nextSched[key] = label;
          nextSched[item.product.id] = label;
        } else {
          const sc =
            item.selectedSchedule ||
            savedSchedules[key] ||
            savedSchedules[item.product.id];
          const label =
            typeof sc === "string" && sc.trim()
              ? sc.trim()
              : sc && typeof sc === "object" && sc.dateLabel
              ? sc.dateLabel
              : `Rental ${itemQty} Item`;
          nextSched[key] = label;
          nextSched[item.product.id] = label;
        }
      } else {
        const sc =
          item.selectedSchedule ||
          savedSchedules[key] ||
          savedSchedules[item.product.id];
        const label = typeof sc === "string" ? sc : sc?.dateLabel || "";
        if (label) {
          nextSched[key] = label;
          nextSched[item.product.id] = label;
        }
      }
    }

    setOutboundDaysByKey(nextDays);
    setRentalBookingsByKey(nextRental);
    setScheduleByKey(nextSched);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cartRes, profileRes] = await Promise.all([
          fetch("/api/cart", { cache: "no-store" }),
          fetch("/api/profile", { cache: "no-store" }),
        ]);

        const cartData = await safeParseJson<{ items?: CartItemType[] }>(
          cartRes
        );
        const profileData = await safeParseJson<{
          user?: CustomerProfileSummary;
        }>(profileRes);

        const loadedItems: CartItemType[] = cartData?.items || [];
        setItems(loadedItems);
        syncLocalBookingMeta(loadedItems);

        if (profileData?.user) {
          setCustomerProfile(profileData.user);
        }

        let loadedSetting: StoreSettingType | null = null;
        try {
          const pubSetRes = await fetch("/api/settings", { cache: "no-store" });
          const pubSetData = await safeParseJson<{
            setting?: Partial<StoreSettingType>;
          }>(pubSetRes);
          if (pubSetData?.setting) {
            loadedSetting = { ...DEFAULT_SETTING, ...pubSetData.setting };
          }
        } catch {
          // abaikan
        }

        if (!loadedSetting) {
          try {
            const admSetRes = await fetch("/api/admin/settings", {
              cache: "no-store",
            });
            const admSetData = await safeParseJson<{
              setting?: Partial<StoreSettingType>;
            }>(admSetRes);
            if (admSetData?.setting) {
              loadedSetting = { ...DEFAULT_SETTING, ...admSetData.setting };
            }
          } catch {
            // abaikan
          }
        }

        if (loadedSetting) {
          setSetting(loadedSetting);
        }
      } catch (err) {
        console.error("Gagal memuat data checkout:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const missingProfileFields = useMemo(() => {
    const missing: string[] = [];
    if (!customerProfile?.name?.trim()) missing.push("Nama Lengkap");
    if (!customerProfile?.phone?.trim()) missing.push("Nomor WhatsApp / HP");
    return missing;
  }, [customerProfile]);

  const isProfileComplete = missingProfileFields.length === 0;

  const allRulesAgreed = useMemo(() => {
    if (items.length === 0) return false;
    return items.every((item) => Boolean(agreedProductIds[item.id]));
  }, [items, agreedProductIds]);

  const canSubmitCheckout = isProfileComplete && allRulesAgreed && !submitting;

  const toggleAllRules = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    for (const item of items) {
      next[item.id] = checked;
    }
    setAgreedProductIds(next);
  };

  const getRentalQty = useCallback(
    (item: CartItemType) => {
      const key = item.product.slug || item.product.id;
      const rent =
        rentalBookingsByKey[key] || rentalBookingsByKey[item.product.id];
      return Math.max(1, Number(rent?.qty || item.paxCount || 1));
    },
    [rentalBookingsByKey]
  );

  const getRentalNights = useCallback(
    (item: CartItemType) => {
      const key = item.product.slug || item.product.id;
      const rent =
        rentalBookingsByKey[key] || rentalBookingsByKey[item.product.id];
      if (rent?.totalBilledNights) {
        return Math.max(1, Number(rent.totalBilledNights));
      }
      const schedStr =
        scheduleByKey[key] ||
        scheduleByKey[item.product.id] ||
        item.selectedSchedule ||
        "";
      const mlmMatch = schedStr.match(/(\d+)\s*(?:mlm|malam)/i);
      if (mlmMatch?.[1]) {
        return Math.max(1, Number(mlmMatch[1]));
      }
      return 1;
    },
    [rentalBookingsByKey, scheduleByKey]
  );

  const getItemMultiplier = useCallback(
    (item: CartItemType) => {
      const key = item.product.slug || item.product.id;
      if (item.product.category === "OUTBOUND") {
        return Math.max(
          1,
          outboundDaysByKey[key] || outboundDaysByKey[item.product.id] || 1
        );
      }
      if (item.product.category === "RENTAL") {
        return getRentalNights(item) * getRentalQty(item);
      }
      return Math.max(1, item.paxCount);
    },
    [outboundDaysByKey, getRentalNights, getRentalQty]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg("Ukuran file bukti transfer maksimal 4MB.");
      return;
    }

    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProof(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const subtotalAmount = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.product.price * getItemMultiplier(item),
        0
      ),
    [items, getItemMultiplier]
  );

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.discountType === "PERCENTAGE") {
      const pct = Math.max(0, Math.min(100, appliedDiscount.discountValue));
      return Math.min(
        subtotalAmount,
        Math.round((subtotalAmount * pct) / 100)
      );
    }
    return Math.min(
      subtotalAmount,
      Math.max(0, Math.round(appliedDiscount.discountValue))
    );
  }, [appliedDiscount, subtotalAmount]);

  const totalAmount = Math.max(0, subtotalAmount - discountAmount);

  useEffect(() => {
    if (appliedDiscount && subtotalAmount < appliedDiscount.minPurchase) {
      setAppliedDiscount(null);
      setDiscountFeedback({
        type: "error",
        text: `Kode ${appliedDiscount.code} dilepas karena subtotal kurang dari minimal transaksi.`,
      });
    }
  }, [appliedDiscount, subtotalAmount]);

  const handleApplyDiscount = async () => {
    const cleanCode = discountInput.trim().toUpperCase();
    if (!cleanCode) {
      setDiscountFeedback({
        type: "error",
        text: "Masukkan kode diskon terlebih dahulu.",
      });
      return;
    }

    setApplyingDiscount(true);
    setDiscountFeedback(null);

    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          subtotal: subtotalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.discount) {
        setAppliedDiscount(null);
        setDiscountFeedback({
          type: "error",
          text: data?.message || "Kode diskon tidak valid.",
        });
        return;
      }

      setAppliedDiscount(data.discount);
      setDiscountInput(data.discount.code);
      setDiscountFeedback({
        type: "success",
        text: data.message || `Kode diskon ${data.discount.code} diterapkan!`,
      });
    } catch {
      setDiscountFeedback({
        type: "error",
        text: "Gagal memvalidasi kode diskon.",
      });
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountFeedback(null);
  };

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isProfileComplete) {
      setErrorMsg(
        `Silakan lengkapi Informasi Profil terlebih dahulu (${missingProfileFields.join(
          ", "
        )}) agar admin dapat menghubungi Anda saat cek pesanan.`
      );
      return;
    }

    if (!allRulesAgreed) {
      setErrorMsg(
        "Anda wajib membaca dan menyetujui seluruh rules paket yang dipesan sebelum melanjutkan pembayaran."
      );
      return;
    }

    if (!senderName.trim() || !bankName.trim()) {
      setErrorMsg("Nama pengirim dan bank pengirim wajib diisi.");
      return;
    }

    if (!paymentProof) {
      setErrorMsg(
        "Silakan upload foto/screenshot bukti transfer terlebih dahulu."
      );
      return;
    }

    const selectedSchedules: Record<string, string> = { ...scheduleByKey };
    try {
      const raw = localStorage.getItem("alam_memanggil_selected_schedules");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<
          string,
          { dateLabel?: string } | string
        >;
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === "string" && v.trim()) {
            selectedSchedules[k] = v.trim();
          } else if (v && typeof v === "object" && v.dateLabel?.trim()) {
            selectedSchedules[k] = v.dateLabel.trim();
          }
        }
      }
    } catch {
      // abaikan
    }

    let outboundBookings: Record<string, OutboundBookingMeta> = {};
    try {
      const rawOb = localStorage.getItem("alam_memanggil_outbound_bookings");
      if (rawOb) {
        outboundBookings = JSON.parse(rawOb);
      }
    } catch {
      outboundBookings = {};
    }

    const rentalBookingsList: RentalBookingMeta[] = [];
    const allScheduleNotesList: string[] = [];

    const normalizedOrderItemsPayload = items.map((item) => {
      const key = item.product.slug || item.product.id;

      if (item.product.category === "RENTAL") {
        const unitQty = getRentalQty(item);
        const nights = getRentalNights(item);
        const found =
          rentalBookingsByKey[key] || rentalBookingsByKey[item.product.id];

        const fallbackLabel =
          selectedSchedules[key] ||
          selectedSchedules[item.product.id] ||
          item.selectedSchedule ||
          `Rental ${nights} Malam (${unitQty} Item)`;

        const rentalMeta: RentalBookingMeta = found
          ? {
              ...found,
              productId: item.product.id,
              qty: unitQty,
              totalBilledNights: nights,
              scheduleLabel: found.scheduleLabel || fallbackLabel,
            }
          : {
              productId: item.product.id,
              rentalStartDate: "",
              rentalEndDate: "",
              pickupDate: "",
              returnDate: "",
              baseNights: nights,
              extraChargeNights: 0,
              totalBilledNights: nights,
              datesToLock: [],
              qty: unitQty,
              scheduleLabel: fallbackLabel,
            };

        rentalBookingsList.push(rentalMeta);
        selectedSchedules[key] = rentalMeta.scheduleLabel;
        selectedSchedules[item.product.id] = rentalMeta.scheduleLabel;
        allScheduleNotesList.push(
          `${item.product.title}: ${rentalMeta.scheduleLabel}`
        );

        return {
          productId: item.product.id,
          quantity: unitQty,
          nights,
          selectedSchedule: rentalMeta.scheduleLabel,
        };
      }

      const schedLabel =
        selectedSchedules[key] ||
        selectedSchedules[item.product.id] ||
        item.selectedSchedule ||
        "";
      if (schedLabel) {
        allScheduleNotesList.push(`${item.product.title}: ${schedLabel}`);
      }

      return {
        productId: item.product.id,
        quantity: getItemMultiplier(item),
        selectedSchedule: schedLabel || null,
      };
    });

    const agreedAt = new Date().toLocaleString("id-ID");
    const rulesSummary = items
      .map((it) => {
        const rList = getRulesForProduct(it.product);
        return `${it.product.title} (${rList.length} aturan disetujui pada ${agreedAt})`;
      })
      .join(" | ");

    const combinedNotes = [
      notes.trim(),
      allScheduleNotesList.length > 0
        ? `Jadwal: ${allScheduleNotesList.join(" | ")}`
        : "",
      `Persetujuan Rules: DISETUJUI (${rulesSummary})`,
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          bankName,
          paymentProof,
          notes: combinedNotes,
          items: normalizedOrderItemsPayload,
          selectedSchedules,
          outboundBookings,
          rentalBookings: rentalBookingsList,
          rulesAgreed: true,
          discountCode: appliedDiscount ? appliedDiscount.code : null,
        }),
      });

      const data = await safeParseJson<{ message?: string }>(res);

      if (!res.ok) {
        setErrorMsg(data?.message || "Gagal membuat pesanan.");
        setSubmitting(false);
        return;
      }

      try {
        localStorage.removeItem("alam_memanggil_selected_schedules");
        localStorage.removeItem("alam_memanggil_outbound_bookings");
        localStorage.removeItem("alam_memanggil_rental_bookings");
      } catch {
        // abaikan error storage
      }

      window.dispatchEvent(new Event("cart-updated"));
      router.push("/profile?tab=orders");
      router.refresh();
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat memproses pesanan.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-neutral-200 p-8 max-w-md w-full text-center shadow-sm">
          <h1 className="text-lg font-black text-neutral-950">
            Tidak ada item untuk di-checkout
          </h1>
          <p className="text-xs text-neutral-700 mt-1 mb-5">
            Keranjang Anda kosong. Silakan pilih paket terlebih dahulu.
          </p>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 bg-[#6F4E37] text-white text-xs font-black px-5 py-2.5 rounded-full"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Keranjang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 text-neutral-950">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-black text-neutral-900 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Keranjang
        </Link>

        <h1 className="text-2xl font-black text-neutral-950 mb-2">
          Checkout & Konfirmasi Pembayaran
        </h1>
        <p className="text-xs font-medium text-neutral-800 mb-8">
          Pastikan Informasi Profil sudah lengkap, baca & setujui seluruh rules paket, lalu unggah bukti transfer.
        </p>

        <div
          className={`rounded-3xl border p-5 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isProfileComplete
              ? "bg-emerald-50/70 border-emerald-300"
              : "bg-rose-50 border-rose-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isProfileComplete
                  ? "bg-emerald-200 text-emerald-950"
                  : "bg-rose-200 text-rose-950"
              }`}
            >
              {isProfileComplete ? (
                <UserCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-neutral-950 uppercase tracking-wider">
                {isProfileComplete
                  ? "Informasi Profil Lengkap"
                  : "Informasi Profil Belum Lengkap — Wajib Dilengkapi"}
              </p>
              {isProfileComplete ? (
                <p className="text-xs font-semibold text-neutral-800">
                  Nama: <strong>{customerProfile?.name}</strong> • No. WA/HP:{" "}
                  <strong>{customerProfile?.phone}</strong>
                </p>
              ) : (
                <p className="text-xs font-bold text-rose-950">
                  Lengkapi <strong>{missingProfileFields.join(" dan ")}</strong>{" "}
                  terlebih dahulu karena nomor telepon dibutuhkan admin saat mengecek pesanan. Anda belum bisa checkout sebelum profil terisi lengkap.
                </p>
              )}
            </div>
          </div>

          <Link
            href="/profile?tab=profile"
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-black shrink-0 transition ${
              isProfileComplete
                ? "bg-white hover:bg-neutral-100 text-neutral-950 border border-neutral-300"
                : "bg-rose-600 hover:bg-rose-700 text-white shadow"
            }`}
          >
            <UserCircle className="w-4 h-4" />
            <span>
              {isProfileComplete ? "Edit Profil" : "Lengkapi Informasi Profil"}
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleCheckoutSubmit}
            className="lg:col-span-2 bg-white rounded-3xl border border-neutral-300 p-6 shadow-sm space-y-5"
          >
            <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black text-neutral-950 uppercase tracking-wider">
                  <ScrollText className="w-4 h-4 text-[#6F4E37]" />
                  <span>Persetujuan Rules & Ketentuan Pelaksanaan (Wajib)</span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs font-black text-neutral-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allRulesAgreed}
                    onChange={(e) => toggleAllRules(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-500 text-neutral-950 focus:ring-neutral-950 cursor-pointer"
                  />
                  <span>Setujui Semua</span>
                </label>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const rulesList = getRulesForProduct(item.product);
                  const isChecked = Boolean(agreedProductIds[item.id]);

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-amber-300 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black text-neutral-950">
                          {item.product.title}{" "}
                          <span className="text-[10px] font-black text-neutral-900 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                            {item.product.category}
                          </span>
                        </p>
                        <span className="text-[11px] font-bold text-neutral-800">
                          {rulesList.length} Ketentuan
                        </span>
                      </div>

                      <ul className="space-y-1.5 pl-1 max-h-40 overflow-y-auto pr-1">
                        {rulesList.map((ruleText, rIdx) => (
                          <li
                            key={rIdx}
                            className="text-xs text-neutral-900 flex items-start gap-2 leading-relaxed"
                          >
                            <span className="font-black text-neutral-950 shrink-0">
                              {rIdx + 1}.
                            </span>
                            <span>{ruleText}</span>
                          </li>
                        ))}
                      </ul>

                      <label className="flex items-start gap-2 pt-2 border-t border-neutral-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setAgreedProductIds((prev) => ({
                              ...prev,
                              [item.id]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 w-4 h-4 rounded border-neutral-500 text-neutral-950 focus:ring-neutral-950 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-neutral-950 leading-snug">
                          Saya telah membaca dan menyetujui seluruh rules{" "}
                          <strong>{item.product.title}</strong> sebagai bukti komitmen pelaksanaan.
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-300 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-black text-neutral-950 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-[#6F4E37]" />
                <span>Rekening Tujuan Transfer</span>
              </div>
              <p className="text-sm font-black text-neutral-950">
                {setting.bankName} — {setting.accountNumber}
              </p>
              <p className="text-xs font-semibold text-neutral-900">
                Atas Nama: <strong>{setting.accountHolder}</strong>
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-300 text-red-950 text-xs font-bold px-4 py-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-neutral-950 mb-1.5">
                  Nama Pengirim di Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-950 mb-1.5">
                  Bank / E-Wallet Pengirim *
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: BCA / Mandiri / BRI / GoPay"
                  className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-neutral-950 mb-1.5">
                Upload Bukti Transfer (JPG, PNG, WEBP) *
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-400 hover:border-neutral-950 rounded-2xl p-6 cursor-pointer transition bg-neutral-50">
                <Upload className="w-7 h-7 text-neutral-950 mb-2" />
                <span className="text-xs font-black text-neutral-950">
                  {fileName
                    ? `File dipilih: ${fileName}`
                    : "Klik untuk pilih gambar bukti transfer"}
                </span>
                <span className="text-[11px] font-semibold text-neutral-700 mt-1">
                  Maksimal 4MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {paymentProof && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-neutral-900 mb-1.5">
                    Preview Bukti Transfer:
                  </p>
                  <img
                    src={paymentProof}
                    alt="Preview Bukti Transfer"
                    className="max-h-56 rounded-2xl border border-neutral-300 object-contain bg-neutral-100 p-2"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-neutral-950 mb-1.5">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Mohon konfirmasi secepatnya, terima kasih."
                className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-neutral-950"
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmitCheckout}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-black font-black py-3.5 rounded-full text-xs transition shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Mengirim Bukti & Membuat Pesanan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>
                    {!isProfileComplete
                      ? "Lengkapi Informasi Profil Dulu"
                      : !allRulesAgreed
                      ? "Setujui Semua Rules Terlebih Dahulu"
                      : "Konfirmasi Pembayaran"}
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="bg-white rounded-3xl border border-neutral-300 p-6 h-fit shadow-sm space-y-4">
            <h2 className="text-base font-black text-neutral-950">
              Ringkasan Item
            </h2>

            <div className="space-y-3 border-b border-neutral-200 pb-4">
              {items.map((item) => {
                const key = item.product.slug || item.product.id;
                const isOutbound = item.product.category === "OUTBOUND";
                const isRental = item.product.category === "RENTAL";
                const nights = getRentalNights(item);
                const unitQty = getRentalQty(item);
                const multiplier = getItemMultiplier(item);
                const sched =
                  scheduleByKey[key] ||
                  scheduleByKey[item.product.id] ||
                  item.selectedSchedule;

                const unitDesc = isOutbound
                  ? `${multiplier} Hari × ${formatRupiah(item.product.price)}`
                  : isRental
                  ? `${unitQty} Item × ${nights} Malam × ${formatRupiah(
                      item.product.price
                    )} / item`
                  : `${multiplier} Pax × ${formatRupiah(item.product.price)}`;

                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-start gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-neutral-950">
                        {item.product.title}
                      </p>
                      <p className="text-neutral-800 font-semibold text-[11px] mt-0.5">
                        {unitDesc}
                      </p>
                      {sched && (
                        <p className="inline-flex items-start gap-1 text-[11px] font-bold text-neutral-950 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#6F4E37] shrink-0 mt-0.5" />
                          <span>{sched}</span>
                        </p>
                      )}
                    </div>
                    <p className="font-black text-neutral-950 shrink-0">
                      {formatRupiah(item.product.price * multiplier)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 border-b border-neutral-200 pb-4">
              <label className="flex items-center gap-1.5 text-xs font-black text-neutral-950">
                <Tag className="w-3.5 h-3.5 text-[#6F4E37]" />
                <span>Kode Diskon</span>
              </label>

              {appliedDiscount ? (
                <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2">
                  <p className="text-xs font-black text-emerald-950">
                    {appliedDiscount.code}{" "}
                    <span className="text-[11px] font-bold">
                      (
                      {appliedDiscount.discountType === "PERCENTAGE"
                        ? `${appliedDiscount.discountValue}%`
                        : formatRupiah(appliedDiscount.discountValue)}
                      )
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveDiscount}
                    title="Hapus kode diskon"
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-emerald-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(e) =>
                      setDiscountInput(e.target.value.toUpperCase())
                    }
                    placeholder="Contoh: HEMAT5 / ALAM25K"
                    className="flex-1 bg-white border border-neutral-400 rounded-xl px-3 py-2 text-xs font-bold text-neutral-950 uppercase placeholder:normal-case placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                  />
                  <button
                    type="button"
                    disabled={applyingDiscount}
                    onClick={handleApplyDiscount}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#6F4E37] hover:bg-[#5a3e2b] text-white shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {applyingDiscount ? "..." : "Pakai"}
                  </button>
                </div>
              )}

              {discountFeedback && (
                <p
                  className={`text-[11px] font-bold ${
                    discountFeedback.type === "success"
                      ? "text-emerald-800"
                      : "text-rose-700"
                  }`}
                >
                  {discountFeedback.text}
                </p>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-neutral-800 font-semibold">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotalAmount)}</span>
              </div>

              {discountAmount > 0 && appliedDiscount && (
                <div className="flex justify-between items-center text-emerald-800 font-black">
                  <span>
                    Diskon ({appliedDiscount.code}
                    {appliedDiscount.discountType === "PERCENTAGE"
                      ? ` ${appliedDiscount.discountValue}%`
                      : ""}
                    )
                  </span>
                  <span>- {formatRupiah(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
                <span className="text-xs font-black text-neutral-950">
                  Total Bayar
                </span>
                <span className="text-lg font-black text-[#6F4E37]">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-neutral-100 p-3 rounded-2xl text-xs font-medium text-neutral-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Tanggal sewa yang dipilih akan otomatis terbooking saat checkout diproses, lalu masuk ke status{" "}
                <strong>Menunggu Konfirmasi</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
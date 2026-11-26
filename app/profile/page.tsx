"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  UserCircle,
  Bell,
  Star,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  KeyRound,
  Pencil,
  Upload,
  X,
  Ban,
  Receipt,
  Sparkles,
  Calendar,
} from "lucide-react";
import ShareableTripReceiptModal, {
  TripReceiptData,
} from "@/components/ShareableTripReceiptModal";

interface OrderItemType {
  id: string;
  productId?: string;
  quantity: number;
  price: number;
  selectedSchedule?: string | null;
  product: {
    id?: string;
    slug?: string;
    title: string;
    category: string;
  };
}

interface OrderType {
  id: string;
  totalAmount: number;
  status: "WAITING_CONFIRMATION" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  senderName?: string | null;
  bankName?: string | null;
  paymentProof?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItemType[];
}

interface NotificationType {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  kind?: "CONFIRMATION" | "REJECTED" | "COMPLETED" | "CANCELLED" | "GENERAL";
}

interface AdminIncomingNotification {
  id: string;
  type: "NEW_ORDER" | "REUPLOAD_PROOF" | "CANCELLED_BY_CUSTOMER" | "NEW_REVIEW";
  title: string;
  message: string;
  orderCode?: string;
  customerName?: string;
  isRead: boolean;
  createdAt: string;
}

interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
}

interface ReviewItemType {
  id: string;
  orderId: string;
  orderCode: string;
  rating: number;
  tags: string[];
  comment: string;
  createdAt: string;
}

type CustomerOrderFilterTab = "ALL" | "CONFIRMATION" | "COMPLETED" | "REVIEWS";

const WA_ADMIN_NUMBER = "6281292548524";
const REVIEWS_STORAGE_KEY = "alam_memanggil_customer_reviews_v1";
const REVIEWS_SYNC_EVENT = "alam_memanggil_reviews_sync_v1";
const ADMIN_NOTIFS_STORAGE_KEY = "alam_memanggil_admin_notifs_v1";
const ADMIN_NOTIFS_SYNC_EVENT = "alam_memanggil_admin_notifs_sync_v1";

const QUICK_REVIEW_TAGS = [
  "Pelayanan Ramah",
  "Rute & Jadwal Pas",
  "Peralatan Aman & Bersih",
  "Guide / Tim Komunikatif",
  "Worth It Banget",
];

function getItemUnitLabel(category?: string | null): string {
  const cat = String(category || "TRIP").toUpperCase();
  if (cat === "OUTBOUND") return "Hari";
  if (cat === "RENTAL" || cat === "GEAR") return "Item";
  return "Pax";
}

function extractScheduleFromNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const lineMatch = notes.match(/Jadwal\s*:\s*([^\n]+)/i);
  if (lineMatch?.[1]?.trim()) return lineMatch[1].trim();
  const rentalFallback = notes.match(/(Rental\s+[^\n]+)/i);
  return rentalFallback?.[1]?.trim() || null;
}

function getScheduleForOrderItem(
  item: OrderItemType,
  order: OrderType
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

function getItemSubtotal(item: OrderItemType, scheduleText: string | null): number {
  const cat = String(item.product.category || "").toUpperCase();
  if (cat === "RENTAL") {
    const mlmMatch = (scheduleText || "").match(/(\d+)\s*(?:mlm|malam)/i);
    const nights = mlmMatch?.[1] ? Math.max(1, Number(mlmMatch[1])) : 1;
    return item.price * item.quantity * nights;
  }
  return item.price * item.quantity;
}

function splitNoteLines(notes?: string | null): string[] {
  if (!notes) return [];
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isCancelledByCustomer(notes?: string | null): boolean {
  return Boolean(notes && /Dibatalkan oleh pelanggan/i.test(notes));
}

function isRejectedByAdmin(order: OrderType): boolean {
  return order.status === "CANCELLED" && !isCancelledByCustomer(order.notes);
}

function isOrderApprovedOrDone(order: OrderType): boolean {
  return order.status === "COMPLETED" || order.status === "PROCESSING";
}

function isOrderInConfirmationTab(order: OrderType): boolean {
  return order.status === "WAITING_CONFIRMATION" || isRejectedByAdmin(order);
}

function normalizeNotificationTitle(
  rawTitle: string,
  message?: string
): {
  title: string;
  kind: "CONFIRMATION" | "REJECTED" | "COMPLETED" | "CANCELLED" | "GENERAL";
} {
  const clean = (rawTitle || "").trim();
  const combined = `${clean} ${message || ""}`.toLowerCase();

  if (
    /ditolak\s*admin/i.test(combined) ||
    /pesanan\s*ditolak/i.test(combined) ||
    /bukti\s*transfer\s*belum\s*sesuai/i.test(combined)
  ) {
    return { title: "Pesanan ditolak admin", kind: "REJECTED" };
  }
  if (/pesanan\s*dibatalkan/i.test(combined)) {
    return { title: "Pesanan Dibatalkan", kind: "CANCELLED" };
  }
  if (
    /pesanan\s*selesai/i.test(combined) ||
    /pesanan\s*(di\s*proses|diproses)/i.test(combined) ||
    /dikonfirmasi/i.test(combined)
  ) {
    return { title: "Pesanan selesai", kind: "COMPLETED" };
  }
  if (
    /bukti\s*transfer\s*diterima/i.test(combined) ||
    /konfirmasi\s*pesanan/i.test(combined) ||
    /menunggu\s*persetujuan/i.test(combined)
  ) {
    return { title: "Konfirmasi pesanan", kind: "CONFIRMATION" };
  }

  return { title: clean || "Notifikasi Pesanan", kind: "GENERAL" };
}

function pushAdminNotification(
  item: Omit<AdminIncomingNotification, "id" | "isRead" | "createdAt">
) {
  try {
    const raw = localStorage.getItem(ADMIN_NOTIFS_STORAGE_KEY);
    const existing: AdminIncomingNotification[] = raw ? JSON.parse(raw) : [];
    const nextItem: AdminIncomingNotification = {
      ...item,
      id: `adm-notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [nextItem, ...(Array.isArray(existing) ? existing : [])].slice(
      0,
      60
    );
    localStorage.setItem(ADMIN_NOTIFS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(ADMIN_NOTIFS_SYNC_EVENT));
  } catch {
    // abaikan error storage
  }
}

function ProfileDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "orders";

  const [activeTab, setActiveTab] = useState<
    "orders" | "profile" | "notifications"
  >(
    initialTab === "profile" || initialTab === "notifications"
      ? initialTab
      : "orders"
  );

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilterTab, setOrderFilterTab] =
    useState<CustomerOrderFilterTab>("ALL");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );
  const [cancelErrorMsg, setCancelErrorMsg] = useState<string | null>(null);

  const [activeReceipt, setActiveReceipt] = useState<TripReceiptData | null>(
    null
  );

  const [editingOrder, setEditingOrder] = useState<OrderType | null>(null);
  const [reuploadSenderName, setReuploadSenderName] = useState("");
  const [reuploadBankName, setReuploadBankName] = useState("BCA");
  const [reuploadNotes, setReuploadNotes] = useState("");
  const [reuploadProof, setReuploadProof] = useState("");
  const [reuploadFileName, setReuploadFileName] = useState("");
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const [savingReupload, setSavingReupload] = useState(false);

  const [reviews, setReviews] = useState<ReviewItemType[]>([]);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<{
    orderId: string;
    orderCode: string;
  }>({
    orderId: "",
    orderCode: "",
  });
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Pelayanan Ramah",
  ]);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileMsg, setProfileMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  const [apiNotifications, setApiNotifications] = useState<NotificationType[]>(
    []
  );
  const [readIdsOverride, setReadIdsOverride] = useState<string[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "orders" ||
      tabParam === "profile" ||
      tabParam === "notifications"
    ) {
      setActiveTab(tabParam);
    } else if (tabParam === "reviews") {
      setActiveTab("orders");
      setOrderFilterTab("REVIEWS");
    }
  }, [searchParams]);

  const loadReviewsFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (!saved) {
        setReviews([]);
        return;
      }
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setReviews(
          parsed.map((item) => ({
            id: String(item.id || Date.now()),
            orderId: String(item.orderId || ""),
            orderCode:
              item.orderCode ||
              (item.orderId && item.orderId !== "MANUAL"
                ? `#${String(item.orderId).slice(-6).toUpperCase()}`
                : "Pesanan"),
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

  useEffect(() => {
    loadReviewsFromStorage();

    const handleSync = () => {
      loadReviewsFromStorage();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(REVIEWS_SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(REVIEWS_SYNC_EVENT, handleSync);
    };
  }, [loadReviewsFromStorage]);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setAddress(data.user.address || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      setApiNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotif(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadProfile();
    loadNotifications();
  }, []);

  const notifications = useMemo<NotificationType[]>(() => {
    const merged: NotificationType[] = apiNotifications.map((n) => {
      const norm = normalizeNotificationTitle(n.title, n.message);
      return {
        ...n,
        title: norm.title,
        kind: norm.kind,
        isRead: n.isRead || readIdsOverride.includes(n.id),
      };
    });

    const combinedText = merged
      .map((m) => `${m.title} ${m.message}`.toLowerCase())
      .join(" ");

    for (const order of orders) {
      const code = `#${order.id.slice(-6).toUpperCase()}`;
      const synthId = `order-status-${order.id}-${order.status}`;
      const alreadyMarkedRead = readIdsOverride.includes(synthId);

      if (isRejectedByAdmin(order)) {
        const hasRejectedNotif =
          combinedText.includes(code.toLowerCase()) &&
          (combinedText.includes("ditolak") ||
            combinedText.includes("belum sesuai"));

        if (!hasRejectedNotif) {
          merged.push({
            id: synthId,
            title: "Pesanan ditolak admin",
            message: `Pesanan ${code} ditolak oleh admin. Silakan periksa catatan/bukti transfer lalu upload ulang bukti transfer atau batalkan pesanan.`,
            isRead: alreadyMarkedRead,
            createdAt: order.createdAt,
            kind: "REJECTED",
          });
        }
      } else if (order.status === "WAITING_CONFIRMATION") {
        const hasWaitingNotif =
          combinedText.includes(code.toLowerCase()) &&
          (combinedText.includes("konfirmasi") ||
            combinedText.includes("bukti transfer"));

        if (!hasWaitingNotif) {
          merged.push({
            id: synthId,
            title: "Konfirmasi pesanan",
            message: `Pesanan ${code} sedang menunggu konfirmasi bukti transfer dari admin.`,
            isRead: alreadyMarkedRead,
            createdAt: order.createdAt,
            kind: "CONFIRMATION",
          });
        }
      } else if (isOrderApprovedOrDone(order)) {
        const hasCompletedNotif =
          combinedText.includes(code.toLowerCase()) &&
          (combinedText.includes("selesai") ||
            combinedText.includes("dikonfirmasi"));

        if (!hasCompletedNotif) {
          merged.push({
            id: synthId,
            title: "Pesanan selesai",
            message: `Pesanan ${code} telah dikonfirmasi dan ditandai selesai. Receipt digital dan ulasan sudah tersedia.`,
            isRead: alreadyMarkedRead,
            createdAt: order.createdAt,
            kind: "COMPLETED",
          });
        }
      } else if (isCancelledByCustomer(order.notes)) {
        const hasCancelledNotif =
          combinedText.includes(code.toLowerCase()) &&
          combinedText.includes("dibatalkan");

        if (!hasCancelledNotif) {
          merged.push({
            id: synthId,
            title: "Pesanan Dibatalkan",
            message: `Pesanan ${code} telah dibatalkan.`,
            isRead: alreadyMarkedRead,
            createdAt: order.createdAt,
            kind: "CANCELLED",
          });
        }
      }
    }

    return merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [apiNotifications, orders, readIdsOverride]);

  const reviewableOrders = useMemo(() => {
    return orders
      .filter((order) => isOrderApprovedOrDone(order))
      .map((order) => ({
        orderId: order.id,
        orderCode: `#${order.id.slice(-6).toUpperCase()}`,
      }));
  }, [orders]);

  useEffect(() => {
    if (!selectedReviewOrder.orderId && reviewableOrders.length > 0) {
      setSelectedReviewOrder({
        orderId: reviewableOrders[0].orderId,
        orderCode: reviewableOrders[0].orderCode,
      });
    }
  }, [reviewableOrders, selectedReviewOrder.orderId]);

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const confirmationCount = useMemo(
    () => orders.filter((o) => isOrderInConfirmationTab(o)).length,
    [orders]
  );
  const completedCount = useMemo(
    () => orders.filter((o) => isOrderApprovedOrDone(o)).length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    switch (orderFilterTab) {
      case "CONFIRMATION":
        return orders.filter((o) => isOrderInConfirmationTab(o));
      case "COMPLETED":
        return orders.filter((o) => isOrderApprovedOrDone(o));
      case "REVIEWS":
        return [];
      default:
        return orders;
    }
  }, [orders, orderFilterTab]);

  const getStatusBadge = (order: OrderType) => {
    if (isOrderApprovedOrDone(order)) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-200 text-neutral-950">
          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
        </span>
      );
    }

    if (isRejectedByAdmin(order)) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-950 border border-rose-300">
          <AlertCircle className="w-3.5 h-3.5" /> Ditolak Admin
        </span>
      );
    }

    if (isCancelledByCustomer(order.notes)) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-neutral-200 text-neutral-950">
          <Ban className="w-3.5 h-3.5" /> Dibatalkan
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-neutral-950">
        <Clock className="w-3.5 h-3.5" /> Menunggu Persetujuan Admin
      </span>
    );
  };

  const restoreStockForOrder = async (order: OrderType) => {
    const notesSchedule = extractScheduleFromNotes(order.notes);

    try {
      const prodRes = await fetch("/api/admin/products", { cache: "no-store" });
      if (!prodRes.ok) return;
      const prodData = await prodRes.json();
      const allProducts: Array<{
        id: string;
        category: string;
        metaData?: Record<string, unknown> | null;
      }> = prodData.products || [];

      for (const orderItem of order.items) {
        const targetProd = allProducts.find(
          (p) =>
            p.id === orderItem.productId || p.id === orderItem.product?.id
        );
        if (!targetProd) continue;

        const meta = (targetProd.metaData || {}) as {
          timeTrips?: Array<{
            id: string;
            dateLabel: string;
            quota: number;
            sold?: boolean;
          }>;
          bookedDates?: string[];
        };

        const chosenSched = orderItem.selectedSchedule || notesSchedule;
        let updated = false;

        const nextMeta = { ...meta };

        if (
          Array.isArray(meta.timeTrips) &&
          meta.timeTrips.length > 0 &&
          chosenSched
        ) {
          nextMeta.timeTrips = meta.timeTrips.map((slot) => {
            if (
              slot.dateLabel.trim().toLowerCase() ===
              chosenSched.trim().toLowerCase()
            ) {
              updated = true;
              const restoredQuota =
                Math.max(0, Number(slot.quota || 0)) + orderItem.quantity;
              return {
                ...slot,
                quota: restoredQuota,
                sold: restoredQuota <= 0,
              };
            }
            return slot;
          });
        }

        if (Array.isArray(meta.bookedDates) && meta.bookedDates.length > 0) {
          const filteredBooked = meta.bookedDates.filter(
            (d) => !chosenSched || !chosenSched.includes(d)
          );
          if (filteredBooked.length !== meta.bookedDates.length) {
            nextMeta.bookedDates = filteredBooked;
            updated = true;
          }
        }

        if (updated) {
          await fetch("/api/admin/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: targetProd.id,
              metaData: nextMeta,
            }),
          });
        }
      }
    } catch {
      // abaikan jika endpoint admin tidak dapat diakses langsung oleh customer
    }
  };

  const handleCancelOrderByCustomer = async (order: OrderType) => {
    setCancellingOrderId(order.id);
    setCancelErrorMsg(null);
    const code = `#${order.id.slice(-6).toUpperCase()}`;
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          action: "cancel",
          status: "CANCELLED",
          restoreStock: true,
          notes:
            "Dibatalkan oleh pelanggan (tidak jadi pesan & kuota/tanggal dikembalikan).",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelErrorMsg(data.message || "Gagal membatalkan pesanan.");
        return;
      }

      pushAdminNotification({
        type: "CANCELLED_BY_CUSTOMER",
        title: `Pesanan ${code} dibatalkan pelanggan`,
        message: `${
          name || profile?.name || profile?.email || "Pelanggan"
        } membatalkan pesanan ${code}.`,
        orderCode: code,
        customerName: name || profile?.name || profile?.email || "Pelanggan",
      });

      await restoreStockForOrder(order);
      await loadOrders();
      await loadNotifications();
    } catch {
      setCancelErrorMsg("Terjadi kesalahan jaringan saat membatalkan pesanan.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const openReuploadModal = (order: OrderType) => {
    setEditingOrder(order);
    setReuploadSenderName(order.senderName || "");
    setReuploadBankName(order.bankName || "BCA");
    setReuploadNotes("");
    setReuploadProof(order.paymentProof || "");
    setReuploadFileName("");
    setReuploadError(null);
  };

  const handleReuploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setReuploadError("Ukuran file bukti transfer maksimal 4MB.");
      return;
    }

    setReuploadError(null);
    setReuploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setReuploadProof(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReupload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    if (!reuploadProof) {
      setReuploadError("Silakan upload foto/screenshot bukti transfer baru.");
      return;
    }

    setSavingReupload(true);
    setReuploadError(null);
    const code = `#${editingOrder.id.slice(-6).toUpperCase()}`;

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: editingOrder.id,
          senderName: reuploadSenderName,
          bankName: reuploadBankName,
          paymentProof: reuploadProof,
          notes: reuploadNotes,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReuploadError(data.message || "Gagal memperbarui bukti transfer.");
        setSavingReupload(false);
        return;
      }

      pushAdminNotification({
        type: "REUPLOAD_PROOF",
        title: `Upload ulang bukti TF ${code}`,
        message: `${
          name || profile?.name || reuploadSenderName || "Pelanggan"
        } mengunggah ulang bukti transfer (${reuploadBankName}) untuk pesanan ${code}.`,
        orderCode: code,
        customerName:
          name || profile?.name || reuploadSenderName || "Pelanggan",
      });

      setEditingOrder(null);
      setOrderFilterTab("CONFIRMATION");
      await loadOrders();
      await loadNotifications();
    } catch {
      setReuploadError("Terjadi kesalahan jaringan saat mengirim bukti transfer.");
    } finally {
      setSavingReupload(false);
    }
  };

  const handleOpenAccReceipt = (order: OrderType) => {
    const orderCode = `#${order.id.slice(-6).toUpperCase()}`;
    const firstItem = order.items[0];
    const isSingleItem = order.items.length === 1;

    const mappedOrderItems = order.items.map((it) => {
      const unitLabel = getItemUnitLabel(it.product?.category);
      const itemSched = getScheduleForOrderItem(it, order);
      return {
        title: it.product.title,
        category: it.product.category,
        quantity: it.quantity,
        unitLabel,
        price: it.price,
        schedule: itemSched || undefined,
      };
    });

    const notesSchedule = extractScheduleFromNotes(order.notes);
    const fallbackItemSchedules = order.items
      .map((it) => getScheduleForOrderItem(it, order))
      .filter(Boolean)
      .join(" | ");

    let normalizedDate =
      notesSchedule || fallbackItemSchedules || "Jadwal Terkonfirmasi";

    if (isSingleItem && firstItem) {
      normalizedDate = normalizedDate
        .replace(new RegExp(`^${firstItem.product.title}\\s*:\\s*`, "i"), "")
        .trim();
    }

    const singleUnitLabel = getItemUnitLabel(firstItem?.product.category);

    setActiveReceipt({
      id: order.id,
      orderCode,
      title:
        isSingleItem && firstItem
          ? `${firstItem.product.title} (${firstItem.quantity} ${singleUnitLabel})`
          : `Struk Pesanan ${orderCode}`,
      slug: `order-${order.id.slice(-6)}`,
      category: isSingleItem ? firstItem?.product.category : "MIXED",
      price: order.totalAmount,
      selectedDate: normalizedDate || "Jadwal Terkonfirmasi",
      orderItems: mappedOrderItems,
      meetingPoints: [
        `No. Struk: ${orderCode}`,
        `Pengirim: ${order.senderName || "-"} (${order.bankName || "-"})`,
      ],
      shareUrl: `No. Struk: ${orderCode}`,
    });
  };

  const buildWaConfirmationUrl = (order: OrderType) => {
    const orderCode = order.id.slice(-6).toUpperCase();
    const itemLines = order.items
      .map((it) => {
        const unitLabel = getItemUnitLabel(it.product.category);
        const itemSched = getScheduleForOrderItem(it, order);
        const subtotal = getItemSubtotal(it, itemSched);
        return `- ${it.product.title} (${it.quantity} ${unitLabel})${
          itemSched ? ` [${itemSched}]` : ""
        } = ${formatRupiah(subtotal)}`;
      })
      .join("\n");

    const scheduleInfo = extractScheduleFromNotes(order.notes) || "-";
    const rulesAgreedInfo = /Persetujuan Rules\s*:\s*DISETUJUI/i.test(
      order.notes || ""
    )
      ? "Sudah Disetujui"
      : "Tercatat";

    const message = [
      "Halo Admin *Alam Memanggil*, pembayaran pesanan saya sudah dikonfirmasi sesuai.",
      "",
      `Kode Pesanan: *#${orderCode}*`,
      `Nama Pelanggan: ${name || profile?.name || "-"}`,
      `Pengirim Transfer: ${order.senderName || "-"} (${order.bankName || "-"})`,
      `Jadwal: ${scheduleInfo}`,
      `Persetujuan Rules: ${rulesAgreedInfo}`,
      "",
      "Rincian Pesanan:",
      itemLines,
      "",
      `Total Pembayaran: *${formatRupiah(order.totalAmount)}*`,
      "",
      "Mohon informasi koordinasi selanjutnya ya. Terima kasih!",
    ].join("\n");

    return `https://wa.me/${WA_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const toggleReviewTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewMsg(null);

    if (!reviewComment.trim()) {
      setReviewMsg({
        type: "err",
        text: "Silakan tulis komentar ulasan Anda terlebih dahulu.",
      });
      return;
    }

    const orderCodeLabel =
      selectedReviewOrder.orderCode ||
      (selectedReviewOrder.orderId
        ? `#${selectedReviewOrder.orderId.slice(-6).toUpperCase()}`
        : "Pesanan");

    const newReview: ReviewItemType = {
      id: `rev-${Date.now()}`,
      orderId: selectedReviewOrder.orderId || "MANUAL",
      orderCode: orderCodeLabel,
      rating,
      tags: selectedTags,
      comment: reviewComment.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(REVIEWS_SYNC_EVENT));
    } catch {
      // abaikan error storage
    }

    pushAdminNotification({
      type: "NEW_REVIEW",
      title: `Ulasan baru ${orderCodeLabel} (${rating}/5 ⭐)`,
      message: `${
        name || profile?.name || "Pelanggan"
      } memberikan ulasan: "${reviewComment.trim().slice(0, 90)}"`,
      orderCode: orderCodeLabel,
      customerName: name || profile?.name || "Pelanggan",
    });

    setReviewComment("");
    setRating(5);
    setReviewMsg({
      type: "ok",
      text: "Ulasan Anda berhasil disimpan. Terima kasih atas penilaiannya!",
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({
          type: "err",
          text: data.message || "Gagal menyimpan profil",
        });
      } else {
        setProfileMsg({ type: "ok", text: data.message || "Profil tersimpan" });
        setProfile(data.user);
      }
    } catch {
      setProfileMsg({ type: "err", text: "Terjadi kesalahan koneksi" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (newPassword !== confirmPassword) {
      setPassMsg({
        type: "err",
        text: "Konfirmasi kata sandi baru tidak cocok.",
      });
      return;
    }

    setSavingPass(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPassMsg({
          type: "err",
          text: data.message || "Gagal mengganti kata sandi",
        });
      } else {
        setPassMsg({
          type: "ok",
          text: data.message || "Kata sandi berhasil diperbarui",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPassMsg({ type: "err", text: "Terjadi kesalahan koneksi" });
    } finally {
      setSavingPass(false);
    }
  };

  const handleMarkSingleRead = async (notifId: string) => {
    setReadIdsOverride((prev) =>
      prev.includes(notifId) ? prev : [...prev, notifId]
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notifId, isRead: true }),
      });
      loadNotifications();
    } catch {
      // abaikan jika endpoint hanya menerima markAll
    }
  };

  const handleMarkAllRead = async () => {
    setReadIdsOverride(notifications.map((n) => n.id));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      loadNotifications();
    } catch {
      // abaikan error
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const customerTabs: Array<{
    key: CustomerOrderFilterTab;
    label: string;
    count: number;
  }> = [
    { key: "ALL", label: "Semua", count: orders.length },
    { key: "CONFIRMATION", label: "Konfirmasi", count: confirmationCount },
    { key: "COMPLETED", label: "Selesai", count: completedCount },
    { key: "REVIEWS", label: "Ulasan", count: reviews.length },
  ];

  const ratingLabelMap: Record<number, string> = {
    1: "Sangat Kurang",
    2: "Kurang",
    3: "Cukup",
    4: "Bagus",
    5: "Sangat Memuaskan",
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 text-neutral-950">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl border border-neutral-300 p-6 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#6F4E37] text-white flex items-center justify-center text-xl font-black shadow">
              {(name || profile?.name || "U")[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black text-neutral-950">
                {name || profile?.name || "Pengguna Alam Memanggil"}
              </h1>
              <p className="text-xs font-semibold text-neutral-700">
                {profile?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Pesanan Saya</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
              }`}
            >
              <UserCircle className="w-4 h-4" />
              <span>Profil & Sandi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-[#6F4E37] text-white shadow"
                  : "bg-neutral-200 text-neutral-950 hover:bg-neutral-300"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifikasi</span>
              {unreadCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-500 text-black font-black">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {activeTab === "orders" && (
          <div className="bg-white rounded-3xl border border-neutral-300 shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-neutral-200 bg-neutral-50/70">
              {customerTabs.map((t) => {
                const isSelected = orderFilterTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setOrderFilterTab(t.key)}
                    className={`relative py-3.5 px-3 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "text-[#6F4E37] bg-white"
                        : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/70"
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.count > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                          isSelected
                            ? "bg-[#6F4E37] text-white"
                            : "bg-neutral-200 text-neutral-900"
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

            {orderFilterTab === "REVIEWS" ? (
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleSubmitReview}
                  className="lg:col-span-7 bg-neutral-50/70 rounded-2xl border border-neutral-200 p-5 space-y-4 h-fit"
                >
                  <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-[#6F4E37] flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-neutral-950">
                        Beri Ulasan Pesanan
                      </h2>
                      <p className="text-[11px] font-medium text-neutral-600">
                        Pilih kode orderan, beri rating bintang, dan tulis ulasanmu
                      </p>
                    </div>
                  </div>

                  {reviewMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        reviewMsg.type === "ok"
                          ? "bg-emerald-100 text-neutral-950 border border-emerald-400"
                          : "bg-red-100 text-neutral-950 border border-red-400"
                      }`}
                    >
                      {reviewMsg.type === "ok" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{reviewMsg.text}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-black text-neutral-950 mb-1">
                      Pesanan yang Diulas
                    </label>
                    {reviewableOrders.length > 0 ? (
                      <select
                        value={selectedReviewOrder.orderId}
                        onChange={(e) => {
                          const found = reviewableOrders.find(
                            (r) => r.orderId === e.target.value
                          );
                          setSelectedReviewOrder({
                            orderId: e.target.value,
                            orderCode: found?.orderCode || "Pesanan",
                          });
                        }}
                        className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                      >
                        {reviewableOrders.map((ord) => (
                          <option key={ord.orderId} value={ord.orderId}>
                            Pesanan {ord.orderCode}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedReviewOrder.orderCode || "Pesanan"}
                        onChange={(e) =>
                          setSelectedReviewOrder((prev) => ({
                            ...prev,
                            orderCode: e.target.value,
                          }))
                        }
                        placeholder="Kode pesanan"
                        className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                      />
                    )}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-neutral-950">
                        Rating Bintang
                      </span>
                      <span className="text-xs font-black text-[#6F4E37]">
                        {ratingLabelMap[hoverRating || rating]} (
                        {hoverRating || rating}/5)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const active = starValue <= (hoverRating || rating);
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(starValue)}
                            aria-label={`Beri bintang ${starValue}`}
                            className="p-1 transition cursor-pointer hover:scale-110"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                active
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-neutral-300 fill-neutral-100"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-neutral-950 mb-2">
                      Sorotan Pengalaman
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_REVIEW_TAGS.map((tag) => {
                        const picked = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleReviewTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                              picked
                                ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                                : "bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-neutral-950 mb-1">
                      Komentar Ulasan *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Ceritakan pengalaman pesanan atau pelayanan tim..."
                      className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#6F4E37] hover:bg-[#5a3e2b] text-white font-black py-2.5 rounded-full text-xs shadow transition cursor-pointer"
                  >
                    Kirim Ulasan
                  </button>
                </form>

                <div className="lg:col-span-5 bg-neutral-50/70 rounded-2xl border border-neutral-200 p-5 space-y-3 h-fit">
                  <h3 className="text-xs font-black text-neutral-950 uppercase tracking-wider border-b border-neutral-200 pb-2.5">
                    Ulasan Saya ({reviews.length})
                  </h3>

                  {reviews.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <Star className="w-10 h-10 text-neutral-300 mx-auto" />
                      <p className="text-xs font-black text-neutral-900">
                        Belum ada ulasan
                      </p>
                      <p className="text-xs font-medium text-neutral-600">
                        Ulasan yang kamu kirim akan tampil di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                      {reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-black text-neutral-950">
                                Pesanan {rev.orderCode}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
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
                              </div>
                            </div>
                            <span className="text-[11px] font-medium text-neutral-600">
                              {new Date(rev.createdAt).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                          </div>

                          {rev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {rev.tags.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-[#6F4E37]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="font-medium text-neutral-900 leading-relaxed">
                            {rev.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {cancelErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-100 border border-red-400 text-xs font-bold text-neutral-950 flex items-center justify-between gap-2">
                    <span>{cancelErrorMsg}</span>
                    <button
                      type="button"
                      onClick={() => setCancelErrorMsg(null)}
                      className="text-xs font-black underline cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                {loadingOrders ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <p className="text-sm font-black text-neutral-950">
                      Tidak ada pesanan pada tab ini
                    </p>
                    <p className="text-xs font-medium text-neutral-700 mt-1">
                      Pesanan yang menunggu persetujuan atau ditolak admin tampil di Konfirmasi, sedangkan yang sudah sesuai tampil di Selesai.
                    </p>
                  </div>
                ) : (
                  filteredOrders.map((order) => {
                    const isApproved = isOrderApprovedOrDone(order);
                    const rejectedByAdmin = isRejectedByAdmin(order);
                    const noteLines = splitNoteLines(order.notes);

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-neutral-300 p-5 shadow-2xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3.5">
                          <div>
                            <p className="text-xs font-black text-neutral-950">
                              Pesanan #{order.id.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-xs font-medium text-neutral-700">
                              Dibuat:{" "}
                              {new Date(order.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </p>
                          </div>
                          {getStatusBadge(order)}
                        </div>

                        {rejectedByAdmin && (
                          <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs font-bold text-rose-950 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>
                              Tidak sesuai karena ditolak admin. Silakan upload ulang bukti transfer atau batalkan pesanan.
                            </span>
                          </div>
                        )}

                        <div className="space-y-2.5">
                          {order.items.map((item) => {
                            const unitLabel = getItemUnitLabel(
                              item.product.category
                            );
                            const itemSched = getScheduleForOrderItem(
                              item,
                              order
                            );
                            const itemSubtotal = getItemSubtotal(
                              item,
                              itemSched
                            );

                            return (
                              <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs bg-neutral-50/90 p-3 rounded-xl border border-neutral-200/80"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-neutral-950 leading-snug">
                                    {item.product.title}{" "}
                                    <span className="text-neutral-700 font-semibold">
                                      ({item.quantity} {unitLabel})
                                    </span>
                                  </p>
                                  {itemSched && (
                                    <div className="mt-1.5 flex items-start gap-1.5 text-[11px] font-bold text-[#6F4E37] leading-snug">
                                      <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                      <span className="break-words">
                                        Jadwal: {itemSched}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <span className="font-black text-neutral-950 shrink-0 sm:pt-0.5">
                                  {formatRupiah(itemSubtotal)}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {noteLines.length > 0 && (
                          <div className="bg-neutral-100/90 border border-neutral-300 rounded-xl p-3.5 text-xs font-medium text-neutral-900 space-y-1.5">
                            {noteLines.map((line, idx) => (
                              <p
                                key={idx}
                                className="leading-relaxed break-words"
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3.5 border-t border-dashed border-neutral-300">
                          <div>
                            <p className="text-xs font-semibold text-neutral-700">
                              Total Pembayaran
                            </p>
                            <p className="text-base font-black text-[#6F4E37]">
                              {formatRupiah(order.totalAmount)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {rejectedByAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openReuploadModal(order)}
                                  className="inline-flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-black px-4 py-2.5 rounded-full transition shadow cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-black" />
                                  <span>Upload Ulang Bukti TF</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={cancellingOrderId === order.id}
                                  onClick={() =>
                                    handleCancelOrderByCustomer(order)
                                  }
                                  className="inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2.5 rounded-full transition shadow cursor-pointer disabled:opacity-70"
                                >
                                  {cancellingOrderId === order.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Ban className="w-3.5 h-3.5" />
                                  )}
                                  <span>Batalkan Pesanan</span>
                                </button>
                              </>
                            )}

                            {isApproved && order.items.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenAccReceipt(order)}
                                className="inline-flex items-center justify-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-neutral-950 border border-amber-300 text-xs font-black px-4 py-2.5 rounded-full transition shadow-2xs cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5 text-[#6F4E37]" />
                                <span>Lihat & Unduh Receipt</span>
                              </button>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReviewOrder({
                                    orderId: order.id,
                                    orderCode: `#${order.id
                                      .slice(-6)
                                      .toUpperCase()}`,
                                  });
                                  setOrderFilterTab("REVIEWS");
                                }}
                                className="inline-flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-950 border border-neutral-300 text-xs font-black px-4 py-2.5 rounded-full transition cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span>Beri Ulasan</span>
                              </button>
                            )}

                            {isApproved && (
                              <a
                                href={buildWaConfirmationUrl(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black px-5 py-2.5 rounded-full transition shadow"
                              >
                                <MessageCircle className="w-4 h-4 text-black" />
                                <span>Chat WA Admin (Detail Otomatis)</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form
              onSubmit={handleSaveProfile}
              className="bg-white rounded-2xl border border-neutral-300 p-6 shadow-sm space-y-4"
            >
              <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider">
                Informasi Profil
              </h2>

              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    profileMsg.type === "ok"
                      ? "bg-emerald-100 text-neutral-950 border border-emerald-400"
                      : "bg-red-100 text-neutral-950 border border-red-400"
                  }`}
                >
                  {profileMsg.type === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-neutral-950 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-950 mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-950 mb-1">
                  Alamat Domisili
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap Anda"
                  className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-[#6F4E37] hover:bg-[#5a3e2b] text-white font-black py-2.5 rounded-full text-xs transition cursor-pointer disabled:opacity-70"
              >
                {savingProfile ? "Menyimpan..." : "Simpan Perubahan Profil"}
              </button>
            </form>

            <form
              onSubmit={handleChangePassword}
              className="bg-white rounded-2xl border border-neutral-300 p-6 shadow-sm space-y-4 h-fit"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#6F4E37]" />
                <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider">
                  Ganti Kata Sandi
                </h2>
              </div>

              {passMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    passMsg.type === "ok"
                      ? "bg-emerald-100 text-neutral-950 border border-emerald-400"
                      : "bg-red-100 text-neutral-950 border border-red-400"
                  }`}
                >
                  {passMsg.type === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-neutral-950 mb-1">
                  Kata Sandi Saat Ini
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama"
                  className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-950 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-950 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
                />
              </div>

              <button
                type="submit"
                disabled={savingPass}
                className="w-full bg-neutral-950 hover:bg-neutral-800 text-white font-black py-2.5 rounded-full text-xs transition cursor-pointer disabled:opacity-70"
              >
                {savingPass ? "Memperbarui..." : "Perbarui Kata Sandi"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="bg-white rounded-2xl border border-neutral-300 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-black text-neutral-950 uppercase tracking-wider">
                Pusat Notifikasi
              </h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-black text-neutral-950 underline cursor-pointer"
                >
                  Tandai semua sudah dibaca
                </button>
              )}
            </div>

            {loadingNotif ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 animate-spin text-[#6F4E37]" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-xs font-semibold text-neutral-700 py-6 text-center">
                Belum ada notifikasi untuk akun Anda.
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => {
                  const isRejected = notif.kind === "REJECTED";
                  const isCompleted = notif.kind === "COMPLETED";

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkSingleRead(notif.id)}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition ${
                        isRejected
                          ? "bg-rose-50/90 border-rose-300 text-rose-950"
                          : isCompleted
                          ? "bg-emerald-50/70 border-emerald-300 text-neutral-950"
                          : notif.isRead
                          ? "bg-white border-neutral-200 text-neutral-900"
                          : "bg-amber-50 border-amber-300 text-neutral-950"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isRejected ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                          )}
                          <p className="font-black text-neutral-950">
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#6F4E37] text-white">
                              Baru
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-neutral-700">
                          {new Date(notif.createdAt).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <p className="mt-1.5 font-medium leading-relaxed">
                        {notif.message}
                      </p>
                      {isRejected && (
                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab("orders");
                              setOrderFilterTab("CONFIRMATION");
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                          >
                            <span>Cek & Upload Ulang di Tab Konfirmasi</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ShareableTripReceiptModal
        isOpen={Boolean(activeReceipt)}
        onClose={() => setActiveReceipt(null)}
        trip={activeReceipt}
      />

      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 text-neutral-950">
          <form
            onSubmit={handleSubmitReupload}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-300 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-black text-neutral-950">
                Upload Ulang Bukti TF (#
                {editingOrder.id.slice(-6).toUpperCase()})
              </h3>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 rounded-full text-neutral-950 hover:bg-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reuploadError && (
              <div className="bg-red-100 border border-red-400 text-neutral-950 text-xs font-bold px-3 py-2 rounded-xl">
                {reuploadError}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-neutral-950 mb-1">
                Nama Pengirim di Rekening *
              </label>
              <input
                type="text"
                required
                value={reuploadSenderName}
                onChange={(e) => setReuploadSenderName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-neutral-950 mb-1">
                Bank / E-Wallet Pengirim *
              </label>
              <input
                type="text"
                required
                value={reuploadBankName}
                onChange={(e) => setReuploadBankName(e.target.value)}
                placeholder="Contoh: BCA / Mandiri / BRI"
                className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-neutral-950 mb-1">
                Upload Bukti Transfer Baru *
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-400 hover:border-neutral-950 rounded-2xl p-4 cursor-pointer bg-neutral-50">
                <Upload className="w-5 h-5 text-neutral-950 mb-1" />
                <span className="text-xs font-black text-neutral-950">
                  {reuploadFileName ||
                    "Klik untuk pilih gambar bukti transfer baru"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReuploadFileChange}
                  className="hidden"
                />
              </label>

              {reuploadProof && (
                <img
                  src={reuploadProof}
                  alt="Preview Bukti Transfer Baru"
                  className="mt-2 max-h-40 rounded-xl border border-neutral-300 object-contain bg-neutral-100 p-1.5"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-neutral-950 mb-1">
                Catatan Perbaikan (Opsional)
              </label>
              <input
                type="text"
                value={reuploadNotes}
                onChange={(e) => setReuploadNotes(e.target.value)}
                placeholder="Contoh: Sudah transfer ulang sesuai nominal"
                className="w-full bg-white border border-neutral-400 rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-950 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-950"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 rounded-full text-xs font-black bg-neutral-200 hover:bg-neutral-300 text-neutral-950 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingReupload}
                className="px-5 py-2 rounded-full text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-black shadow cursor-pointer"
              >
                {savingReupload ? "Mengirim..." : "Kirim Bukti Baru"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
        </div>
      }
    >
      <ProfileDashboardContent />
    </Suspense>
  );
}
import { DbCategory, DbCollection, DbProduct, DbPromoCode } from "@/lib/db";

export type StaffRole = "owner" | "manager" | "support";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
}

export function canAccessSection(role: StaffRole, section: string): boolean {
  if (role === "owner") return true;
  if (role === "manager") {
    return section !== "staff";
  }
  return ["overview", "orders", "cancellations", "customers", "leads", "abandoned"].includes(section);
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  district: string;
  address: string;
  notes: string;
  paymentMethod: string;
  paymentStatus: string;
  trxId: string;
  giftNote: string;
  promoCode: string;
  subtotalBDT: number;
  discountBDT: number;
  deliveryBDT: number;
  totalBDT: number;
  status: string;
  courierName: string;
  trackingCode: string;
  internalNotes: string;
  items: {
    productId?: string;
    name: string;
    category?: string;
    priceBDT: number;
    quantity: number;
    selectedColor: string;
    image?: string;
  }[];
  timeline: { status: string; at: string; by: string; note: string }[];
  cancellationRequested?: boolean;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomer {
  phone: string;
  name: string;
  email: string;
  district: string;
  address: string;
  ordersCount: number;
  totalSpentBDT: number;
  lastOrderAt: string;
  firstOrderAt: string;
  orderIds: string[];
  tags: string;
  notes: string;
  vip: boolean;
}

export interface AdminLead {
  id: number;
  type: string;
  name: string;
  phone: string;
  email: string;
  product_id: string;
  product_name: string;
  courtesy_code: string;
  status: string;
  notes: string;
  created_at: string;
}

export interface AdminAbandoned {
  sessionId: string;
  visitorId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  district: string;
  address: string;
  lastStep: string;
  items: { name: string; priceBDT: number; quantity: number; selectedColor: string }[];
  subtotalBDT: number;
  recovered: boolean;
  updatedAt: string;
}

export interface AdminAnalytics {
  totalVisitors: number;
  totalSessions: number;
  totalPageViews: number;
  avgDurationSec: number;
  topPages: {
    path: string;
    views: number;
    uniqueVisitors: number;
    avgDurationSec: number;
    exits: number;
    exitRate: number;
  }[];
  funnel: {
    key: string;
    label: string;
    sessions: number;
    pctOfTotal: number;
    stepConversionPct: number;
    exitsHere: number;
    dropOffPct: number;
  }[];
  referrers: { referrer: string; sessions: number }[];
  devices: { device: string; sessions: number }[];
  daily: { day: string; visitors: number; sessions: number; page_views: number }[];
}

export interface AdminPayload {
  user: SessionUser;
  categories: DbCategory[];
  collections: DbCollection[];
  products: DbProduct[];
  orders: AdminOrder[];
  customers: AdminCustomer[];
  promoCodes: DbPromoCode[];
  leads: AdminLead[];
  abandonedCheckouts: AdminAbandoned[];
  siteContent: Record<string, string>;
  staff: {
    id: number;
    name: string;
    email: string;
    role: string;
    active: number;
    last_login_at: string | null;
    created_at: string;
  }[];
  auditLogs: {
    id: number;
    user_email: string;
    user_role: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: string;
    created_at: string;
  }[];
  analytics: AdminAnalytics;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (val: string | number) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toBdWhatsApp(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.startsWith("880")
    ? digits
    : digits.startsWith("0")
    ? `88${digits}`
    : `880${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

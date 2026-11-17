import { CartItem } from "@/components/BagDrawer";
import { PROMO_CODES } from "@/data/nokshaData";

export const FREE_DELIVERY_THRESHOLD = 8000;
export const DELIVERY_DHAKA = 120;
export const DELIVERY_OUTSIDE = 200;

export interface PromoRule {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderBDT: number;
  label: string;
  active?: boolean;
}

export interface PriceBreakdown {
  subtotal: number;
  discount: number;
  delivery: number;
  total: number;
}

export function computePrice(
  items: CartItem[],
  promo: string | null,
  district: string,
  customPromos?: PromoRule[]
): PriceBreakdown {
  const subtotal = items.reduce((s, i) => s + i.product.priceBDT * i.quantity, 0);
  let discount = 0;

  if (promo) {
    const clean = promo.toUpperCase();
    const matched = customPromos?.find((p) => p.code.toUpperCase() === clean && p.active !== false);
    if (matched) {
      if (subtotal >= (matched.minOrderBDT || 0)) {
        discount =
          matched.discountType === "fixed"
            ? Math.min(subtotal, Math.round(matched.discountValue))
            : Math.round(subtotal * (matched.discountValue / 100));
      }
    } else if (PROMO_CODES[clean]) {
      discount = Math.round(subtotal * PROMO_CODES[clean].discountRate);
    }
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const delivery =
    subtotal === 0 || afterDiscount >= FREE_DELIVERY_THRESHOLD
      ? 0
      : district === "Dhaka"
      ? DELIVERY_DHAKA
      : DELIVERY_OUTSIDE;
  return { subtotal, discount, delivery, total: afterDiscount + delivery };
}

/** Accepts 01XXXXXXXXX, +8801XXXXXXXXX and 8801XXXXXXXXX with spaces or dashes. */
export function isValidBdPhone(value: string): boolean {
  const digits = value.replace(/[\s-]/g, "");
  return /^(\+?88)?01[3-9]\d{8}$/.test(digits);
}

export type PaymentMethod = "cod" | "bkash" | "whatsapp" | "uddoktapay";

export interface PlacedOrder {
  id: string;
  placedAt: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  address: string;
  notes: string;
  payment: PaymentMethod;
  trxId: string;
  giftNote: string;
  promoCode?: string;
  items: CartItem[];
  price: PriceBreakdown;
}

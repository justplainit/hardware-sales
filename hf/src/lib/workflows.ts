import type { QuoteItemStatus, DeliveryMethod } from "@prisma/client";

export type QuoteItemInput = {
  supplierId?: string | null;
  qty: number;
  costPrice: number;
  sellPrice: number;
  deliveryMethod: DeliveryMethod;
};

export function calculateMarginPct(cost: number, sell: number) {
  if (sell <= 0) return 0;
  return Math.round(((sell - cost) / sell) * 1000) / 10;
}

export function computeQuoteTotals(items: QuoteItemInput[], vatRate: number) {
  const subtotal = items.reduce((sum, item) => sum + item.sellPrice * item.qty, 0);
  const vat = subtotal * vatRate;
  const total = subtotal + vat;
  return {
    subtotal,
    vat,
    total,
  };
}

export function groupItemsBySupplier<T extends { supplierId: string | null }>(
  items: T[],
) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    if (!item.supplierId) continue;
    const current = grouped.get(item.supplierId) ?? [];
    current.push(item);
    grouped.set(item.supplierId, current);
  }
  return grouped;
}

export function getReceivedStatusForDelivery(
  deliveryMethod: DeliveryMethod,
): QuoteItemStatus {
  if (deliveryMethod === "TO_OFFICE") {
    return "RECEIVED_OFFICE";
  }
  return "DELIVERED_DIRECT";
}

export function resolveQuoteStatus(
  itemStatuses: QuoteItemStatus[],
): "FULFILLED" | "PARTIALLY_FULFILLED" | "DRAFT" {
  if (itemStatuses.length === 0) {
    return "DRAFT";
  }

  const allDone = itemStatuses.every((status) =>
    ["INSTALLED", "CANCELLED"].includes(status),
  );
  if (allDone) {
    return "FULFILLED";
  }

  const anyInstalled = itemStatuses.some((status) => status === "INSTALLED");
  return anyInstalled ? "PARTIALLY_FULFILLED" : "DRAFT";
}

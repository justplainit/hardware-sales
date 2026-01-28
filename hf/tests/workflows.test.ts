import { describe, expect, it } from "vitest";
import {
  calculateMarginPct,
  computeQuoteTotals,
  getReceivedStatusForDelivery,
  groupItemsBySupplier,
  resolveQuoteStatus,
} from "@/lib/workflows";

describe("workflow helpers", () => {
  it("groups quote items by supplier", () => {
    const items = [
      { id: "1", supplierId: "sup-1" },
      { id: "2", supplierId: "sup-1" },
      { id: "3", supplierId: "sup-2" },
    ];
    const grouped = groupItemsBySupplier(items);
    expect(grouped.get("sup-1")?.length).toBe(2);
    expect(grouped.get("sup-2")?.length).toBe(1);
  });

  it("calculates margin and totals", () => {
    expect(calculateMarginPct(100, 200)).toBe(50);
    const totals = computeQuoteTotals(
      [
        { qty: 2, costPrice: 100, sellPrice: 200, deliveryMethod: "TO_OFFICE" },
      ],
      0.15,
    );
    expect(totals.subtotal).toBe(400);
    expect(totals.vat).toBe(60);
    expect(totals.total).toBe(460);
  });

  it("maps delivery method to received status", () => {
    expect(getReceivedStatusForDelivery("TO_OFFICE")).toBe("RECEIVED_OFFICE");
    expect(getReceivedStatusForDelivery("DIRECT_TO_END_USER")).toBe(
      "DELIVERED_DIRECT",
    );
  });

  it("resolves quote status from item statuses", () => {
    expect(resolveQuoteStatus(["INSTALLED", "INSTALLED"])).toBe("FULFILLED");
    expect(resolveQuoteStatus(["INSTALLED", "DISPATCHED"])).toBe(
      "PARTIALLY_FULFILLED",
    );
    expect(resolveQuoteStatus(["CANCELLED", "CANCELLED"])).toBe("FULFILLED");
  });
});

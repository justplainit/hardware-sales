import type { Prisma, PrismaClient } from "@/generated/prisma";
import { computeQuoteTotals, resolveQuoteStatus } from "@/lib/workflows";
import { getVatRate } from "@/lib/settings";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function recalculateQuoteTotals(
  db: DbClient,
  quoteId: string,
) {
  const items = await db.quoteItem.findMany({
    where: { quoteId },
    select: { qty: true, sellPrice: true, costPrice: true, deliveryMethod: true },
  });

  const vatRate = await getVatRate();
  const totals = computeQuoteTotals(
    items.map((item) => ({
      qty: item.qty,
      costPrice: Number(item.costPrice),
      sellPrice: Number(item.sellPrice),
      deliveryMethod: item.deliveryMethod,
    })),
    vatRate,
  );

  await db.quote.update({
    where: { id: quoteId },
    data: {
      subtotal: totals.subtotal,
      vat: totals.vat,
      total: totals.total,
    },
  });
}

export async function updateQuoteStatusFromItems(
  db: DbClient,
  quoteId: string,
) {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    select: { status: true },
  });

  if (!quote) return;
  if (["DECLINED", "STALE"].includes(quote.status)) return;

  const items = await db.quoteItem.findMany({
    where: { quoteId },
    select: { itemStatus: true },
  });

  const result = resolveQuoteStatus(items.map((item) => item.itemStatus));
  if (result === "FULFILLED") {
    await db.quote.update({
      where: { id: quoteId },
      data: { status: "FULFILLED" },
    });
  } else if (result === "PARTIALLY_FULFILLED") {
    await db.quote.update({
      where: { id: quoteId },
      data: { status: "PARTIALLY_FULFILLED" },
    });
  }
}

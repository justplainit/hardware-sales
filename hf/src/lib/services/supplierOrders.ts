import type { Prisma } from "@/generated/prisma";
import { groupItemsBySupplier } from "@/lib/workflows";
import { generateNumber } from "@/lib/numbering";
type SupplierOrderNotice = {
  supplierOrderNumber: string;
  supplierName: string;
  notifyUserIds: string[];
};

export async function createSupplierOrdersForQuote(
  tx: Prisma.TransactionClient,
  quoteId: string,
  userId: string | null,
) {
  const notices: SupplierOrderNotice[] = [];
  const quote = await tx.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      assignedSales: true,
      createdBy: true,
      items: {
        include: { supplier: true },
      },
    },
  });

  if (!quote) {
    throw new Error("Quote not found.");
  }

  const itemsWithSupplier = quote.items.filter((item) => item.supplierId);
  if (itemsWithSupplier.length !== quote.items.length) {
    throw new Error("All quote items must have suppliers before ordering.");
  }

  const grouped = groupItemsBySupplier(itemsWithSupplier);

  for (const [supplierId, items] of grouped.entries()) {
    const supplier = items[0]?.supplier;
    const expectedEtaDate =
      items
        .map((item) => item.etaDate)
        .filter((date): date is Date => Boolean(date))
        .sort((a, b) => b.getTime() - a.getTime())[0] ??
      (supplier?.defaultLeadDays
        ? new Date(Date.now() + supplier.defaultLeadDays * 86400000)
        : null);

    const deliveryMethod = items[0].deliveryMethod;
    const deliveryAddress =
      items[0].deliveryAddressOverride ?? quote.client.deliveryAddress;

    const supplierOrderNumber = await generateNumber(tx, "PO");
    const order = await tx.supplierOrder.create({
      data: {
        supplierOrderNumber,
        supplierId,
        quoteId: quote.id,
        status: "PENDING",
        expectedEtaDate: expectedEtaDate ?? undefined,
        deliveryMethod,
        deliveryAddress,
        deliveryContactName: items[0].deliveryContactName ?? quote.client.name,
        deliveryContactPhone: items[0].deliveryContactPhone ?? null,
        createdByUserId: userId ?? undefined,
        items: {
          create: items.map((item) => ({
            quoteItemId: item.id,
            qty: item.qty,
          })),
        },
      },
    });

    await tx.quoteItem.updateMany({
      where: { id: { in: items.map((item) => item.id) } },
      data: { itemStatus: "ORDER_PENDING" },
    });

    const notifyUserIds = [
      quote.assignedSales?.id,
      quote.createdBy.id,
    ].filter(Boolean) as string[];

    notices.push({
      supplierOrderNumber: order.supplierOrderNumber,
      supplierName: supplier?.name ?? "supplier",
      notifyUserIds,
    });
  }

  return { quote, notices };
}

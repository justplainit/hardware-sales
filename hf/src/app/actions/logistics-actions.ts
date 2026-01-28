"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateNumber } from "@/lib/numbering";
import { getNotifyAdminOnGrn } from "@/lib/settings";
import { getReceivedStatusForDelivery } from "@/lib/workflows";
import { notifyUsers } from "@/lib/notifications";
import { updateQuoteStatusFromItems } from "@/lib/services/quote";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createGoodsReceiptAction(formData: FormData) {
  const session = await requireSession();
  if (!["TECH", "ADMIN", "SALES"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const supplierOrderId = String(formData.get("supplierOrderId") ?? "");
  const documentRef = String(formData.get("documentRef") ?? "");
  const attachmentUrl = String(formData.get("attachmentUrl") ?? "");

  if (!documentRef) {
    throw new Error("Document reference is required.");
  }

  const order = await prisma.supplierOrder.findUnique({
    where: { id: supplierOrderId },
    include: {
      quote: { include: { assignedSales: true } },
      items: { include: { quoteItem: true } },
    },
  });

  if (!order) {
    throw new Error("Supplier order not found.");
  }

  const itemInputs = order.items
    .map((orderItem) => {
      const qty = Number(formData.get(`qty_${orderItem.quoteItemId}`) ?? 0);
      return { quoteItemId: orderItem.quoteItemId, qty };
    })
    .filter((item) => item.qty > 0);

  if (itemInputs.length === 0) {
    throw new Error("No quantities entered.");
  }

  const { grnNumber, fullyReceivedItemIds } = await prisma.$transaction(async (tx) => {
    const grnNumber = await generateNumber(tx, "GRN");
    const receipt = await tx.goodsReceipt.create({
      data: {
        grnNumber,
        supplierOrderId,
        receivedByUserId: session.user.id,
        receivedAt: new Date(),
        documentRef,
        attachmentUrl: attachmentUrl || null,
        items: {
          create: itemInputs.map((input) => ({
            quoteItemId: input.quoteItemId,
            qtyReceived: input.qty,
          })),
        },
      },
    });

    const receivedTotals = await tx.goodsReceiptItem.groupBy({
      by: ["quoteItemId"],
      where: { goodsReceipt: { supplierOrderId } },
      _sum: { qtyReceived: true },
    });

    const receivedMap = new Map(
      receivedTotals.map((entry) => [
        entry.quoteItemId,
        entry._sum.qtyReceived ?? 0,
      ]),
    );

    const fullyReceivedItemIds: string[] = [];
    for (const orderItem of order.items) {
      const receivedQty = receivedMap.get(orderItem.quoteItemId) ?? 0;
      if (receivedQty >= orderItem.qty) {
        fullyReceivedItemIds.push(orderItem.quoteItemId);
        const status = getReceivedStatusForDelivery(
          orderItem.quoteItem.deliveryMethod,
        );
        await tx.quoteItem.update({
          where: { id: orderItem.quoteItemId },
          data: { itemStatus: status },
        });
      }
    }

    const allReceived = order.items.every(
      (orderItem) => (receivedMap.get(orderItem.quoteItemId) ?? 0) >= orderItem.qty,
    );

    await tx.supplierOrder.update({
      where: { id: supplierOrderId },
      data: {
        status: allReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
      },
    });

    if (fullyReceivedItemIds.length > 0) {
      const technicians = await tx.quoteItem.findMany({
        where: { id: { in: fullyReceivedItemIds } },
        select: { id: true, assignedTechnicianUserId: true },
      });

      for (const item of technicians) {
        if (!item.assignedTechnicianUserId) continue;
        const existingTask = await tx.task.findFirst({
          where: {
            quoteItemId: item.id,
            userId: item.assignedTechnicianUserId,
            status: "OPEN",
          },
        });
        if (!existingTask) {
          await tx.task.create({
            data: {
              quoteItemId: item.id,
              userId: item.assignedTechnicianUserId,
              title: "Schedule installation/delivery",
            },
          });
        }
      }
    }

    return { grnNumber: receipt.grnNumber, fullyReceivedItemIds };
  });

  const notifyUserIds = [
    order.quote.assignedSalesUserId,
    order.quote.createdByUserId,
  ].filter(Boolean) as string[];

  const adminNotify = await getNotifyAdminOnGrn();
  if (adminNotify) {
    const adminIds = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    notifyUserIds.push(...adminIds.map((admin) => admin.id));
  }

  await notifyUsers(
    notifyUserIds,
    `Goods receipt ${grnNumber} created`,
    `Goods received for supplier order ${order.supplierOrderNumber}.`,
  );

  const techIds = order.items
    .filter((item) => fullyReceivedItemIds.includes(item.quoteItemId))
    .map((item) => item.quoteItem.assignedTechnicianUserId)
    .filter(Boolean) as string[];

  await notifyUsers(
    techIds,
    "Goods received - schedule installation",
    `Supplier order ${order.supplierOrderNumber} items are received.`,
  );

  revalidatePath(`/supplier-orders/${supplierOrderId}`);
  revalidatePath(`/quotes/${order.quoteId}`);
}

export async function createDispatchAction(formData: FormData) {
  const session = await requireSession();
  if (!["TECH", "ADMIN", "SALES"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const quoteId = String(formData.get("quoteId") ?? "");
  const destination = String(formData.get("destination") ?? "INSTALLATION");
  const notes = String(formData.get("notes") ?? "");

  if (!quoteId) {
    throw new Error("Quote is required.");
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true },
  });

  if (!quote) {
    throw new Error("Quote not found.");
  }

  const itemInputs = quote.items
    .map((item) => {
      const qty = Number(formData.get(`qty_${item.id}`) ?? 0);
      return { quoteItemId: item.id, qty };
    })
    .filter((item) => item.qty > 0);

  if (itemInputs.length === 0) {
    throw new Error("No quantities entered.");
  }

  const dispatch = await prisma.$transaction(async (tx) => {
    const dispatchNumber = await generateNumber(tx, "DIS");
    const dispatch = await tx.dispatch.create({
      data: {
        dispatchNumber,
        quoteId,
        dispatchedByUserId: session.user.id,
        dispatchedAt: new Date(),
        destination: destination as "INSTALLATION" | "DELIVERY",
        notes: notes || null,
        items: {
          create: itemInputs.map((input) => ({
            quoteItemId: input.quoteItemId,
            qtyDispatched: input.qty,
          })),
        },
      },
    });

    await tx.quoteItem.updateMany({
      where: { id: { in: itemInputs.map((input) => input.quoteItemId) } },
      data: { itemStatus: "DISPATCHED" },
    });

    await updateQuoteStatusFromItems(tx, quoteId);

    return dispatch;
  });

  const techIds = quote.items
    .filter((item) => itemInputs.some((input) => input.quoteItemId === item.id))
    .map((item) => item.assignedTechnicianUserId)
    .filter(Boolean) as string[];

  const notifyIds = [
    quote.assignedSalesUserId,
    quote.createdByUserId,
    ...techIds,
  ].filter(Boolean) as string[];

  await notifyUsers(
    notifyIds,
    `Dispatch ${dispatch.dispatchNumber} created`,
    `Items have been dispatched for quote ${quote.quoteNumber}.`,
  );

  revalidatePath(`/quotes/${quoteId}`);
}

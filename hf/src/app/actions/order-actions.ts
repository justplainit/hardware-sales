"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyUsers } from "@/lib/notifications";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function markSupplierOrderOrderedAction(formData: FormData) {
  const session = await requireSession();
  if (!["SALES", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const supplierOrderId = String(formData.get("supplierOrderId") ?? "");
  const quoteId = String(formData.get("quoteId") ?? "");

  const order = await prisma.supplierOrder.findUnique({
    where: { id: supplierOrderId },
    include: { quote: { include: { client: true, invoice: true } } },
  });

  if (!order) {
    throw new Error("Supplier order not found.");
  }

  const invoice = order.quote.invoice;
  const canOrder =
    order.quote.client.isPrivileged ||
    invoice?.status === "PAID" ||
    invoice?.paymentRequired === "PRIVILEGED_ALLOWED";

  if (!canOrder) {
    throw new Error("Invoice must be paid before ordering for standard clients.");
  }

  await prisma.supplierOrder.update({
    where: { id: supplierOrderId },
    data: { status: "ORDERED", orderedAt: new Date() },
  });

  await prisma.quoteItem.updateMany({
    where: { supplierOrderItems: { some: { supplierOrderId } } },
    data: { itemStatus: "ORDERED" },
  });

  const notifyUserIds = [
    order.quote.assignedSalesUserId,
    order.quote.createdByUserId,
  ].filter(Boolean) as string[];

  await notifyUsers(
    notifyUserIds,
    `Supplier order ${order.supplierOrderNumber} marked ordered`,
    `Supplier order for ${order.quote.quoteNumber} is now ordered.`,
  );

  revalidatePath(`/supplier-orders/${supplierOrderId}`);
  revalidatePath(`/quotes/${quoteId}`);
}

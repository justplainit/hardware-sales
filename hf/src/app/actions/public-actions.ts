"use server";

import { prisma } from "@/lib/db";
import { notifyUsers } from "@/lib/notifications";
import { createSupplierOrdersForQuote } from "@/lib/services/supplierOrders";

async function getQuoteByToken(token: string) {
  const accessToken = await prisma.quoteAccessToken.findUnique({
    where: { token },
    include: {
      quote: {
        include: { items: true, client: true, assignedSales: true },
      },
    },
  });

  if (!accessToken) {
    throw new Error("Invalid token.");
  }

  if (accessToken.expiresAt && accessToken.expiresAt < new Date()) {
    throw new Error("Token expired.");
  }

  return accessToken.quote;
}

export async function approveQuoteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const quote = await getQuoteByToken(token);

  const existingOrders = await prisma.supplierOrder.count({
    where: { quoteId: quote.id },
  });

  let result: Awaited<ReturnType<typeof createSupplierOrdersForQuote>> | null =
    null;
  await prisma.$transaction(async (tx) => {
    await tx.quote.update({
      where: { id: quote.id },
      data: { status: "APPROVED", clientDecision: "APPROVED" },
    });

    if (existingOrders === 0) {
      result = await createSupplierOrdersForQuote(tx, quote.id, null);
    }
  });

  if (existingOrders === 0 && result) {
    for (const notice of result.notices) {
      await notifyUsers(
        notice.notifyUserIds,
        `Supplier order ${notice.supplierOrderNumber} created`,
        `Supplier order for ${notice.supplierName} was generated from ${result.quote.quoteNumber}.`,
      );
    }
  }

  const notifyUserIds = [
    quote.assignedSalesUserId,
    quote.createdByUserId,
  ].filter(Boolean) as string[];

  await notifyUsers(
    notifyUserIds,
    `Quote ${quote.quoteNumber} approved`,
    `${quote.client.name} approved the quote.`,
  );
}

export async function declineQuoteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const message = String(formData.get("message") ?? "");
  const quote = await getQuoteByToken(token);

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: "DECLINED", clientDecision: "DECLINED" },
  });

  const notifyUserIds = [
    quote.assignedSalesUserId,
    quote.createdByUserId,
  ].filter(Boolean) as string[];

  await notifyUsers(
    notifyUserIds,
    `Quote ${quote.quoteNumber} declined`,
    `${quote.client.name} declined the quote. ${message ? `Message: ${message}` : ""}`,
  );
}

export async function questionQuoteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const message = String(formData.get("message") ?? "");
  const quote = await getQuoteByToken(token);

  const notifyUserIds = [
    quote.assignedSalesUserId,
    quote.createdByUserId,
  ].filter(Boolean) as string[];

  await notifyUsers(
    notifyUserIds,
    `Client question for ${quote.quoteNumber}`,
    `${quote.client.name} asked: ${message}`,
  );
}

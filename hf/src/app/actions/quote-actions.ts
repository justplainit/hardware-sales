"use server";

import { z } from "zod";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateNumber } from "@/lib/numbering";
import { calculateMarginPct } from "@/lib/workflows";
import { getMinMarginPct } from "@/lib/settings";
import { recalculateQuoteTotals, updateQuoteStatusFromItems } from "@/lib/services/quote";
import { createSupplierOrdersForQuote } from "@/lib/services/supplierOrders";
import { notifyUsers } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";

const quoteItemDraftSchema = z.object({
  description: z.string().min(1),
  qty: z.number().int().min(1),
});

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function createQuoteRequestAction(formData: FormData) {
  const session = await requireSession();
  if (!["TECH", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const clientId = String(formData.get("clientId") ?? "");
  const salesOwnerId = String(formData.get("salesOwnerId") ?? "");
  const itemsRaw = String(formData.get("itemsJson") ?? "[]");

  if (!clientId) {
    throw new Error("Client is required.");
  }

  const items = z
    .array(quoteItemDraftSchema)
    .min(1)
    .parse(JSON.parse(itemsRaw));

  const quote = await prisma.$transaction(async (tx) => {
    const quoteNumber = await generateNumber(tx, "Q");
    const quote = await tx.quote.create({
      data: {
        quoteNumber,
        clientId,
        createdByUserId: session.user.id,
        assignedSalesUserId: salesOwnerId || undefined,
        status: "DRAFT",
      },
    });

    await tx.quoteItem.createMany({
      data: items.map((item) => ({
        quoteId: quote.id,
        description: item.description,
        qty: item.qty,
      })),
    });

    return quote;
  });

  if (salesOwnerId) {
    await notifyUsers(
      [salesOwnerId],
      "New hardware request assigned",
      `Quote ${quote.quoteNumber} was created and assigned to you.`,
    );
  }

  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteItemAction(formData: FormData) {
  const session = await requireSession();
  if (!["SALES", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const quoteItemId = String(formData.get("quoteItemId") ?? "");
  const quoteId = String(formData.get("quoteId") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "") || null;
  const deliveryMethod = String(formData.get("deliveryMethod") ?? "TO_OFFICE");

  const costPrice = toNumber(formData.get("costPrice"));
  const sellPrice = toNumber(formData.get("sellPrice"));
  const marginPct = calculateMarginPct(costPrice, sellPrice);

  const etaDateRaw = String(formData.get("etaDate") ?? "");
  const etaDate = etaDateRaw ? new Date(etaDateRaw) : null;
  const assignedTechnicianUserId =
    String(formData.get("assignedTechnicianUserId") ?? "") || null;

  const deliveryContactName = String(formData.get("deliveryContactName") ?? "");
  const deliveryContactPhone = String(formData.get("deliveryContactPhone") ?? "");
  const deliveryAddressOverride = String(
    formData.get("deliveryAddressOverride") ?? "",
  );

  await prisma.quoteItem.update({
    where: { id: quoteItemId },
    data: {
      supplierId,
      costPrice,
      sellPrice,
      marginPct,
      etaDate,
      deliveryMethod: deliveryMethod as "TO_OFFICE" | "DIRECT_TO_END_USER" | "DIRECT_TO_SITE",
      assignedTechnicianUserId,
      deliveryContactName: deliveryContactName || null,
      deliveryContactPhone: deliveryContactPhone || null,
      deliveryAddressOverride: deliveryAddressOverride || null,
    },
  });

  await recalculateQuoteTotals(prisma, quoteId);

  const minMargin = await getMinMarginPct();
  if (marginPct < minMargin) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await notifyUsers(
      admins.map((admin) => admin.id),
      "Margin below threshold",
      `Quote item margin ${marginPct}% is below ${minMargin}%.`,
    );
  }

  revalidatePath(`/quotes/${quoteId}`);
}

export async function sendQuoteAction(formData: FormData) {
  const session = await requireSession();
  if (!["SALES", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const quoteId = String(formData.get("quoteId") ?? "");
  const clientContactName = String(formData.get("clientContactName") ?? "");
  const clientContactEmail = String(formData.get("clientContactEmail") ?? "");

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, client: true, assignedSales: true, createdBy: true },
  });

  if (!quote) {
    throw new Error("Quote not found.");
  }

  const missingSuppliers = quote.items.some((item) => !item.supplierId);
  const missingPricing = quote.items.some((item) => Number(item.sellPrice) <= 0);
  if (missingSuppliers || missingPricing) {
    throw new Error("All items must have supplier and pricing before sending.");
  }

  const token = crypto.randomBytes(24).toString("hex");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/client/quote/${token}`;

  await prisma.$transaction(async (tx) => {
    await tx.quoteAccessToken.create({
      data: {
        quoteId,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        clientContactName: clientContactName || quote.clientContactName,
        clientContactEmail: clientContactEmail || quote.clientContactEmail,
        clientDecision: "PENDING",
      },
    });
  });

  const notifyUserIds = [
    quote.assignedSales?.id,
    quote.createdBy.id,
  ].filter(Boolean) as string[];

  await notifyUsers(
    notifyUserIds,
    `Quote ${quote.quoteNumber} sent`,
    `Quote sent to client. Public link: ${link}`,
  );

  const recipient = clientContactEmail || quote.clientContactEmail || quote.client.billingEmail;
  if (recipient) {
    await sendEmail({
      to: recipient,
      subject: `Quote ${quote.quoteNumber} for approval`,
      text: `Please review your quote here: ${link}`,
    });
  }

  revalidatePath(`/quotes/${quoteId}`);
}

export async function createSupplierOrdersAction(formData: FormData) {
  const session = await requireSession();
  if (!["SALES", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const quoteId = String(formData.get("quoteId") ?? "");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote || quote.status !== "APPROVED") {
    throw new Error("Quote must be approved before creating supplier orders.");
  }

  const result = await prisma.$transaction((tx) =>
    createSupplierOrdersForQuote(tx, quoteId, session.user.id),
  );

  for (const notice of result.notices) {
    await notifyUsers(
      notice.notifyUserIds,
      `Supplier order ${notice.supplierOrderNumber} created`,
      `Supplier order for ${notice.supplierName} was generated from ${result.quote.quoteNumber}.`,
    );
  }

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/supplier-orders");
}

export async function createInvoiceAction(formData: FormData) {
  const session = await requireSession();
  if (!["ACCOUNTS", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const quoteId = String(formData.get("quoteId") ?? "");

  const invoiceId = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: quoteId },
      include: { client: true },
    });
    if (!quote) {
      throw new Error("Quote not found.");
    }

    const existing = await tx.invoice.findUnique({ where: { quoteId } });
    if (existing) {
      return existing.id;
    }

    const invoiceNumber = await generateNumber(tx, "INV");
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        quoteId,
        status: "CREATED",
        paymentRequired: quote.client.isPrivileged
          ? "PRIVILEGED_ALLOWED"
          : "PREPAY_REQUIRED",
      },
    });
    return invoice.id;
  });

  revalidatePath(`/quotes/${quoteId}`);
  return invoiceId;
}

export async function markInvoicePaidAction(formData: FormData) {
  const session = await requireSession();
  if (!["ACCOUNTS", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const quoteId = String(formData.get("quoteId") ?? "");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", markedPaidAt: new Date() },
  });

  revalidatePath(`/quotes/${quoteId}`);
}

export async function markInvoicePaymentRequiredAction(formData: FormData) {
  const session = await requireSession();
  if (!["ACCOUNTS", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const quoteId = String(formData.get("quoteId") ?? "");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paymentRequired: "PRIVILEGED_ALLOWED" },
  });

  revalidatePath(`/quotes/${quoteId}`);
}

export async function markQuoteItemInstalledAction(formData: FormData) {
  const session = await requireSession();
  if (!["TECH", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const quoteItemId = String(formData.get("quoteItemId") ?? "");
  const quoteId = String(formData.get("quoteId") ?? "");
  const serialNumber = String(formData.get("serialNumber") ?? "");
  const warrantyExpiry = String(formData.get("warrantyExpiryDate") ?? "");

  await prisma.quoteItem.update({
    where: { id: quoteItemId },
    data: {
      itemStatus: "INSTALLED",
      serialNumber: serialNumber || null,
      warrantyExpiryDate: warrantyExpiry ? new Date(warrantyExpiry) : null,
    },
  });

  await updateQuoteStatusFromItems(prisma, quoteId);

  revalidatePath(`/quotes/${quoteId}`);
}

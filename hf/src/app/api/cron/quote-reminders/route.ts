import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { notifyUsers } from "@/lib/notifications";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const reminders = await prisma.quote.findMany({
    where: {
      status: "SENT",
      clientDecision: "PENDING",
      sentAt: { not: null },
      OR: [
        { reminder24SentAt: null, sentAt: { lte: new Date(now.getTime() - dayMs) } },
        { reminder72SentAt: null, sentAt: { lte: new Date(now.getTime() - 3 * dayMs) } },
      ],
    },
    include: { client: true },
  });

  for (const quote of reminders) {
    const recipient = quote.clientContactEmail ?? quote.client.billingEmail;
    if (recipient) {
      await sendEmail({
        to: recipient,
        subject: `Reminder: Quote ${quote.quoteNumber}`,
        text: `Please review your quote: ${quote.quoteNumber}.`,
      });
    }

    const updateData: { reminder24SentAt?: Date; reminder72SentAt?: Date } = {};
    if (!quote.reminder24SentAt && quote.sentAt && quote.sentAt <= new Date(now.getTime() - dayMs)) {
      updateData.reminder24SentAt = now;
    }
    if (!quote.reminder72SentAt && quote.sentAt && quote.sentAt <= new Date(now.getTime() - 3 * dayMs)) {
      updateData.reminder72SentAt = now;
    }

    await prisma.quote.update({
      where: { id: quote.id },
      data: updateData,
    });

    const notifyUserIds = [quote.assignedSalesUserId, quote.createdByUserId].filter(
      Boolean,
    ) as string[];
    if (notifyUserIds.length > 0) {
      await notifyUsers(
        notifyUserIds,
        `Reminder sent for ${quote.quoteNumber}`,
        "Client reminder was issued.",
      );
    }
  }

  const staleQuotes = await prisma.quote.findMany({
    where: {
      status: "SENT",
      clientDecision: "PENDING",
      sentAt: { lte: new Date(now.getTime() - 7 * dayMs) },
    },
  });

  for (const quote of staleQuotes) {
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "STALE", staleAt: now },
    });

    const notifyUserIds = [quote.assignedSalesUserId, quote.createdByUserId].filter(
      Boolean,
    ) as string[];
    if (notifyUserIds.length > 0) {
      await notifyUsers(
        notifyUserIds,
        `Quote ${quote.quoteNumber} is stale`,
        "Client did not respond within 7 days.",
      );
    }
  }

  return NextResponse.json({ ok: true });
}

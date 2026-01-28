import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
  const overdueOrders = await prisma.supplierOrder.findMany({
    where: {
      expectedEtaDate: { lt: now },
      status: { in: ["PENDING", "ORDERED", "PARTIALLY_RECEIVED"] },
    },
    include: { quote: true, supplier: true },
  });

  if (overdueOrders.length === 0) {
    return NextResponse.json({ ok: true, overdue: 0 });
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const adminIds = admins.map((admin) => admin.id);

  for (const order of overdueOrders) {
    const notifyUserIds = [
      order.quote.assignedSalesUserId,
      order.quote.createdByUserId,
      ...adminIds,
    ].filter(Boolean) as string[];

    await notifyUsers(
      notifyUserIds,
      `ETA overdue for ${order.supplierOrderNumber}`,
      `Supplier ${order.supplier.name} is overdue on quote ${order.quote.quoteNumber}.`,
    );
  }

  return NextResponse.json({ ok: true, overdue: overdueOrders.length });
}

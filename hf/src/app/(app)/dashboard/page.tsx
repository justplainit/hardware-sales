import Link from "next/link";
import { prisma } from "@/lib/db";

const statusOrder = [
  "DRAFT",
  "SENT",
  "APPROVED",
  "DECLINED",
  "STALE",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
] as const;

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  APPROVED: "Approved",
  DECLINED: "Declined",
  STALE: "Stale",
  PARTIALLY_FULFILLED: "Partially Fulfilled",
  FULFILLED: "Fulfilled",
};

export default async function DashboardPage() {
  const quotes = await prisma.quote.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const staleApprovals = await prisma.quote.count({
    where: {
      OR: [
        { status: "STALE" },
        { status: "SENT", sentAt: { lte: sevenDaysAgo } },
      ],
    },
  });

  const overdueSupplierOrders = await prisma.supplierOrder.count({
    where: {
      expectedEtaDate: { lt: now },
      status: { in: ["PENDING", "ORDERED", "PARTIALLY_RECEIVED"] },
    },
  });

  const receivedNotDispatched = await prisma.quoteItem.count({
    where: { itemStatus: "RECEIVED_OFFICE" },
  });

  const dispatchedNotInstalled = await prisma.quoteItem.count({
    where: { itemStatus: "DISPATCHED" },
  });

  const grouped = statusOrder.reduce(
    (acc, status) => {
      acc[status] = quotes.filter((quote) => quote.status === status);
      return acc;
    },
    {} as Record<(typeof statusOrder)[number], typeof quotes>,
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Stale approvals</p>
          <p className="mt-2 text-2xl font-semibold">{staleApprovals}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">
            Overdue supplier orders
          </p>
          <p className="mt-2 text-2xl font-semibold">{overdueSupplierOrders}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">
            Received not dispatched
          </p>
          <p className="mt-2 text-2xl font-semibold">{receivedNotDispatched}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">
            Dispatched not installed
          </p>
          <p className="mt-2 text-2xl font-semibold">{dispatchedNotInstalled}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quote Pipeline</h2>
          <Link
            href="/quotes/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Request
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {statusOrder.map((status) => (
            <div
              key={status}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <h3 className="text-sm font-semibold text-slate-700">
                {statusLabel[status]}
              </h3>
              <div className="mt-3 space-y-2">
                {grouped[status].length === 0 ? (
                  <p className="text-xs text-slate-400">No quotes</p>
                ) : (
                  grouped[status].map((quote) => (
                    <Link
                      key={quote.id}
                      href={`/quotes/${quote.id}`}
                      className="block rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700 hover:border-slate-200"
                    >
                      <div className="font-semibold">{quote.quoteNumber}</div>
                      <div className="text-slate-500">{quote.client.name}</div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

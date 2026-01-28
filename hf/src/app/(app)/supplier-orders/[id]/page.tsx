import Link from "next/link";
import { prisma } from "@/lib/db";
import { markSupplierOrderOrderedAction } from "@/app/actions/order-actions";

export default async function SupplierOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await prisma.supplierOrder.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      quote: { include: { client: true } },
      items: { include: { quoteItem: true } },
    },
  });

  if (!order) {
    return <p>Supplier order not found.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              {order.supplierOrderNumber}
            </h1>
            <p className="text-sm text-slate-600">{order.supplier.name}</p>
          </div>
          <div className="text-sm text-slate-600">
            Status: <span className="font-semibold">{order.status}</span>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-slate-600">
          <p>Quote: {order.quote.quoteNumber}</p>
          <p>
            ETA: {order.expectedEtaDate ? new Date(order.expectedEtaDate).toDateString() : "-"}
          </p>
          <p>Delivery method: {order.deliveryMethod}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {order.status === "PENDING" ? (
            <form action={markSupplierOrderOrderedAction}>
              <input type="hidden" name="supplierOrderId" value={order.id} />
              <input type="hidden" name="quoteId" value={order.quoteId} />
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Mark Ordered
              </button>
            </form>
          ) : null}
          <Link
            href={`/goods-receipts/new?orderId=${order.id}`}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Create Goods Receipt
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-700">Items</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <span>{item.quoteItem.description}</span>
              <span>Qty {item.qty}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

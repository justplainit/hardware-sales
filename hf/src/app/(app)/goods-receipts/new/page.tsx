import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { createGoodsReceiptAction } from "@/app/actions/logistics-actions";

export default async function GoodsReceiptPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const session = await getServerSession(authOptions);
  requireRole(session, ["TECH", "ADMIN", "SALES"]);

  const orders = await prisma.supplierOrder.findMany({
    where: { status: { in: ["ORDERED", "PARTIALLY_RECEIVED"] } },
    include: { supplier: true, items: { include: { quoteItem: true } } },
    orderBy: { createdAt: "desc" },
  });

  const selectedOrder =
    orders.find((order) => order.id === searchParams.orderId) ?? orders[0];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Goods Receipt (GRN)</h1>

      <form method="GET" className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-700">
          Supplier Order
          <select
            name="orderId"
            defaultValue={selectedOrder?.id ?? ""}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Select order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.supplierOrderNumber} • {order.supplier.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Load order
        </button>
      </form>

      {selectedOrder ? (
        <form
          action={createGoodsReceiptAction}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
        >
          <input type="hidden" name="supplierOrderId" value={selectedOrder.id} />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="documentRef"
              placeholder="Document reference"
              required
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              name="attachmentUrl"
              placeholder="Attachment URL (optional)"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            {selectedOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{item.quoteItem.description}</p>
                  <p className="text-xs text-slate-500">Qty ordered {item.qty}</p>
                </div>
                <input
                  name={`qty_${item.quoteItemId}`}
                  type="number"
                  min={0}
                  max={item.qty}
                  placeholder="Qty received"
                  className="w-32 rounded-md border border-slate-200 px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Submit GRN
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">No supplier orders awaiting receipt.</p>
      )}
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function SupplierOrdersPage() {
  const orders = await prisma.supplierOrder.findMany({
    include: { supplier: true, quote: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Supplier Orders</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Order
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Supplier
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Status
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                ETA
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-2 font-medium text-slate-800">
                  <Link href={`/supplier-orders/${order.id}`}>
                    {order.supplierOrderNumber}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {order.supplier.name}
                </td>
                <td className="px-4 py-2 text-slate-600">{order.status}</td>
                <td className="px-4 py-2 text-slate-600">
                  {order.expectedEtaDate
                    ? new Date(order.expectedEtaDate).toDateString()
                    : "-"}
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No supplier orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

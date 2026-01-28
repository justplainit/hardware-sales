import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMinMarginPct } from "@/lib/settings";
import {
  updateQuoteItemAction,
  sendQuoteAction,
  createSupplierOrdersAction,
  createInvoiceAction,
  markInvoicePaidAction,
  markInvoicePaymentRequiredAction,
  markQuoteItemInstalledAction,
} from "@/app/actions/quote-actions";

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const quote = await prisma.quote.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      createdBy: true,
      assignedSales: true,
      items: { include: { supplier: true, assignedTechnician: true } },
      supplierOrders: true,
      invoice: true,
      accessTokens: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!quote) {
    return <p>Quote not found.</p>;
  }

  const isSales = ["SALES", "ADMIN"].includes(session?.user.role ?? "");
  const isAccounts = ["ACCOUNTS", "ADMIN"].includes(session?.user.role ?? "");
  const isTech = ["TECH", "ADMIN"].includes(session?.user.role ?? "");

  const suppliers = isSales
    ? await prisma.supplier.findMany({ orderBy: { name: "asc" } })
    : [];
  const technicians = await prisma.user.findMany({
    where: { role: "TECH" },
    orderBy: { name: "asc" },
  });

  const minMargin = await getMinMarginPct();
  const publicToken = quote.accessTokens[0]?.token;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicLink = publicToken ? `${appUrl}/client/quote/${publicToken}` : null;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{quote.quoteNumber}</h1>
            <p className="text-sm text-slate-600">{quote.client.name}</p>
          </div>
          <div className="text-sm text-slate-600">
            Status: <span className="font-semibold">{quote.status}</span>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-slate-500">Subtotal</p>
            <p className="text-lg font-semibold">
              {Number(quote.subtotal).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">VAT</p>
            <p className="text-lg font-semibold">
              {Number(quote.vat).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Total</p>
            <p className="text-lg font-semibold">
              {Number(quote.total).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-600">
          <p>
            Sales owner: {quote.assignedSales?.name ?? "Unassigned"} | Created by{" "}
            {quote.createdBy.name}
          </p>
          <p>
            Client contact: {quote.clientContactName ?? "-"} (
            {quote.clientContactEmail ?? quote.client.billingEmail})
          </p>
        </div>

        {publicLink ? (
          <div className="mt-3 text-sm text-slate-600">
            Client link:{" "}
            <a className="text-blue-600 underline" href={publicLink}>
              {publicLink}
            </a>
          </div>
        ) : null}
      </section>

      {isSales ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700">Send to client</h2>
          <form action={sendQuoteAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <input type="hidden" name="quoteId" value={quote.id} />
            <input
              name="clientContactName"
              defaultValue={quote.clientContactName ?? quote.client.name}
              placeholder="Contact name"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              name="clientContactEmail"
              type="email"
              defaultValue={quote.clientContactEmail ?? quote.client.billingEmail}
              placeholder="Contact email"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Send quote
            </button>
          </form>
        </section>
      ) : null}

      {isSales && quote.status === "APPROVED" && quote.supplierOrders.length === 0 ? (
        <form action={createSupplierOrdersAction}>
          <input type="hidden" name="quoteId" value={quote.id} />
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Create Supplier Orders
          </button>
        </form>
      ) : null}

      {isAccounts ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700">Invoice</h2>
          {quote.invoice ? (
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>
                Invoice #{quote.invoice.invoiceNumber} • Status{" "}
                <span className="font-semibold">{quote.invoice.status}</span>
              </p>
              <p>Payment required: {quote.invoice.paymentRequired}</p>
              <div className="flex flex-wrap gap-2">
                {quote.invoice.status !== "PAID" ? (
                  <form action={markInvoicePaidAction}>
                    <input type="hidden" name="invoiceId" value={quote.invoice.id} />
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <button
                      type="submit"
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Mark paid
                    </button>
                  </form>
                ) : null}
                {quote.invoice.paymentRequired !== "PRIVILEGED_ALLOWED" ? (
                  <form action={markInvoicePaymentRequiredAction}>
                    <input type="hidden" name="invoiceId" value={quote.invoice.id} />
                    <input type="hidden" name="quoteId" value={quote.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                    >
                      Allow privileged terms
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ) : (
            <form action={createInvoiceAction} className="mt-3">
              <input type="hidden" name="quoteId" value={quote.id} />
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create invoice
              </button>
            </form>
          )}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Items</h2>
          <Link
            href="/supplier-orders"
            className="text-sm text-blue-600 hover:underline"
          >
            View supplier orders
          </Link>
        </div>
        <div className="space-y-4">
          {quote.items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-xs text-slate-500">
                    Qty {item.qty} • Status {item.itemStatus}
                  </p>
                </div>
                <div className="text-sm text-slate-600">
                  Margin {item.marginPct.toFixed(1)}%
                  {item.marginPct < minMargin ? (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      Below threshold
                    </span>
                  ) : null}
                </div>
              </div>

              {isSales ? (
                <form
                  action={updateQuoteItemAction}
                  className="mt-4 grid gap-3 md:grid-cols-3"
                >
                  <input type="hidden" name="quoteItemId" value={item.id} />
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <label className="text-xs font-medium text-slate-600">
                    Supplier
                    <select
                      name="supplierId"
                      defaultValue={item.supplierId ?? ""}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    >
                      <option value="">Select</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Cost price
                    <input
                      name="costPrice"
                      type="number"
                      step="0.01"
                      defaultValue={Number(item.costPrice)}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Sell price
                    <input
                      name="sellPrice"
                      type="number"
                      step="0.01"
                      defaultValue={Number(item.sellPrice)}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    ETA
                    <input
                      name="etaDate"
                      type="date"
                      defaultValue={
                        item.etaDate
                          ? new Date(item.etaDate).toISOString().split("T")[0]
                          : ""
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Delivery method
                    <select
                      name="deliveryMethod"
                      defaultValue={item.deliveryMethod}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    >
                      <option value="TO_OFFICE">To office</option>
                      <option value="DIRECT_TO_END_USER">Direct to end user</option>
                      <option value="DIRECT_TO_SITE">Direct to site</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Assigned tech
                    <select
                      name="assignedTechnicianUserId"
                      defaultValue={item.assignedTechnicianUserId ?? ""}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    >
                      <option value="">Unassigned</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Delivery contact
                    <input
                      name="deliveryContactName"
                      defaultValue={item.deliveryContactName ?? ""}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    Contact phone
                    <input
                      name="deliveryContactPhone"
                      defaultValue={item.deliveryContactPhone ?? ""}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-600 md:col-span-2">
                    Address override
                    <input
                      name="deliveryAddressOverride"
                      defaultValue={item.deliveryAddressOverride ?? ""}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <div className="flex items-end md:col-span-3">
                    <button
                      type="submit"
                      className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Update item
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                  <p>Supplier: {item.supplier?.name ?? "-"}</p>
                  <p>ETA: {item.etaDate ? new Date(item.etaDate).toDateString() : "-"}</p>
                  <p>Delivery: {item.deliveryMethod}</p>
                </div>
              )}

              {isTech && ["DISPATCHED", "DELIVERED_DIRECT"].includes(item.itemStatus) ? (
                <form
                  action={markQuoteItemInstalledAction}
                  className="mt-4 grid gap-3 md:grid-cols-3"
                >
                  <input type="hidden" name="quoteItemId" value={item.id} />
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input
                    name="serialNumber"
                    placeholder="Serial number"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    name="warrantyExpiryDate"
                    type="date"
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Mark installed
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-700">Supplier Orders</h2>
        <div className="mt-3 space-y-2 text-sm">
          {quote.supplierOrders.length === 0 ? (
            <p className="text-slate-500">No supplier orders yet.</p>
          ) : (
            quote.supplierOrders.map((order) => (
              <Link
                key={order.id}
                href={`/supplier-orders/${order.id}`}
                className="block rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-slate-700"
              >
                {order.supplierOrderNumber} • {order.status}
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

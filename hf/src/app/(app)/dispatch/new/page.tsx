import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { createDispatchAction } from "@/app/actions/logistics-actions";

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: { quoteId?: string };
}) {
  const session = await getServerSession(authOptions);
  requireRole(session, ["TECH", "ADMIN", "SALES"]);

  const quotes = await prisma.quote.findMany({
    where: { items: { some: { itemStatus: "RECEIVED_OFFICE" } } },
    include: { items: true, client: true },
    orderBy: { createdAt: "desc" },
  });

  const selectedQuote =
    quotes.find((quote) => quote.id === searchParams.quoteId) ?? quotes[0];

  const availableItems =
    selectedQuote?.items.filter((item) => item.itemStatus === "RECEIVED_OFFICE") ??
    [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dispatch</h1>

      <form method="GET" className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="text-sm font-medium text-slate-700">
          Quote
          <select
            name="quoteId"
            defaultValue={selectedQuote?.id ?? ""}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Select quote</option>
            {quotes.map((quote) => (
              <option key={quote.id} value={quote.id}>
                {quote.quoteNumber} • {quote.client.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Load quote
        </button>
      </form>

      {selectedQuote ? (
        <form
          action={createDispatchAction}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
        >
          <input type="hidden" name="quoteId" value={selectedQuote.id} />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              name="destination"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="INSTALLATION">Installation</option>
              <option value="DELIVERY">Delivery</option>
            </select>
            <input
              name="notes"
              placeholder="Notes"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            {availableItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{item.description}</p>
                  <p className="text-xs text-slate-500">Qty {item.qty}</p>
                </div>
                <input
                  name={`qty_${item.id}`}
                  type="number"
                  min={0}
                  max={item.qty}
                  placeholder="Qty dispatched"
                  className="w-32 rounded-md border border-slate-200 px-2 py-1 text-sm"
                />
              </div>
            ))}
            {availableItems.length === 0 ? (
              <p className="text-sm text-slate-500">
                No received items ready for dispatch.
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Submit dispatch
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500">No quotes awaiting dispatch.</p>
      )}
    </div>
  );
}

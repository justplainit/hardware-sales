import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quotes</h1>
        <Link
          href="/quotes/new"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Request
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Quote
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Client
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Status
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">
                  <Link href={`/quotes/${quote.id}`}>{quote.quoteNumber}</Link>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {quote.client.name}
                </td>
                <td className="px-4 py-2 text-slate-600">{quote.status}</td>
                <td className="px-4 py-2 text-slate-600">
                  {Number(quote.total).toFixed(2)}
                </td>
              </tr>
            ))}
            {quotes.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No quotes yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

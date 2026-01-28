import { prisma } from "@/lib/db";
import {
  approveQuoteAction,
  declineQuoteAction,
  questionQuoteAction,
} from "@/app/actions/public-actions";

export default async function ClientQuotePage({
  params,
}: {
  params: { token: string };
}) {
  const accessToken = await prisma.quoteAccessToken.findUnique({
    where: { token: params.token },
    include: { quote: { include: { client: true, items: true } } },
  });

  if (!accessToken || (accessToken.expiresAt && accessToken.expiresAt < new Date())) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="text-sm text-slate-600">This quote link is invalid or expired.</p>
      </div>
    );
  }

  const quote = accessToken.quote;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold">Quote {quote.quoteNumber}</h1>
          <p className="text-sm text-slate-600">{quote.client.name}</p>
          <div className="mt-3 text-sm text-slate-600">
            Total: <span className="font-semibold">{Number(quote.total).toFixed(2)}</span>
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700">Items</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {quote.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span>{item.description}</span>
                <span>
                  Qty {item.qty} • {Number(item.sellPrice).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700">
            Approve or decline
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <form action={approveQuoteAction} className="space-y-2">
              <input type="hidden" name="token" value={params.token} />
              <button
                type="submit"
                className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Approve quote
              </button>
            </form>
            <form action={declineQuoteAction} className="space-y-2">
              <input type="hidden" name="token" value={params.token} />
              <textarea
                name="message"
                placeholder="Reason (optional)"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Decline
              </button>
            </form>
            <form action={questionQuoteAction} className="space-y-2">
              <input type="hidden" name="token" value={params.token} />
              <textarea
                name="message"
                placeholder="Ask a question"
                required
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Ask question
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

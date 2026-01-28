import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { createClientAction } from "@/app/actions/admin-actions";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, ["SALES", "ADMIN"]);

  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Clients</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Add Client</h2>
        <form action={createClientAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="Client name"
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            name="billingEmail"
            type="email"
            placeholder="Billing email"
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            name="deliveryAddress"
            placeholder="Default delivery address"
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            name="paymentTerms"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="PREPAY">Prepay</option>
            <option value="EOM">End of Month</option>
            <option value="DAYS_30">30 Days</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="isPrivileged" />
            Privileged terms
          </label>
          <textarea
            name="notes"
            placeholder="Notes"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 md:col-span-2"
          >
            Save Client
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Client
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Billing Email
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Privileged
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-4 py-2 font-medium text-slate-800">
                  {client.name}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {client.billingEmail}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {client.isPrivileged ? "Yes" : "No"}
                </td>
              </tr>
            ))}
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No clients yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

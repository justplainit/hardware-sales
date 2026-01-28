import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { createSupplierAction } from "@/app/actions/admin-actions";

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, ["SALES", "ADMIN"]);

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Suppliers</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Add Supplier</h2>
        <form action={createSupplierAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="Supplier name"
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            name="contactEmail"
            type="email"
            placeholder="Contact email"
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            name="defaultLeadDays"
            type="number"
            min={0}
            placeholder="Default lead days"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 md:col-span-2"
          >
            Save Supplier
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Supplier
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Contact Email
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Lead Days
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="px-4 py-2 font-medium text-slate-800">
                  {supplier.name}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {supplier.contactEmail}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {supplier.defaultLeadDays}
                </td>
              </tr>
            ))}
            {suppliers.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No suppliers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

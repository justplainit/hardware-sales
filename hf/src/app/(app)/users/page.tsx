import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import { createUserAction } from "@/app/actions/admin-actions";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  requireRole(session, ["ADMIN"]);

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Users</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Add User</h2>
        <form action={createUserAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="Full name"
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            name="role"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="ADMIN">Admin</option>
            <option value="SALES">Sales</option>
            <option value="TECH">Technician</option>
            <option value="ACCOUNTS">Accounts</option>
          </select>
          <input
            name="password"
            type="text"
            placeholder="Temporary password"
            defaultValue="Welcome123!"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 md:col-span-2"
          >
            Save User
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Name
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Email
              </th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2 font-medium text-slate-800">
                  {user.name}
                </td>
                <td className="px-4 py-2 text-slate-600">{user.email}</td>
                <td className="px-4 py-2 text-slate-600">{user.role}</td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No users yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

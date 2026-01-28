import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { requireAuth, hasRole } from "@/lib/permissions";
import SignOutButton from "@/components/SignOutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  requireAuth(session);

  const isAdmin = hasRole(session, ["ADMIN"]);
  const isSales = hasRole(session, ["SALES", "ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold">
              HardwareFlow
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/quotes" className="hover:text-slate-900">
                Quotes
              </Link>
              <Link href="/supplier-orders" className="hover:text-slate-900">
                Supplier Orders
              </Link>
              <Link href="/goods-receipts/new" className="hover:text-slate-900">
                Goods Receipt
              </Link>
              <Link href="/dispatch/new" className="hover:text-slate-900">
                Dispatch
              </Link>
              <Link href="/tasks" className="hover:text-slate-900">
                My Tasks
              </Link>
              <Link href="/notifications" className="hover:text-slate-900">
                Notifications
              </Link>
              {isSales ? (
                <>
                  <Link href="/clients" className="hover:text-slate-900">
                    Clients
                  </Link>
                  <Link href="/suppliers" className="hover:text-slate-900">
                    Suppliers
                  </Link>
                </>
              ) : null}
              {isAdmin ? (
                <>
                  <Link href="/users" className="hover:text-slate-900">
                    Users
                  </Link>
                  <Link href="/settings" className="hover:text-slate-900">
                    Settings
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}

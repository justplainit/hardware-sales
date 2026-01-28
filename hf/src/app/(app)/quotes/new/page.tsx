import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/permissions";
import QuoteRequestForm from "@/components/QuoteRequestForm";
import { createQuoteRequestAction } from "@/app/actions/quote-actions";

export default async function NewQuotePage() {
  const session = await getServerSession(authOptions);
  requireRole(session, ["TECH", "ADMIN"]);

  const clients = await prisma.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const salesUsers = await prisma.user.findMany({
    where: { role: { in: ["SALES", "ADMIN"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">New Hardware Request</h1>
      <QuoteRequestForm
        clients={clients}
        salesUsers={salesUsers}
        action={createQuoteRequestAction}
      />
    </div>
  );
}

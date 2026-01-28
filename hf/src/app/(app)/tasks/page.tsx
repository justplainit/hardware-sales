import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { markTaskDoneAction } from "@/app/actions/task-actions";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  requireAuth(session);
  const tasks = await prisma.task.findMany({
    where: { userId: session?.user.id, status: "OPEN" },
    include: { quoteItem: { include: { quote: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Tasks</h1>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="text-sm font-semibold">{task.title}</p>
              <p className="text-xs text-slate-500">
                {task.quoteItem.quote.quoteNumber} • {task.quoteItem.description}
              </p>
            </div>
            <form action={markTaskDoneAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <button
                type="submit"
                className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                Mark done
              </button>
            </form>
          </div>
        ))}
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No open tasks.</p>
        ) : null}
      </div>
    </div>
  );
}

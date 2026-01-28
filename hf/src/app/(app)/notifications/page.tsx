import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { markNotificationReadAction } from "@/app/actions/notification-actions";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  requireAuth(session);
  const notifications = await prisma.notification.findMany({
    where: { userId: session?.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="text-sm font-semibold">{notification.title}</p>
              <p className="text-xs text-slate-500">{notification.body}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>
                {new Date(notification.createdAt).toLocaleDateString()}
              </span>
              {notification.readAt ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  Read
                </span>
              ) : (
                <form action={markNotificationReadAction}>
                  <input
                    type="hidden"
                    name="notificationId"
                    value={notification.id}
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Mark read
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        ) : null}
      </div>
    </div>
  );
}

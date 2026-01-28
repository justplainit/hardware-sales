"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function markNotificationReadAction(formData: FormData) {
  const session = await requireSession();
  const notificationId = String(formData.get("notificationId") ?? "");

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
}

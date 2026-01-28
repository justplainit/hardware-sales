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

export async function markTaskDoneAction(formData: FormData) {
  const session = await requireSession();
  const taskId = String(formData.get("taskId") ?? "");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "DONE" },
  });

  revalidatePath("/tasks");
}

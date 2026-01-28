import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function notifyUsers(
  userIds: string[],
  title: string,
  body: string,
) {
  const uniqueUserIds = Array.from(new Set(userIds));
  if (uniqueUserIds.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueUserIds.map((userId) => ({
      userId,
      title,
      body,
    })),
  });

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueUserIds } },
    select: { email: true, name: true },
  });

  await Promise.all(
    users.map((user) =>
      sendEmail({
        to: user.email,
        subject: title,
        text: body,
      }),
    ),
  );
}

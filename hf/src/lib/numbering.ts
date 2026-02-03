import type { Prisma, PrismaClient } from "@prisma/client";

function padSequence(value: number) {
  return value.toString().padStart(4, "0");
}

export async function generateNumber(
  tx: PrismaClient | Prisma.TransactionClient,
  prefix: string,
  date = new Date(),
) {
  const year = date.getFullYear();
  const key = `${prefix}-${year}`;
  const sequence = await tx.sequence.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });

  return `${prefix}-${year}-${padSequence(sequence.value)}`;
}

"use server";

import bcrypt from "bcryptjs";
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

export async function createClientAction(formData: FormData) {
  const session = await requireSession();
  if (!["SALES", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  await prisma.client.create({
    data: {
      name: String(formData.get("name") ?? ""),
      billingEmail: String(formData.get("billingEmail") ?? ""),
      deliveryAddress: String(formData.get("deliveryAddress") ?? ""),
      isPrivileged: formData.get("isPrivileged") === "on",
      paymentTerms: String(formData.get("paymentTerms") ?? "PREPAY") as
        | "PREPAY"
        | "EOM"
        | "DAYS_30",
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  revalidatePath("/clients");
}

export async function createSupplierAction(formData: FormData) {
  const session = await requireSession();
  if (!["SALES", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  await prisma.supplier.create({
    data: {
      name: String(formData.get("name") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      defaultLeadDays: Number(formData.get("defaultLeadDays") ?? 0),
      notes: String(formData.get("notes") ?? "") || null,
    },
  });

  revalidatePath("/suppliers");
}

export async function createUserAction(formData: FormData) {
  const session = await requireSession();
  if (!["ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const password = String(formData.get("password") ?? "Welcome123!");
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? "").toLowerCase(),
      role: String(formData.get("role") ?? "TECH") as
        | "ADMIN"
        | "TECH"
        | "SALES"
        | "ACCOUNTS",
      passwordHash,
    },
  });

  revalidatePath("/users");
}

export async function updateSettingsAction(formData: FormData) {
  const session = await requireSession();
  if (!["ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const entries = [
    { key: "min_margin_pct", value: String(formData.get("minMargin") ?? "15") },
    { key: "vat_rate", value: String(formData.get("vatRate") ?? "0.15") },
    {
      key: "notify_admin_on_grn",
      value: formData.get("notifyAdminOnGrn") === "on" ? "true" : "false",
    },
  ];

  await Promise.all(
    entries.map((entry) =>
      prisma.appSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      }),
    ),
  );

  revalidatePath("/settings");
}

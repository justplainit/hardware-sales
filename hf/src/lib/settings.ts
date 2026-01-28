import { prisma } from "@/lib/db";

export async function getSetting(key: string, fallback?: string) {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  return setting?.value ?? fallback;
}

export async function getVatRate() {
  const value = await getSetting("vat_rate", "0.15");
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0.15 : parsed;
}

export async function getMinMarginPct() {
  const value = await getSetting("min_margin_pct", "15");
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 15 : parsed;
}

export async function getNotifyAdminOnGrn() {
  const value = await getSetting("notify_admin_on_grn", "true");
  return value === "true";
}

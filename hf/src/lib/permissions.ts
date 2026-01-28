import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { UserRole } from "@/generated/prisma";

export function requireAuth(session: Session | null) {
  if (!session?.user) {
    redirect("/login");
  }
}

export function requireRole(session: Session | null, roles: UserRole[]) {
  requireAuth(session);
  if (!roles.includes(session.user.role)) {
    throw new Error("Unauthorized");
  }
}

export function hasRole(session: Session | null, roles: UserRole[]) {
  return !!session?.user && roles.includes(session.user.role);
}

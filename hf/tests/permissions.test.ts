import { describe, expect, it } from "vitest";
import { hasRole } from "@/lib/permissions";

describe("permissions", () => {
  it("checks roles for a session", () => {
    const session = {
      user: { id: "user-1", role: "ADMIN", name: "Admin", email: "" },
      expires: "",
    };
    expect(hasRole(session, ["ADMIN"])).toBe(true);
    expect(hasRole(session, ["TECH"])).toBe(false);
  });
});

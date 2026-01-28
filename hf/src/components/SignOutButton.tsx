"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className="rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-100"
    >
      Sign out
    </button>
  );
}

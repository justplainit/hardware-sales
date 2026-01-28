"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid credentials.");
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">HardwareFlow</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign in with your MSP account.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Seed users use password <span className="font-semibold">Welcome123!</span>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { requestReset, type ResetState } from "@/app/(auth)/reset-password/actions";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(
    requestReset,
    undefined,
  );

  if (state?.sent) {
    return (
      <p className="rounded-md bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
        If an account exists for that email, a reset link is on its way.
        Check your inbox.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          placeholder="you@ryt.com"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <div className="text-center text-sm text-slate-500">
        <a href="/login" className="hover:text-slate-800 hover:underline">
          Back to sign in
        </a>
      </div>
    </form>
  );
}

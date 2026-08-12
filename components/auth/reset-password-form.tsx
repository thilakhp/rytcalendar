"use client";

import { useActionState } from "react";
import { requestReset, type ResetState } from "@/app/(auth)/reset-password/actions";
import { Field, TextInput } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";

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
      <Field label="Email" htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@ryt.com"
        />
      </Field>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <div className="text-center text-sm text-slate-500">
        <a href="/login" className="hover:text-slate-800 hover:underline">
          Back to sign in
        </a>
      </div>
    </form>
  );
}

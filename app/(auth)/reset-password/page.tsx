import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-slate-900">
        Reset your password
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Enter your email and we&apos;ll send you a link to set a new password.
      </p>
      <ResetPasswordForm />
    </>
  );
}

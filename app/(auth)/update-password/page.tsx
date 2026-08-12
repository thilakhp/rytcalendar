import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <>
      <h1 className="mb-6 text-lg font-semibold text-slate-900">
        Set a new password
      </h1>
      <UpdatePasswordForm />
    </>
  );
}

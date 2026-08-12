import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <h1 className="mb-6 text-lg font-semibold text-slate-900">Sign in</h1>
      <LoginForm next={next} />
    </>
  );
}

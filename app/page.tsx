import { redirect } from "next/navigation";

// The proxy already redirects "/" based on auth state (see proxy.ts).
// This is just a safety net if it's ever reached directly.
export default function Home() {
  redirect("/login");
}

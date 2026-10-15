import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="card w-full max-w-md p-8">
          <h1 className="font-serif text-3xl font-semibold">Welcome</h1>
          <p className="mt-2 text-sm text-muted">
            Sign in or create an account to start your CV. No password needed.
          </p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}

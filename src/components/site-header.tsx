import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">
            {APP_NAME[0]}
          </span>
          <span className="text-lg tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/pricing" className="btn-ghost hidden sm:inline-flex">
            Pricing
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost">
                My CVs
              </Link>
              <form action="/auth/signout" method="post">
                <button className="btn-ghost">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/login" className="btn-primary">
                Create my CV
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

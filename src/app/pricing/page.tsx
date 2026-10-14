import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getProfile, isPro } from "@/lib/account";
import { PRO_DAYS, PRO_PRICE } from "@/lib/brand";
import { createSupabaseServer } from "@/lib/supabase/server";
import { UpgradeButton } from "./upgrade-button";

export const metadata: Metadata = { title: "Pricing" };

const FREE = ["Unlimited CVs", "AI recruiter interview", "AI reading of diplomas & certificates", "All 3 designs", "3 CV generations a day", "PDF download with a small footer"];
const PRO = ["Everything in Free", "No footer on your PDFs", "30 CV generations a day", "More document uploads", "One payment, no subscription"];

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const { status } = await searchParams;
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const profile = data.user ? await getProfile(data.user.id) : null;
  const pro = isPro(profile?.pro_until);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h1 className="text-center font-serif text-4xl font-semibold">Simple pricing</h1>
          <p className="mt-3 text-center text-muted">Start free. Upgrade only when you&apos;re ready to send your CV.</p>
          {status === "success" && (
            <p className="mx-auto mt-6 max-w-md rounded-xl bg-green-50 p-4 text-center text-sm text-good">
              Payment received. Pro is being activated – it can take a few seconds to show.
            </p>
          )}
          {status === "cancelled" && (
            <p className="mx-auto mt-6 max-w-md rounded-xl bg-amber-50 p-4 text-center text-sm text-warn">
              Checkout cancelled. You haven&apos;t been charged.
            </p>
          )}

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="card p-8">
              <h2 className="text-lg font-semibold">Free</h2>
              <p className="mt-2 text-4xl font-bold">$0</p>
              <Features items={FREE} />
              <Link href={data.user ? "/dashboard" : "/login"} className="btn-secondary mt-8 w-full">
                {data.user ? "Go to my CVs" : "Start free"}
              </Link>
            </div>
            <div className="card relative border-2 border-brand p-8">
              <span className="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                Best for job hunting
              </span>
              <h2 className="text-lg font-semibold">Pro pass</h2>
              <p className="mt-2 text-4xl font-bold">
                {PRO_PRICE}
                <span className="text-base font-normal text-muted"> / {PRO_DAYS} days</span>
              </p>
              <Features items={PRO} />
              {pro ? (
                <p className="mt-8 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-good">
                  You&apos;re Pro until {new Date(profile!.pro_until!).toLocaleDateString()}
                </p>
              ) : data.user ? (
                <UpgradeButton />
              ) : (
                <Link href="/login?next=/pricing" className="btn-primary mt-8 w-full">
                  Sign in to upgrade
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Features({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-2.5 text-sm">
      {items.map((f) => (
        <li key={f} className="flex gap-2">
          <span className="text-good">✓</span>
          {f}
        </li>
      ))}
    </ul>
  );
}

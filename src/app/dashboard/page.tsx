import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getProfile, isPro } from "@/lib/account";
import { PRO_PRICE } from "@/lib/brand";
import { createSupabaseServer } from "@/lib/supabase/server";
import { DeleteCvButton, NewCvButton } from "./cv-actions";

export const metadata: Metadata = { title: "My CVs" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/dashboard");

  const [{ data: cvs }, profile] = await Promise.all([
    supabase
      .from("cvs")
      .select("id, title, target_role, template, generated_at, updated_at, ats")
      .order("updated_at", { ascending: false }),
    getProfile(auth.user.id),
  ]);
  const pro = isPro(profile?.pro_until);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-semibold">My CVs</h1>
              <p className="mt-1 text-sm text-muted">
                {pro
                  ? `Pro until ${new Date(profile!.pro_until!).toLocaleDateString()}`
                  : "Free plan · downloads include a small footer"}
              </p>
            </div>
            <div className="flex gap-2">
              {!pro && (
                <Link href="/pricing" className="btn-secondary">
                  Go Pro · {PRO_PRICE}
                </Link>
              )}
              <NewCvButton />
            </div>
          </div>

          {!cvs?.length ? (
            <div className="card mt-8 flex flex-col items-center px-6 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-2xl">📄</div>
              <h2 className="mt-4 text-lg font-semibold">Create your first CV</h2>
              <p className="mt-1 max-w-sm text-sm text-muted">
                It takes about 10 minutes: answer the AI&apos;s questions, upload your diplomas, pick a design.
              </p>
              <div className="mt-6">
                <NewCvButton />
              </div>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cvs.map((cv) => {
                const score = (cv.ats as { score?: number } | null)?.score;
                return (
                  <li key={cv.id} className="card flex flex-col p-5">
                    <Link href={`/cv/${cv.id}`} className="flex-1">
                      <p className="font-semibold leading-snug hover:text-indigo-300">{cv.title}</p>
                      <p className="mt-1 text-sm text-muted">{cv.target_role || "No target role yet"}</p>
                    </Link>
                    <div className="mt-5 flex items-center justify-between text-xs text-muted">
                      <span>
                        {cv.generated_at ? (
                          <span className="rounded-full bg-good/15 px-2 py-1 font-medium text-good">
                            Generated{typeof score === "number" ? ` · ATS ${Math.round(score)}` : ""}
                          </span>
                        ) : (
                          <span className="rounded-full bg-warn/15 px-2 py-1 font-medium text-warn">Draft</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        Edited {new Date(cv.updated_at).toLocaleDateString()}
                        <DeleteCvButton id={cv.id} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

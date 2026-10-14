import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getProfile, isPro } from "@/lib/account";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Wizard, type CvRecord, type DocRecord } from "./wizard";

export const metadata: Metadata = { title: "Build your CV" };

export default async function CvPage({ params }: PageProps<"/cv/[id]">) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=/cv/${id}`);

  const [{ data: cv }, { data: docs }, profile] = await Promise.all([
    supabase
      .from("cvs")
      .select(
        "id, title, target_role, job_description, language, interview, interview_done, template, accent, photo_path, content, ats, generated_at",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("cv_documents")
      .select("id, file_name, mime_type, extracted, created_at")
      .eq("cv_id", id)
      .order("created_at"),
    getProfile(auth.user.id),
  ]);
  if (!cv) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-paper">
        <Wizard
          userId={auth.user.id}
          pro={isPro(profile?.pro_until)}
          initialCv={cv as CvRecord}
          initialDocs={(docs ?? []) as DocRecord[]}
        />
      </main>
    </>
  );
}

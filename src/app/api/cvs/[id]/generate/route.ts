import { NextResponse } from "next/server";
import { checkQuota, recordUsage, requireUser } from "@/lib/account";
import { AiRefusalError, generateCv } from "@/lib/ai";
import type { InterviewMessage } from "@/lib/cv-schema";

export const maxDuration = 300;

export async function POST(_request: Request, ctx: RouteContext<"/api/cvs/[id]/generate">) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data: cv } = await auth.supabase
    .from("cvs")
    .select("id, target_role, job_description, language, interview")
    .eq("id", id)
    .single();
  if (!cv) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { data: docs } = await auth.supabase
    .from("cv_documents")
    .select("file_name, extracted")
    .eq("cv_id", id);

  const interview = (cv.interview ?? []) as InterviewMessage[];
  const documents = (docs ?? [])
    .filter((d) => d.extracted)
    .map((d) => ({ fileName: d.file_name, facts: d.extracted }));
  if (!interview.some((m) => m.role === "user") && documents.length === 0) {
    return NextResponse.json(
      { error: "Answer a few interview questions or upload a document first." },
      { status: 400 },
    );
  }

  const limited = await checkQuota(auth.user.id, "generate");
  if (limited) return limited;

  try {
    const { result, usage } = await generateCv({
      role: cv.target_role,
      jobDescription: cv.job_description,
      language: cv.language,
      interview,
      documents,
      account: {
        email: auth.user.email ?? "",
        fullName: (auth.user.user_metadata?.full_name as string | undefined) ?? "",
      },
    });
    await recordUsage(auth.user.id, "generate", usage);

    const { error } = await auth.supabase
      .from("cvs")
      .update({
        content: result.cv,
        ats: result.ats,
        generated_at: new Date().toISOString(),
        title: result.cv.basics.headline
          ? `${result.cv.basics.fullName || "CV"} - ${result.cv.basics.headline}`
          : undefined,
      })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ cv: result.cv, ats: result.ats });
  } catch (err) {
    if (err instanceof AiRefusalError) {
      return NextResponse.json({ error: "The AI couldn't write this CV. Please review your answers and try again." }, { status: 422 });
    }
    console.error("generate failed", err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { getProfile, isPro, requireUser } from "@/lib/account";
import { CvContent, TEMPLATES, type TemplateId } from "@/lib/cv-schema";
import { renderCvPdf } from "@/lib/pdf/templates";

export const maxDuration = 60;

/** Renders the CV as a PDF. Free accounts get a small footer watermark. */
export async function GET(request: Request, ctx: RouteContext<"/api/cvs/[id]/pdf">) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data: cv } = await auth.supabase
    .from("cvs")
    .select("title, content, template, accent, photo_path")
    .eq("id", id)
    .single();
  const content = CvContent.safeParse(cv?.content);
  if (!cv || !content.success) {
    return NextResponse.json({ error: "Generate the CV first." }, { status: 404 });
  }

  let photo: string | null = null;
  if (cv.photo_path) {
    const { data: blob } = await auth.supabase.storage.from("cv-files").download(cv.photo_path);
    if (blob && (blob.type === "image/jpeg" || blob.type === "image/png")) {
      photo = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
    }
  }

  const profile = await getProfile(auth.user.id);
  const template = (TEMPLATES.some((t) => t.id === cv.template) ? cv.template : "classic") as TemplateId;
  const pdf = await renderCvPdf({
    cv: content.data,
    template,
    accent: cv.accent,
    photo,
    watermark: !isPro(profile?.pro_until),
  });

  const download = new URL(request.url).searchParams.has("download");
  const fileName = `${(content.data.basics.fullName || "CV").replace(/[^\p{L}\p{N} _-]/gu, "").trim().replace(/\s+/g, "_")}_CV.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

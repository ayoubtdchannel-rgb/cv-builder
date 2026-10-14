import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/account";
import { ACCENTS, CvContent, LANGUAGES, TEMPLATES } from "@/lib/cv-schema";

const Patch = z
  .object({
    title: z.string().max(120),
    target_role: z.string().max(200),
    job_description: z.string().max(15000),
    language: z.enum(LANGUAGES),
    template: z.enum(TEMPLATES.map((t) => t.id) as [string, ...string[]]),
    accent: z.enum(ACCENTS),
    photo_path: z.string().max(500).nullable(),
    content: CvContent,
    interview_done: z.boolean(),
  })
  .partial()
  .strict();

export async function PATCH(request: Request, ctx: RouteContext<"/api/cvs/[id]">) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }
  const patch = parsed.data;
  // Photos must live in the user's own folder for this CV.
  if (patch.photo_path && !patch.photo_path.startsWith(`${auth.user.id}/${id}/`)) {
    return NextResponse.json({ error: "Invalid photo path." }, { status: 400 });
  }

  const { error, count } = await auth.supabase
    .from("cvs")
    .update(patch, { count: "exact" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/cvs/[id]">) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const folder = `${auth.user.id}/${id}`;
  const { data: files } = await auth.supabase.storage.from("cv-files").list(folder);
  if (files?.length) {
    await auth.supabase.storage.from("cv-files").remove(files.map((f) => `${folder}/${f.name}`));
  }
  const { error } = await auth.supabase.from("cvs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

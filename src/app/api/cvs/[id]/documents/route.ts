import { NextResponse } from "next/server";
import { z } from "zod";
import { checkQuota, recordUsage, requireUser } from "@/lib/account";
import { AiRefusalError, READABLE_TYPES, readDocument } from "@/lib/ai";

export const maxDuration = 120;

const Body = z.object({
  storagePath: z.string().max(500),
  fileName: z.string().max(200),
  mimeType: z.enum(READABLE_TYPES),
});

/**
 * Registers a diploma or certificate the browser already uploaded to storage,
 * then has the AI read it. Returns the saved row with the extracted facts.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/cvs/[id]/documents">) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Unsupported file." }, { status: 400 });
  const { storagePath, fileName, mimeType } = body.data;
  if (!storagePath.startsWith(`${auth.user.id}/${id}/`)) {
    return NextResponse.json({ error: "Invalid file path." }, { status: 400 });
  }

  const { data: cv } = await auth.supabase.from("cvs").select("id").eq("id", id).single();
  if (!cv) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const limited = await checkQuota(auth.user.id, "document");
  if (limited) return limited;

  const { data: blob, error: downloadError } = await auth.supabase.storage
    .from("cv-files")
    .download(storagePath);
  if (downloadError || !blob) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }

  let extracted = null;
  try {
    const { facts, usage } = await readDocument({
      bytes: Buffer.from(await blob.arrayBuffer()),
      mimeType,
      fileName,
    });
    extracted = facts;
    await recordUsage(auth.user.id, "document", usage);
  } catch (err) {
    // Keep the file even if it couldn't be read; the user can describe it in the interview.
    if (!(err instanceof AiRefusalError)) console.error("document read failed", err);
  }

  const { data: doc, error } = await auth.supabase
    .from("cv_documents")
    .insert({ cv_id: id, user_id: auth.user.id, storage_path: storagePath, file_name: fileName, mime_type: mimeType, extracted })
    .select("id, file_name, mime_type, extracted, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: doc });
}

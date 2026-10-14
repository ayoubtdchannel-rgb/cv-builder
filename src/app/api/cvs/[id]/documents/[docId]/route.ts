import { NextResponse } from "next/server";
import { requireUser } from "@/lib/account";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/cvs/[id]/documents/[docId]">) {
  const { id, docId } = await ctx.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data: doc } = await auth.supabase
    .from("cv_documents")
    .select("id, storage_path")
    .eq("id", docId)
    .eq("cv_id", id)
    .single();
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await auth.supabase.storage.from("cv-files").remove([doc.storage_path]);
  await auth.supabase.from("cv_documents").delete().eq("id", docId);
  return NextResponse.json({ ok: true });
}

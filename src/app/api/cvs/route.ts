import { NextResponse } from "next/server";
import { requireUser } from "@/lib/account";

export async function POST() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("cvs")
    .insert({ user_id: auth.user.id })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

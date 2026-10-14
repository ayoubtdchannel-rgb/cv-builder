import { NextResponse } from "next/server";
import { z } from "zod";
import { checkQuota, recordUsage, requireUser } from "@/lib/account";
import { streamInterviewTurn } from "@/lib/ai";
import type { InterviewMessage } from "@/lib/cv-schema";

export const maxDuration = 120;

const Body = z.object({ message: z.string().trim().max(4000).optional() });

/**
 * Sends the candidate's answer (if any) and streams the interviewer's next
 * question as plain text. The last line is a status sentinel ("\0DONE",
 * "\0MORE" or "\0ERROR") that the client strips.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/cvs/[id]/interview">) {
  const { id } = await ctx.params;
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "Invalid message." }, { status: 400 });

  const { data: cv } = await auth.supabase
    .from("cvs")
    .select("id, interview, interview_done, target_role, job_description, language")
    .eq("id", id)
    .single();
  if (!cv) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const limited = await checkQuota(auth.user.id, "interview");
  if (limited) return limited;

  const history = (cv.interview ?? []) as InterviewMessage[];
  const answer = body.data.message;
  if (answer) {
    if (history.at(-1)?.role === "user") history.pop(); // drop an unanswered turn
    history.push({ role: "user", content: answer });
  } else if (history.length > 0) {
    return NextResponse.json({ error: "Message required." }, { status: 400 });
  }

  const { stream, done } = streamInterviewTurn(history, {
    role: cv.target_role,
    jobDescription: cv.job_description,
    language: cv.language,
  });

  const supabase = auth.supabase;
  const userId = auth.user.id;
  const encoder = new TextEncoder();
  let reply = "";
  let open = true;

  const body$ = new ReadableStream<Uint8Array>({
    start(controller) {
      // The browser may disconnect mid-reply; keep going so the turn is saved.
      const send = (text: string) => {
        if (open) controller.enqueue(encoder.encode(text));
      };
      const close = () => {
        if (open) controller.close();
        open = false;
      };
      stream.on("text", (delta) => {
        reply += delta;
        send(delta);
      });
      done
        .then(async ({ finished, usage }) => {
          if (!reply.trim()) {
            // The interviewer can end the chat with only a tool call; say so.
            reply = finished
              ? "Thanks, I have everything I need. Next, upload your diplomas and photo."
              : "Sorry, could you say that again?";
            send(reply);
          }
          const transcript: InterviewMessage[] = [...history, { role: "assistant", content: reply.trim() }];
          await supabase
            .from("cvs")
            .update({ interview: transcript, interview_done: finished || cv.interview_done })
            .eq("id", id);
          await recordUsage(userId, "interview", usage);
          send(`\n\u0000${finished ? "DONE" : "MORE"}`);
          close();
        })
        .catch((err) => {
          console.error("interview turn failed", err);
          send("\n\u0000ERROR");
          close();
        });
    },
    cancel() {
      open = false;
    },
  });

  return new Response(body$, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

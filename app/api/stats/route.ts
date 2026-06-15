import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    const [pdfsRes, quizzesRes, sessionsRes] = await Promise.all([
      supabaseAdmin.from("pdfs").select("id", { count: "exact" }),
      supabaseAdmin.from("quiz_results").select("score, total, created_at", { count: "exact" }),
      supabaseAdmin.from("study_sessions").select("duration_seconds"),
    ]);

    const totalPdfs = pdfsRes.count || 0;
    const totalQuizzes = quizzesRes.count || 0;
    const quizResults = quizzesRes.data || [];
    const sessions = sessionsRes.data || [];

    const avgScore = quizResults.length > 0
      ? Math.round(quizResults.reduce((acc: number, q: any) => acc + (q.score / q.total) * 100, 0) / quizResults.length)
      : 0;

    const totalStudySeconds = sessions.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0);
    const totalStudyMinutes = Math.round(totalStudySeconds / 60);

    return NextResponse.json({ totalPdfs, totalQuizzes, avgScore, totalStudyMinutes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { duration_seconds, pdf_id, activity_type } = await req.json();
    const { error } = await supabaseAdmin.from("study_sessions").insert({
      duration_seconds,
      pdf_id: pdf_id || null,
      activity_type: activity_type || "chat",
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
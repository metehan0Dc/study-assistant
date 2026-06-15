import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("pdfs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("PDF listeleme hatası:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🔧 publicUrl eklendi - Supabase Storage public URL formatı
    const formatted = (data || []).map((d: any) => ({
      id: d.id,
      title: d.filename,
      createdAt: d.created_at,
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pdfs/${d.id}.pdf`
    }));

    return NextResponse.json({ pdfs: formatted });
  } catch (error: any) {
    console.error("LISTE HATASI:", error);
    return NextResponse.json(
      { error: "Listeleme hatası: " + error.message },
      { status: 500 }
    );
  }
}
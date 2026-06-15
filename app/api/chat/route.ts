import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

export async function POST(req: Request) {
  try {
    const { message, pdfId, history = [] } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API key eksik" }, { status: 500 });
    }

    // 1. Kullanıcı mesajını embed et
    const extract = await getExtractor();
    const output = await extract(message, { pooling: "mean", normalize: true });
    const queryVector = Array.from(output.data) as number[];

    // 2. Pinecone'dan ilgili chunk'ları çek (topK artırıldı)
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.Index(process.env.PINECONE_INDEX!);

    const queryRes = await index.namespace(pdfId).query({
      topK: 5,
      vector: queryVector,
      includeMetadata: true,
    });

    const sources = queryRes.matches
      .filter((m) => (m.score || 0) > 0.3)
      .map((m, i) => ({
        index: i + 1,
        text: (m.metadata?.text as string) || "",
        score: Math.round((m.score || 0) * 100),
      }));

    const context = sources.map((s) => `[Kaynak ${s.index}]: ${s.text}`).join("\n\n");

    if (!context) {
      return NextResponse.json({
        answer: "Bu belgenin içeriğinde sorunuzla ilgili bir bilgi bulunamadı. PDF'i yeniden yüklemeyi deneyebilirsiniz.",
        sources: [],
      });
    }

    // 3. Sohbet geçmişini hazırla (son 6 mesaj)
    const recentHistory = history.slice(-6).map((m: any) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 4. Sistem promptu — gelişmiş RAG
    const systemPrompt = `Sen akıllı bir ders asistanısın. Sana verilen ders notlarına dayanarak öğrencinin sorularını cevaplıyorsun.

KURALLAR:
- Sadece verilen ders notlarındaki bilgileri kullan
- Kaynaktan alıntı yaparken [Kaynak N] şeklinde belirt
- Eğer bilgi yoksa dürüstçe söyle
- Türkçe cevap ver
- Açıklayıcı ve öğretici ol
- Gerekirse örnekler ver

DERS NOTLARI:
${context}`;

    // 5. Groq'a gönder (geçmişle birlikte)
    const chatRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const answer = chatRes.choices[0].message.content || "";

    return NextResponse.json({
      answer,
      sources: sources.map((s) => ({ index: s.index, text: s.text.substring(0, 200) + "...", score: s.score })),
    });

  } catch (error: any) {
    console.error("CHAT HATASI:", error.message);
    return NextResponse.json(
      { error: "Sohbet sırasında hata oluştu: " + error.message },
      { status: 500 }
    );
  }
}
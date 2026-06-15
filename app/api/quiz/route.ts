import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pdfId = body.pdfId;
    // TypeScript'e bu değişkenin bir metin (string) olduğunu açıkça belirtiyoruz
    const difficulty = (body.difficulty as string) || "mixed";
    
    console.log("Sınav oluşturuluyor... PDF:", pdfId, "Zorluk:", difficulty);

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API key eksik" }, { status: 500 });
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const index = pc.Index(process.env.PINECONE_INDEX!);

    const queryRes = await index.namespace(pdfId).query({
      topK: 100,
      vector: new Array(384).fill(0),
      includeMetadata: true,
    });

    const context = queryRes.matches
      .map((m) => m.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    if (!context || context.length < 100) {
      return NextResponse.json(
        { error: "PDF içeriği yetersiz veya bulunamadı" },
        { status: 400 }
      );
    }

    // TİP HATASININ ÇÖZÜLDÜĞÜ KISIM (Record<string, string> eklendi)
    const difficultyOptions: Record<string, string> = {
      easy: "KOLAY seviye: Temel kavramlar, tanımlar, doğrudan metinden cevaplanabilir sorular.",
      medium: "ORTA seviye: Anlama, yorumlama, kavramlar arası ilişki kurma gerektiren sorular.",
      hard: "ZOR seviye: Analiz, sentez, eleştirel düşünme, uygulama gerektiren karmaşık sorular.",
      mixed: "KARIŞIK seviye: 3 kolay, 4 orta, 3 zor olacak şekilde dengeli dağılım.",
    };

    // Eğer gelen değer listede yoksa varsayılan olarak "mixed" seçer
    const difficultyPrompt = difficultyOptions[difficulty] || difficultyOptions["mixed"];

    const prompt = `Aşağıdaki ders notlarına dayanarak 10 adet çoktan seçmeli sınav sorusu hazırla.

${difficultyPrompt}

KURALLAR:
- Her soru 4 seçenekli (A, B, C, D)
- Sadece 1 doğru cevap olmalı
- Sorular PDF içeriğine dayanmalı, dış bilgi kullanma
- JSON formatında döndür

Ders Notları: ${context.substring(0, 8000)}

ÇIKTI FORMATI (kesinlikle JSON, başka metin ekleme):
{
  "quiz": [
    {
      "id": 1,
      "question": "Soru metni?",
      "options": ["A) Seçenek 1", "B) Seçenek 2", "C) Seçenek 3", "D) Seçenek 4"],
      "correctAnswer": "A",
      "explanation": "Doğru cevabın açıklaması",
      "difficulty": "easy"
    }
  ]
}`;

    console.log("Groq'a sınav isteği gönderiliyor...");
    const chatRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rawContent = chatRes.choices[0].message.content || "";
    console.log("Ham yanıt:", rawContent.substring(0, 200));

    let quiz;
    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        rawContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, rawContent];
      const jsonStr = jsonMatch[1].trim();
      quiz = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSON parse hatası:", parseErr);
      return NextResponse.json(
        { error: "Sınav oluşturulamadı, lütfen tekrar deneyin", raw: rawContent },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      quiz: quiz.quiz || quiz,
      pdfId,
      difficulty 
    });

  } catch (error: any) {
    console.error("SINAV HATASI:", error.message);
    return NextResponse.json(
      { error: "Sınav oluşturulurken hata: " + error.message },
      { status: 500 }
    );
  }
}
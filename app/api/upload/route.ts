import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import PDFParser from "pdf2json";

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

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    console.log("Embedding modeli yükleniyor (ilk sefer ~100MB)...");
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("Model yüklendi!");
  }
  return extractor;
}

const getPdfText = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData.parserError || "PDF parse hatası"));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        let text = "";

        if (!pdfData?.Pages) {
          return reject(new Error("PDF sayfaları bulunamadı"));
        }

        for (const page of pdfData.Pages) {
          if (!page?.Texts) continue;
          for (const item of page.Texts) {
            if (!item?.R?.length) continue;
            const rawText = item.R[0]?.T;
            if (!rawText) continue;
            try {
              text += decodeURIComponent(rawText) + " ";
            } catch (e) {
              text += rawText + " ";
            }
          }
          text += "\n";
        }

        resolve(text);
      } catch (err: any) {
        reject(new Error("PDF metni işlenirken hata: " + (err?.message || "Bilinmeyen hata")));
      }
    });

    pdfParser.parseBuffer(buffer);
  });
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let pdfId = formData.get("pdfId") as string | null;

    if (!pdfId) {
      pdfId = randomUUID();
      console.log("pdfId otomatik üretildi:", pdfId);
    }

    if (!file) {
      return NextResponse.json({ error: "Dosya eksik" }, { status: 400 });
    }

    // 1. SUPABASE UPLOAD
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = `${pdfId}.pdf`;

    console.log("1. Upload başlıyor:", filePath);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("pdfs")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload hatası:", uploadError);
      return NextResponse.json(
        { error: "Supabase hatası: " + uploadError.message },
        { status: 500 }
      );
    }

    console.log("2. Upload başarılı:", uploadData.path);

    // 2. PDF METNİ ÇIKAR
    console.log("3. PDF metni çıkarılıyor...");
    const text = await getPdfText(buffer);
    console.log("4. PDF metni okundu, uzunluk:", text.length);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "PDF'den metin çıkarılamadı. Taranmış (görsel) PDF olabilir." },
        { status: 400 }
      );
    }

    // 3. CHUNK OLUŞTUR
    const chunkSize = 1000;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    console.log("Chunk sayısı:", chunks.length);

    // 4. PINECONE
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const pineconeIndex = pc.Index(process.env.PINECONE_INDEX!);
    const extract = await getExtractor();

    const vectors: { id: string; values: number[]; metadata: { text: string } }[] = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Embedding oluşturuluyor ${i + 1}/${chunks.length}`);
      const output = await extract(chunks[i], { pooling: "mean", normalize: true });
      const embedding = Array.from(output.data) as number[];
      vectors.push({
        id: `chunk-${i}`,
        values: embedding,
        metadata: { text: chunks[i] },
      });
    }

  await pineconeIndex.namespace(pdfId).upsert({ records: vectors });

    console.log("5. Pinecone'a kaydedildi, chunk sayısı:", chunks.length);

    // 5. DATABASE KAYDI
    const { error: dbError } = await supabaseAdmin.from("pdfs").insert({
      id: pdfId,
      filename: file.name,
      path: uploadData.path,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("DB kayıt hatası (kritik değil):", dbError);
    }

    return NextResponse.json({
      success: true,
      path: uploadData.path,
      pdfId,
      chunks: chunks.length,
    });

  } catch (error: any) {
    console.error("UPLOAD / PROCESS HATASI:", error);
    return NextResponse.json(
      { error: "İşlem sırasında hata: " + (error?.message || "Bilinmeyen hata") },
      { status: 500 }
    );
  }
}
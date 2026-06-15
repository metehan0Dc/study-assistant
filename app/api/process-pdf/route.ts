import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline } from "@xenova/transformers";
import PDFParser from "pdf2json";

let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    console.log("Embedding modeli yükleniyor (ilk sefer ~100MB, 1-2 dk sürebilir)...");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
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
      let text = "";
      for (let i = 0; i < pdfData.Pages.length; i++) {
        const page = pdfData.Pages[i];
        for (let j = 0; j < page.Texts.length; j++) {
          text += decodeURIComponent(page.Texts[j].R[0].T) + " ";
        }
        text += "\n";
      }
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const pdfId = formData.get("pdfId") as string;

    if (!file || !pdfId) {
      return NextResponse.json(
        { error: "Dosya veya ID eksik" },
        { status: 400 }
      );
    }

    console.log("1. PDF işleme başladı:", file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const text = await getPdfText(buffer);
    console.log("2. PDF metni okundu, uzunluk:", text.length);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "PDF'den metin çıkarılamadı" },
        { status: 400 }
      );
    }

    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const pineconeIndex = pc.Index(process.env.PINECONE_INDEX!);
    const extract = await getExtractor();

    for (let i = 0; i < chunks.length; i++) {
      const output = await extract(chunks[i], {
        pooling: "mean",
        normalize: true,
      });
      const embedding = Array.from(output.data) as number[];

      await pineconeIndex.namespace(pdfId).upsert({
        records: [
          {
            id: `chunk-${i}`,
            values: embedding,
            metadata: { text: chunks[i] },
          },
        ],
      });
    }

    console.log("3. Pinecone'a kaydedildi, chunk sayısı:", chunks.length);
    return NextResponse.json({ success: true, chunks: chunks.length });
  } catch (error: any) {
    console.error("PDF HATASI:", error);
    return NextResponse.json(
      { error: "PDF işlenirken hata: " + error.message },
      { status: 500 }
    );
  }
}
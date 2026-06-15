import PDFUploader from "@/components/pdf/PDFUploader";
import { FileText, MoreVertical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PDFPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">PDF Dokümanlarım</h1>
        <p className="text-zinc-500">Akıllı asistanın kullanması için ders notlarını, slaytları ve makaleleri buraya yükle.</p>
      </div>

      {/* Yükleme Alanı Bileşeni */}
      <PDFUploader />

      {/* Yüklü PDF'ler Listesi (Şu anlık statik tasarım) */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-zinc-800">Son Yüklenenler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Örnek PDF Kartı */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                Yapay_Zeka_Notlari.pdf
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4 text-zinc-400" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500 mt-2 flex justify-between items-center">
                <span>2.4 MB</span>
                <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md font-medium">İşlendi</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BrainCircuit, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Hoş Geldin! 👋</h1>
        <p className="text-zinc-500">Çalışma asistanın hazır. İşte bugünkü durumun:</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam PDF</CardTitle>
            <FileText className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-zinc-500">+2 belge bu hafta eklendi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Çözülen Sınav</CardTitle>
            <BrainCircuit className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-zinc-500">Ortalama başarı: %85</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Çalışma Süresi</CardTitle>
            <Clock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14 Saat</div>
            <p className="text-xs text-zinc-500">Son 7 gün içinde</p>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-zinc-800">Ne yapmak istersin?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600"><FileText size={24} /></div>
              <div>
                <h3 className="font-bold">Yeni Belge Yükle</h3>
                <p className="text-sm text-zinc-500">PDF yükleyip anında soru sor</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-green-500 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-green-100 p-3 rounded-full text-green-600"><BrainCircuit size={24} /></div>
              <div>
                <h3 className="font-bold">Sınav Başlat</h3>
                <p className="text-sm text-zinc-500">Notlarından test çöz</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit } from "lucide-react";

export default function QuizPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Akıllı Sınav</h1>
          <p className="text-zinc-500">Yüklediğin belgelere göre yapay zeka tarafından hazırlanan sorular.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <BrainCircuit className="w-4 h-4 mr-2" />
          Yeni Sınav Üret
        </Button>
      </div>

      {/* Örnek Soru Kartı */}
      <Card className="border-2 border-blue-100 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Soru 1 / 10</Badge>
            <Badge variant="secondary">Zorluk: Orta</Badge>
          </div>
          <CardTitle className="text-xl leading-relaxed">
            Makine öğrenmesinde "Overfitting" (Aşırı Öğrenme) durumu neyi ifade eder?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Şıklar */}
          {['Modelin eğitim verisini ezberleyip yeni verilerde başarısız olması', 'Modelin çok hızlı eğitilmesi', 'Eğitim verisinin yetersiz olması', 'Modelin hiçbir veri öğrenememesi'].map((option, index) => (
            <div key={index} className="p-4 border rounded-lg hover:bg-zinc-50 cursor-pointer transition-colors flex gap-3 items-center">
              <div className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center text-xs font-bold text-zinc-500">
                {['A', 'B', 'C', 'D'][index]}
              </div>
              <span className="text-zinc-700 font-medium">{option}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled>Önceki</Button>
        <Button>Sonraki Soru</Button>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, FileText, ExternalLink, MessageSquare, Trash2, GraduationCap, BookOpen, Clock, Trophy, TrendingUp } from "lucide-react";
import Link from 'next/link';

interface PdfFile {
  id: string;
  title: string;
  createdAt: string;
  publicUrl: string;
}

interface Stats {
  totalPdfs: number;
  totalQuizzes: number;
  avgScore: number;
  totalStudyMinutes: number;
}

export default function DashboardPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ totalPdfs: 0, totalQuizzes: 0, avgScore: 0, totalStudyMinutes: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchPdfs = async () => {
    try {
      const res = await fetch('/api/pdfs');
      if (res.ok) {
        const data = await res.json();
        setPdfs(data.pdfs || data);
      }
    } catch (err) {
      console.error("PDF'ler getirilemedi", err);
    } finally {
      setLoadingPdfs(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("İstatistikler getirilemedi", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
    fetchStats();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu PDF\'i silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/pdfs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPdfs((prev) => prev.filter((p) => p.id !== id));
        fetchStats();
      } else {
        alert('Silme hatası');
      }
    } catch (err) {
      alert('Silme hatası');
    } finally {
      setDeleting(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Lütfen sadece PDF yükleyin.'); return; }

    setUploading(true);
    setError('');
    setUploadStatus('PDF yükleniyor...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız oldu.');
      setUploadStatus(`✅ Başarılı! ${data.chunks || 0} parça işlendi.`);
      fetchPdfs();
      fetchStats();
    } catch (err: any) {
      setError('❌ ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} dk`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}s ${m}dk` : `${h} saat`;
  };

  const statCards = [
    { label: 'Toplam PDF', value: stats.totalPdfs, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Çözülen Sınav', value: stats.totalQuizzes, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Ort. Sınav Puanı', value: stats.totalQuizzes > 0 ? `%${stats.avgScore}` : '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Çalışma Süresi', value: formatStudyTime(stats.totalStudyMinutes), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Çalışma Masası</h1>
        <p className="text-zinc-500">Ders notlarınızı yükleyin ve asistanınızla hemen çalışmaya başlayın.</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {loadingStats ? (
                <div className="h-7 w-12 bg-zinc-100 rounded animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold text-zinc-800">{stat.value}</p>
              )}
              <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PDF Yükleme */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            {uploading ? <Loader2 className="w-10 h-10 text-blue-600 animate-spin" /> : <UploadCloud className="w-10 h-10 text-blue-600" />}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {uploading ? 'Yükleniyor ve işleniyor...' : 'Yeni Belge Yükle'}
          </h3>
          <p className="text-zinc-500 mb-2 max-w-sm text-sm">PDF dosyanız buluta kaydedilir ve RAG sistemi tarafından işlenir.</p>

          {uploading && <p className="text-sm text-blue-600 mb-4 animate-pulse">{uploadStatus}</p>}
          {!uploading && uploadStatus.startsWith('✅') && <p className="text-sm text-green-600 mb-4">{uploadStatus}</p>}
          {error && <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 max-w-md">{error}</div>}

          <div className="relative inline-block mt-2">
            <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <Button disabled={uploading} className="bg-blue-600 hover:bg-blue-700 relative z-0">
              {uploading ? 'İşleniyor...' : 'PDF Seç ve Yükle'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PDF Listesi */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Yüklenen Dosyalarım</h2>
        {loadingPdfs ? (
          <div className="text-zinc-500 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor...</div>
        ) : pdfs.length === 0 ? (
          <div className="p-8 border rounded-xl text-center text-zinc-500 bg-zinc-50">Henüz hiç belge yüklemediniz.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pdfs.map((pdf) => (
              <Card key={pdf.id} className="flex flex-col xl:flex-row items-center justify-between p-4 hover:shadow-md transition-shadow gap-4">
                <div className="flex items-center gap-3 overflow-hidden w-full">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0"><FileText size={24} /></div>
                  <div className="truncate w-full">
                    <p className="font-medium truncate" title={pdf.title}>{pdf.title}</p>
                    <p className="text-xs text-zinc-500">{new Date(pdf.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={pdf.publicUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-1" /> Aç</Button>
                  </Link>
                  <Link href={`/dashboard/chat/${pdf.id}`}>
                    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"><MessageSquare className="w-4 h-4 mr-1" /> Sohbet</Button>
                  </Link>
                  <Link href={`/quiz/${pdf.id}`}>
                    <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"><GraduationCap className="w-4 h-4 mr-1" /> Sınav</Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(pdf.id)} disabled={deleting === pdf.id}>
                    {deleting === pdf.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PDFUploader({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setProgress('Yükleniyor...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Yükleme hatası');
      }

      setProgress(`✅ Yüklendi! ${data.chunks || 0} parça işlendi.`);
      
      if (onUploadSuccess) {
        setTimeout(() => onUploadSuccess(), 1000);
      }

    } catch (err: any) {
      console.error('Upload hatası:', err);
      setProgress(`❌ Hata: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${uploading ? 'text-blue-500 animate-bounce' : 'text-zinc-400'}`} />
        <h3 className="text-lg font-semibold text-zinc-800 mb-2">
          {uploading ? 'İşleniyor...' : isDragActive ? 'PDF dosyasını buraya bırakın...' : 'PDF yüklemek için sürükleyin veya tıklayın'}
        </h3>
        <p className="text-sm text-zinc-500 mb-4">Maksimum dosya boyutu: 20 MB</p>
        
        {uploading && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{progress}</span>
          </div>
        )}
        
        {!uploading && <Button type="button" variant="outline">Dosya Seç</Button>}
      </div>

      {progress && !uploading && (
        <div className={`text-center text-sm p-2 rounded ${progress.startsWith('✅') ? 'text-green-600 bg-green-50' : progress.startsWith('❌') ? 'text-red-600 bg-red-50' : ''}`}>
          {progress}
        </div>
      )}
    </div>
  );
}
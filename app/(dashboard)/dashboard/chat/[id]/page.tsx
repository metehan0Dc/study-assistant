'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Bot, User, BookOpen, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: { index: number; text: string; score: number }[];
  timestamp: Date;
}

export default function ChatPage() {
  const params = useParams();
  const pdfId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Merhaba! PDF\'ini yükledim ve okumaya hazırım. Ders notlarınla ilgili her şeyi sorabilirsin — konuları açıklamamı, özet çıkarmamı veya sınav sorusu üretmemi isteyebilirsin.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<number | null>(null);
  const [sessionStart] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sayfa kapanınca çalışma süresini kaydet
  useEffect(() => {
    const saveSession = async () => {
      const duration = Math.round((Date.now() - sessionStart) / 1000);
      if (duration < 10) return;
      try {
        await fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration_seconds: duration, pdf_id: pdfId, activity_type: 'chat' }),
        });
      } catch {}
    };
    window.addEventListener('beforeunload', saveSession);
    return () => {
      window.removeEventListener('beforeunload', saveSession);
      saveSession();
    };
  }, [sessionStart, pdfId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Geçmişi hazırla (sistem mesajı hariç son mesajlar)
      const history = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, pdfId, history }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Bir hata oluştu');

      const aiMsg: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Hata: ' + err.message,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, pdfId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    'Bu konuyu özetle',
    'Önemli kavramları listele',
    'Sınav sorusu üret',
    'Detaylı açıkla',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white sticky top-0 z-10">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-800">Ders Asistanı</p>
            <p className="text-xs text-green-500 font-medium">● Aktif</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-zinc-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>RAG Sistemi</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-zinc-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`max-w-[80%] space-y-2`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>

              {/* Kaynaklar */}
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="ml-1">
                  <button
                    onClick={() => setExpandedSources(expandedSources === i ? null : i)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>{msg.sources.length} kaynak kullanıldı</span>
                    {expandedSources === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedSources === i && (
                    <div className="mt-2 space-y-2">
                      {msg.sources.map((src) => (
                        <div key={src.index} className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-zinc-600">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-blue-600">Kaynak {src.index}</span>
                            <span className="text-zinc-400">%{src.score} benzerlik</span>
                          </div>
                          <p className="line-clamp-3">{src.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className={`text-xs text-zinc-400 ${msg.role === 'user' ? 'text-right' : 'text-left ml-1'}`}>
                {msg.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-zinc-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Ders notlarından araştırılıyor...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 bg-zinc-50 border-t flex gap-2 overflow-x-auto">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
              className="shrink-0 text-xs px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-zinc-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ders notlarınla ilgili bir şey sor..."
              disabled={loading}
              className="w-full px-4 py-3 pr-4 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 bg-zinc-50"
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 h-11 w-11 p-0 rounded-xl shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-zinc-400 mt-2 text-center">Enter ile gönder • Shift+Enter yeni satır</p>
      </div>
    </div>
  );
}
'use client';
import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ChatWindow() {
  const [inputValue, setInputValue] = useState('');

  // Örnek mesajlar (Şimdilik statik, yapay zeka bağlanınca dinamik olacak)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Merhaba! Yüklediğin PDF dosyaları hakkında bana her şeyi sorabilirsin.' }
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    // Kullanıcı mesajını ekle
    setMessages([...messages, { role: 'user', content: inputValue }]);
    setInputValue('');
    
    // TODO: Burada LLM'e istek atılacak
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] border rounded-xl bg-zinc-50 overflow-hidden">
      
      {/* Mesajların Listelendiği Alan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {msg.role === 'assistant' && (
              <Avatar className="w-8 h-8 border">
                <AvatarFallback className="bg-blue-100 text-blue-600"><Bot size={18} /></AvatarFallback>
              </Avatar>
            )}
            
            <div className={`p-3 rounded-lg max-w-[80%] text-sm ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border rounded-bl-none text-zinc-800'
            }`}>
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <Avatar className="w-8 h-8 border">
                <AvatarFallback className="bg-zinc-200 text-zinc-600"><User size={18} /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </div>

      {/* Mesaj Yazma Alanı (Input) */}
      <div className="p-4 bg-white border-t flex gap-2 items-center">
        <Input 
          placeholder="Ders notlarımla ilgili bir soru sor..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon" className="bg-blue-600 hover:bg-blue-700">
          <Send className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}
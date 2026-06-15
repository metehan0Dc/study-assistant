import Link from 'next/link';
import { BookOpen, FileText, LayoutDashboard, MessageSquare, BrainCircuit, User } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-zinc-50 min-h-screen p-4 flex flex-col">
      <div className="font-bold text-xl mb-8 flex items-center gap-2 px-2 text-zinc-800">
        <BookOpen className="w-6 h-6 text-blue-600" />
        <span>Ders Asistanı</span>
      </div>
      
      <nav className="flex flex-col gap-1 text-zinc-600 font-medium">
        <Link href="/dashboard" className="flex items-center gap-3 p-2 hover:bg-zinc-200 hover:text-zinc-900 rounded-md transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>
        <Link href="/pdfs" className="flex items-center gap-3 p-2 hover:bg-zinc-200 hover:text-zinc-900 rounded-md transition-colors">
          <FileText className="w-5 h-5" />
          PDF'lerim
        </Link>
        <Link href="/chat" className="flex items-center gap-3 p-2 hover:bg-zinc-200 hover:text-zinc-900 rounded-md transition-colors">
          <MessageSquare className="w-5 h-5" />
          Sohbet (RAG)
        </Link>
        <Link href="/quiz" className="flex items-center gap-3 p-2 hover:bg-zinc-200 hover:text-zinc-900 rounded-md transition-colors">
          <BrainCircuit className="w-5 h-5" />
          Sınav
        </Link>
      </nav>

      <div className="mt-auto">
        <Link href="/profile" className="flex items-center gap-3 p-2 hover:bg-zinc-200 hover:text-zinc-900 rounded-md transition-colors text-zinc-600 font-medium">
          <User className="w-5 h-5" />
          Profil
        </Link>
      </div>
    </aside>
  );
}
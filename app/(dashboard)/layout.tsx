import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-zinc-900">
      {/* Sol Menü */}
      <Sidebar />
      
      {/* Sağ taraftaki ana içerik (Sayfalar buraya yüklenecek) */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
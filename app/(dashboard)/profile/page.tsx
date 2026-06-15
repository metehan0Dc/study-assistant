import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profil ve Ayarlar</h1>
        <p className="text-zinc-500">Kişisel bilgilerini ve hesap ayarlarını yönet.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="w-16 h-16 border-2">
            <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl uppercase font-bold">
              {session.user.name?.charAt(0) || <User size={32} />}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{session.user.name}</CardTitle>
            <p className="text-zinc-500">{session.user.email}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">Ad Soyad</label>
            <Input defaultValue={session.user.name || ""} disabled className="bg-zinc-50 text-zinc-900" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">E-posta</label>
            <Input type="email" defaultValue={session.user.email || ""} disabled className="bg-zinc-50 text-zinc-900" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
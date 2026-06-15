import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return new NextResponse("Eksik bilgi girdiniz.", { status: 400 });
    }

    // E-posta adresi daha önce alınmış mı kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse("Bu e-posta adresi zaten kullanımda.", { status: 400 });
    }

    // Şifreyi geri döndürülemez şekilde şifrele
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı veritabanına kaydet
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log("KAYIT HATASI:", error);
    return new NextResponse("Sunucu hatası", { status: 500 });
  }
}
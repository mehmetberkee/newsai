import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/authOptions";

import { AuthOptions } from "next-auth";
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions as AuthOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, currentPassword, newPassword } = await req.json();

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Şifre değişikliği kontrolü
    if (currentPassword && newPassword) {
      // Mevcut şifreyi kontrol et
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password!
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Yeni şifreyi hashle
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Kullanıcıyı güncelle
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          password: hashedPassword,
        },
      });
    } else {
      // Sadece isim güncelleme
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
        },
      });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

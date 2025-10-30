import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Teste básico de conexão
    await prisma.$connect();

    // Contar usuários
    const userCount = await prisma.user.count();
    const usuarioCount = await prisma.usuario.count();

    // Tentar criar um usuário de teste
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
      },
    });

    // Criar perfil para o usuário
    const testProfile = await prisma.usuario.create({
      data: {
        userId: testUser.id,
        fullName: 'Test User Profile',
      },
    });

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      usuarioCount,
      testUser: { id: testUser.id, email: testUser.email },
      testProfile: { id: testProfile.id, userId: testProfile.userId },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
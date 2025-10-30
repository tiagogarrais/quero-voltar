import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Teste simples de conexão
    await prisma.$queryRaw`SELECT 1`;

    // Verificar se as tabelas existem
    const tables = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('User', 'Usuario', 'Account', 'Session', 'VerificationToken')
    `;

    // Teste de criação de usuário (similar ao NextAuth)
    let testUser = null;
    let testProfile = null;
    try {
      testUser = await prisma.user.create({
        data: {
          name: 'Health Check User',
          email: `health-check-${Date.now()}@test.com`,
        },
      });

      testProfile = await prisma.usuario.create({
        data: {
          userId: testUser.id,
          fullName: 'Health Check Profile',
        },
      });

      console.log('Health check: User created successfully', testUser.id, '- Force rebuild 2');
    } catch (createError) {
      console.error('Health check: Failed to create user', createError);
      return Response.json(
        {
          status: "error",
          database: "connected",
          tables: tables.length,
          userCreation: "failed",
          error: createError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Limpar dados de teste
    if (testProfile) {
      await prisma.usuario.delete({ where: { id: testProfile.id } });
    }
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    return Response.json({
      status: "ok",
      database: "connected",
      tables: tables.length,
      userCreation: "successful",
      testUserId: testUser?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json(
      {
        status: "error",
        database: "disconnected",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

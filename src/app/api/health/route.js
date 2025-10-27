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
      AND tablename IN ('User', 'Account', 'Session', 'VerificationToken')
    `;

    return Response.json({
      status: "ok",
      database: "connected",
      tables: tables.length,
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
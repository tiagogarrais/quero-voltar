import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id: lojaId } = params;

    if (!lojaId) {
      return NextResponse.json(
        { error: "ID da loja é obrigatório" },
        { status: 400 }
      );
    }

    // Check if the store exists
    const loja = await prisma.loja.findUnique({
      where: { id: lojaId },
      select: {
        id: true,
        nome: true,
        userId: true,
      },
    });

    if (!loja) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      );
    }

    // Get visible coupons for this store
    const coupons = await prisma.cupom.findMany({
      where: {
        lojaId: lojaId,
        visivel: true,
      },
      select: {
        id: true,
        tipo: true,
        valor: true,
        descricao: true,
        quantidade: true,
        validadeDias: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return store info and coupons
    return NextResponse.json({
      loja: {
        id: loja.id,
        nome: loja.nome,
      },
      cupons: coupons,
    });
  } catch (error) {
    console.error("Error fetching public coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

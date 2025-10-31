import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

const prisma = new PrismaClient();

// GET - Listar cupons individuais de um cupom template
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cupomId = searchParams.get("cupomId");

    if (!cupomId) {
      return NextResponse.json(
        { error: "cupomId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o cupom pertence ao usuário
    const cupom = await prisma.cupom.findFirst({
      where: {
        id: cupomId,
        loja: {
          userId: session.user.id,
        },
      },
    });

    if (!cupom) {
      return NextResponse.json(
        { error: "Cupom não encontrado" },
        { status: 404 }
      );
    }

    const individualCoupons = await prisma.cupomIndividual.findMany({
      where: {
        cupomId: cupomId,
      },
      include: {
        cupom: {
          select: {
            tipo: true,
            valor: true,
            descricao: true,
            validadeDias: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(individualCoupons);
  } catch (error) {
    console.error("Error fetching individual coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Atribuir cupom individual a um cliente (telefone, CPF ou email)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, telefone, cpf, email } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do cupom individual é obrigatório" },
        { status: 400 }
      );
    }

    // Validar que pelo menos um campo foi fornecido
    if (!telefone && !cpf && !email) {
      return NextResponse.json(
        {
          error:
            "Pelo menos um dos campos deve ser fornecido: telefone, cpf ou email",
        },
        { status: 400 }
      );
    }

    // Validar CPF se fornecido
    if (cpf) {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
      if (!cpfRegex.test(cpf.replace(/\D/g, ""))) {
        return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
      }
    }

    // Validar email se fornecido
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
      }
    }

    // Verificar se o cupom individual existe e pertence ao usuário
    const existingCoupon = await prisma.cupomIndividual.findFirst({
      where: {
        id,
        cupom: {
          loja: {
            userId: session.user.id,
          },
        },
      },
      include: {
        cupom: true,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json(
        { error: "Cupom individual não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o cupom já foi atribuído
    if (existingCoupon.dataAtribuicao) {
      return NextResponse.json(
        {
          error: "Este cupom já foi atribuído e não pode ser modificado",
        },
        { status: 400 }
      );
    }

    // Verificar se telefone, CPF ou email já estão em uso para este template de cupom
    const conflictChecks = [];

    if (telefone) {
      conflictChecks.push(
        prisma.cupomIndividual.findFirst({
          where: {
            cupomId: existingCoupon.cupomId,
            telefone: telefone,
            dataAtribuicao: { not: null },
          },
        })
      );
    }

    if (cpf) {
      conflictChecks.push(
        prisma.cupomIndividual.findFirst({
          where: {
            cupomId: existingCoupon.cupomId,
            cpf: cpf,
            dataAtribuicao: { not: null },
          },
        })
      );
    }

    if (email) {
      conflictChecks.push(
        prisma.cupomIndividual.findFirst({
          where: {
            cupomId: existingCoupon.cupomId,
            email: email,
            dataAtribuicao: { not: null },
          },
        })
      );
    }

    const conflicts = await Promise.all(conflictChecks);
    const hasConflict = conflicts.some((conflict) => conflict !== null);

    if (hasConflict) {
      return NextResponse.json(
        {
          error:
            "Telefone, CPF ou e-mail já estão associados a outro cupom deste tipo",
        },
        { status: 400 }
      );
    }

    // Atribuir o cupom ao cliente
    const updatedCoupon = await prisma.cupomIndividual.update({
      where: { id },
      data: {
        telefone: telefone || null,
        cpf: cpf || null,
        email: email || null,
        dataAtribuicao: new Date(),
        status: "atribuido",
      },
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.error("Error assigning individual coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

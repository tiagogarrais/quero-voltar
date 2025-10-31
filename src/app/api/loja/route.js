import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const validateCNPJ = (cnpj) => {
  // Remove caracteres não numéricos
  const digits = cnpj.replace(/\D/g, "");

  // Verifica se tem 14 dígitos
  if (digits.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }

  // Calcula primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  let firstVerifier = remainder < 2 ? 0 : 11 - remainder;

  // Calcula segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  let secondVerifier = remainder < 2 ? 0 : 11 - remainder;

  // Verifica se os dígitos calculados batem com os informados
  return (
    parseInt(digits[12]) === firstVerifier &&
    parseInt(digits[13]) === secondVerifier
  );
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const {
      cnpj,
      cidade,
      estado,
      nomeResponsavel,
      telefoneResponsavel,
      nomeEmpresa,
      foto,
    } = await request.json();

    // Validações básicas
    if (
      !cnpj ||
      !cidade ||
      !estado ||
      !nomeResponsavel ||
      !telefoneResponsavel ||
      !nomeEmpresa
    ) {
      const missingFields = [];
      if (!cnpj) missingFields.push("cnpj");
      if (!cidade) missingFields.push("cidade");
      if (!estado) missingFields.push("estado");
      if (!nomeResponsavel) missingFields.push("nomeResponsavel");
      if (!telefoneResponsavel) missingFields.push("telefoneResponsavel");
      if (!nomeEmpresa) missingFields.push("nomeEmpresa");

      return NextResponse.json(
        {
          error: `Campos obrigatórios não preenchidos: ${missingFields.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validação básica do CNPJ (formato)
    const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
    if (!cnpjRegex.test(cnpj)) {
      return NextResponse.json(
        { error: "CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX" },
        { status: 400 }
      );
    }

    // Validação dos dígitos verificadores do CNPJ
    if (!validateCNPJ(cnpj)) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
    }

    if (!session.user.id) {
      return NextResponse.json(
        { error: "ID do usuário não encontrado na sessão" },
        { status: 401 }
      );
    }

    // Criar ou atualizar informações da loja
    const lojaData = {
      cnpj: String(cnpj).trim(),
      cidade: String(cidade).trim(),
      estado: String(estado).trim(),
      nomeResponsavel: String(nomeResponsavel).trim(),
      telefoneResponsavel: String(telefoneResponsavel).trim(),
      nomeEmpresa: String(nomeEmpresa).trim(),
      foto: foto ? String(foto).trim() : null,
    };

    const loja = await prisma.loja.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        ...lojaData,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        ...lojaData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Informações da loja salvas com sucesso",
      loja: {
        id: loja.id,
        cnpj: loja.cnpj,
        cidade: loja.cidade,
        estado: loja.estado,
        nomeResponsavel: loja.nomeResponsavel,
        telefoneResponsavel: loja.telefoneResponsavel,
        nomeEmpresa: loja.nomeEmpresa,
        foto: loja.foto,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar informações da loja:", error);
    console.error("Stack trace:", error.stack);

    // Verificar se é erro de CNPJ duplicado
    if (error.code === "P2002" && error.meta?.target?.includes("cnpj")) {
      return NextResponse.json(
        { error: "CNPJ já cadastrado por outra loja" },
        { status: 400 }
      );
    }

    // Verificar se é erro de chave única duplicada
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma loja cadastrada para este usuário" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar informações da loja do usuário
    const loja = await prisma.loja.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        cnpj: true,
        cidade: true,
        estado: true,
        nomeResponsavel: true,
        telefoneResponsavel: true,
        nomeEmpresa: true,
        foto: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      loja: loja || null,
    });
  } catch (error) {
    console.error("Erro ao buscar informações da loja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Deletar a loja do usuário logado
    const deletedLoja = await prisma.loja.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    if (deletedLoja.count === 0) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cadastro da loja removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover cadastro da loja:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

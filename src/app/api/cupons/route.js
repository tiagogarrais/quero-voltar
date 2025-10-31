import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // If userId is provided, get coupons for that user (for admin or specific user)
    // Otherwise, get coupons for the current user
    const targetUserId = userId || session.user.id;

    const coupons = await prisma.cupom.findMany({
      where: {
        loja: {
          userId: targetUserId,
        },
      },
      include: {
        loja: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { discountType, discountValue, quantity, validityDays, isVisible } =
      body;

    // Validate required fields
    if (!discountType || !discountValue || !quantity || !validityDays) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate discountType
    if (!["VALUE", "PERCENTAGE", "BRINDE"].includes(discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discountValue based on type
    if (
      discountType === "PERCENTAGE" &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return NextResponse.json(
        { error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (discountType === "VALUE" && discountValue <= 0) {
      return NextResponse.json(
        { error: "Value discount must be greater than 0" },
        { status: 400 }
      );
    }

    if (discountType === "BRINDE" && !discountValue.trim()) {
      return NextResponse.json(
        { error: "Brinde description is required" },
        { status: 400 }
      );
    }

    // Validate quantity and validityDays
    if (quantity <= 0 || validityDays <= 0) {
      return NextResponse.json(
        { error: "Quantity and validity days must be greater than 0" },
        { status: 400 }
      );
    }

    // Check if user has a store
    const loja = await prisma.loja.findUnique({
      where: { userId: session.user.id },
    });

    if (!loja) {
      return NextResponse.json(
        { error: "User must have a registered store to create coupons" },
        { status: 400 }
      );
    }

    // Generate unique coupon code
    const generateCouponCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    let couponCode;
    let codeExists = true;
    let attempts = 0;

    // Ensure unique coupon code
    while (codeExists && attempts < 10) {
      couponCode = generateCouponCode();
      const existingCoupon = await prisma.cupom.findUnique({
        where: { codigo: couponCode },
      });
      codeExists = !!existingCoupon;
      attempts++;
    }

    if (codeExists) {
      return NextResponse.json(
        { error: "Unable to generate unique coupon code" },
        { status: 500 }
      );
    }

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(validityDays));

    // Create the coupon
    const coupon = await prisma.cupom.create({
      data: {
        lojaId: loja.id,
        codigo: couponCode,
        tipo: discountType,
        valor: discountType === "BRINDE" ? null : parseFloat(discountValue),
        descricao: discountType === "BRINDE" ? discountValue : null,
        quantidade: parseInt(quantity),
        validadeDias: parseInt(validityDays),
        dataExpiracao: expirationDate,
        visivel: isVisible !== undefined ? isVisible : true,
        status: "ativo",
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      discountType,
      discountValue,
      quantity,
      validityDays,
      isVisible,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    // Check if coupon exists and belongs to user
    const existingCoupon = await prisma.cupom.findFirst({
      where: {
        id,
        loja: {
          userId: session.user.id,
        },
      },
      include: {
        loja: true,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Validate discountType if provided
    if (
      discountType &&
      !["VALUE", "PERCENTAGE", "BRINDE"].includes(discountType)
    ) {
      return NextResponse.json(
        { error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discountValue based on type if provided
    if (
      discountType === "PERCENTAGE" &&
      discountValue !== undefined &&
      (discountValue < 0 || discountValue > 100)
    ) {
      return NextResponse.json(
        { error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (
      discountType === "VALUE" &&
      discountValue !== undefined &&
      discountValue <= 0
    ) {
      return NextResponse.json(
        { error: "Value discount must be greater than 0" },
        { status: 400 }
      );
    }

    if (
      discountType === "BRINDE" &&
      discountValue !== undefined &&
      !discountValue.trim()
    ) {
      return NextResponse.json(
        { error: "Brinde description is required" },
        { status: 400 }
      );
    }

    // Validate quantity and validityDays if provided
    if (quantity !== undefined && quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    if (validityDays !== undefined && validityDays <= 0) {
      return NextResponse.json(
        { error: "Validity days must be greater than 0" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {};
    if (discountType !== undefined) updateData.tipo = discountType;
    if (discountValue !== undefined) {
      updateData.valor = discountType === "BRINDE" ? null : parseFloat(discountValue);
      updateData.descricao = discountType === "BRINDE" ? discountValue : null;
    }
    if (quantity !== undefined) updateData.quantidade = parseInt(quantity);
    if (validityDays !== undefined) {
      updateData.validadeDias = parseInt(validityDays);
      // Recalculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(validityDays));
      updateData.dataExpiracao = expirationDate;
    }
    if (isVisible !== undefined) updateData.visivel = isVisible;

    // Update the coupon
    const updatedCoupon = await prisma.cupom.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 }
      );
    }

    // Check if coupon exists and belongs to user
    const existingCoupon = await prisma.cupom.findFirst({
      where: {
        id,
        loja: {
          userId: session.user.id,
        },
      },
      include: {
        loja: true,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Delete the coupon
    await prisma.cupom.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

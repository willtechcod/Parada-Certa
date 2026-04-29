import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { promotionSchema } from '@/lib/validations';

export const runtime = 'nodejs';

// Schema for PATCH (toggle active status)
const togglePromotionSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  active: z.boolean(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(promotions);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = promotionSchema.parse(body);

    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        discount: data.discount,
        vehicleType: data.vehicleType === 'TODOS' ? null : data.vehicleType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });

    return NextResponse.json(promotion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = togglePromotionSchema.parse(body);
    const { id, active } = data;

    const promotion = await prisma.promotion.update({
      where: { id },
      data: { active },
    });

    return NextResponse.json(promotion);
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
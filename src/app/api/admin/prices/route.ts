import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

const priceSchema = z.object({
  type: z.enum(['CARRO', 'MOTO']),
  pricePerMin: z.number().positive(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const prices = await prisma.price.findMany();
  return NextResponse.json(prices);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = priceSchema.parse(body);

    const price = await prisma.price.upsert({
      where: { type: data.type },
      update: { pricePerMin: data.pricePerMin },
      create: { type: data.type, pricePerMin: data.pricePerMin },
    });

    return NextResponse.json(price);
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
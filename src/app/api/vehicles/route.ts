import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { vehicleSchema } from '@/lib/validations';
import { z } from 'zod';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('GET /api/vehicles error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = vehicleSchema.parse(body);

    const prices = await prisma.price.findMany();
    const priceMap: Record<string, number> = Object.fromEntries(
      prices.map((p) => [p.type, p.pricePerMin])
    ) as Record<string, number>;
    const pricePerMin = priceMap[data.type] || (data.type === 'CARRO' ? 10/60 : 5/60);

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: data.plate.toUpperCase(),
        model: data.model,
        type: data.type,
        startTime: new Date(),
        pricePerMin: pricePerMin,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0];
      return NextResponse.json(
        { error: firstError?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }
    console.error('POST /api/vehicles error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

const vehicleSchema = z.object({
  plate: z.string().min(7).max(7),
  model: z.string().min(1),
  type: z.enum(['CARRO', 'MOTO']),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const prices = await prisma.price.findMany();
    const priceMap = Object.fromEntries(prices.map((p) => [p.type, p.pricePerMin]));

    const vehiclesWithPrice = vehicles.map((v) => ({
      ...v,
      pricePerMin: priceMap[v.type] || (v.type === 'CARRO' ? 10/60 : 5/60),
    }));

    return NextResponse.json(vehiclesWithPrice);
  } catch (error) {
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

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: data.plate.toUpperCase(),
        model: data.model,
        type: data.type,
        startTime: new Date(),
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
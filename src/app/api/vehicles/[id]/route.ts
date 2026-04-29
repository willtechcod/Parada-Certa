import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

// Preços por minuto (R$ 10/hora = 0.1667/min, R$ 5/hora = 0.0833/min)
const PRICES = {
  CARRO: 10.0 / 60,
  MOTO: 5.0 / 60,
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      );
    }

    if (vehicle.endTime) {
      return NextResponse.json(
        { error: 'Veículo já foi finalizado' },
        { status: 400 }
      );
    }

    const endTime = new Date();
    const startTime = new Date(vehicle.startTime);
    const diffMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.ceil(diffMs / 60000);
    const pricePerMin = vehicle.pricePerMin || PRICES[vehicle.type];
    const pricePerHour = pricePerMin * 60;

    // Nueva lógica:
    // - Até 29 min: proporcional ao minuto
    // - 30 min: metade do valor da hora
    // - Após 1h: valor da hora + minuto proporcional excedido
    let totalPrice: number;
    let billableMinutes: number;

    if (minutes <= 29) {
      // Até 29 min: proporcional ao minuto
      totalPrice = minutes * pricePerMin;
      billableMinutes = minutes;
    } else if (minutes === 30) {
      // 30 min: metade do valor da hora
      totalPrice = pricePerHour / 2;
      billableMinutes = 30;
    } else if (minutes <= 60) {
      // Entre 31-60 min: valor da hora cheia
      totalPrice = pricePerHour;
      billableMinutes = 60;
    } else {
      // Após 1h: valor da hora + minuto proporcional excedido
      const hours = Math.floor(minutes / 60);
      const exceededMinutes = minutes % 60;
      totalPrice = (hours * pricePerHour) + (exceededMinutes * pricePerMin);
      billableMinutes = minutes;
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        endTime,
        totalPrice,
      },
    });

    return NextResponse.json({
      ...updatedVehicle,
      minutes,
      billableMinutes,
      totalPrice,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Veículo não encontrado' },
        { status: 404 }
      );
    }

    let minutes = 0;
    let currentPrice = 0;
    let billableMinutes = 0;

    if (!vehicle.endTime) {
      const startTime = new Date(vehicle.startTime);
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      minutes = Math.ceil(diffMs / 60000);
      const pricePerMin = vehicle.pricePerMin || PRICES[vehicle.type];
      const pricePerHour = pricePerMin * 60;

      // Mesma lógica
      if (minutes <= 29) {
        currentPrice = minutes * pricePerMin;
        billableMinutes = minutes;
      } else if (minutes === 30) {
        currentPrice = pricePerHour / 2;
        billableMinutes = 30;
      } else if (minutes <= 60) {
        currentPrice = pricePerHour;
        billableMinutes = 60;
      } else {
        const hours = Math.floor(minutes / 60);
        const exceededMinutes = minutes % 60;
        currentPrice = (hours * pricePerHour) + (exceededMinutes * pricePerMin);
        billableMinutes = minutes;
      }
    } else {
      minutes = vehicle.totalPrice
        ? Math.round(vehicle.totalPrice / (vehicle.pricePerMin || 0.0833))
        : 0;
      currentPrice = vehicle.totalPrice || 0;
      billableMinutes = minutes;
    }

    return NextResponse.json({
      ...vehicle,
      minutes,
      billableMinutes,
      currentPrice,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

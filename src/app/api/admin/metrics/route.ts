import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '6months';
  
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'month':
      startDate = startOfMonth(now);
      break;
    case 'year':
      startDate = startOfYear(now);
      break;
    case '6months':
    default:
      startDate = subMonths(now, 6);
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      id: true,
      type: true,
      totalPrice: true,
      startTime: true,
      endTime: true,
    },
  });

  const totalVehicles = vehicles.length;
  const totalCars = vehicles.filter(v => v.type === 'CARRO').length;
  const totalMotos = vehicles.filter(v => v.type === 'MOTO').length;
  const totalRevenue = vehicles.reduce((sum, v) => sum + (v.totalPrice || 0), 0);
  
  const completedVehicles = vehicles.filter(v => v.endTime !== null);
  const monthlyData = getMonthlyData(completedVehicles, startDate, now);

  return NextResponse.json({
    totalVehicles,
    totalCars,
    totalMotos,
    totalRevenue,
    monthlyData,
  });
}

function getMonthlyData(
  vehicles: { type: string; totalPrice: number | null; startTime: Date }[],
  startDate: Date,
  endDate: Date
) {
  const data: { month: string; cars: number; motorcycles: number; revenue: number }[] = [];
  
  let current = new Date(startDate);
  while (current <= endDate) {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    
    const monthVehicles = vehicles.filter(v => {
      const date = new Date(v.startTime);
      return date >= monthStart && date <= monthEnd;
    });
    
    const monthCars = monthVehicles.filter(v => v.type === 'CARRO').length;
    const monthMotos = monthVehicles.filter(v => v.type === 'MOTO').length;
    const monthRevenue = monthVehicles.reduce((sum, v) => sum + (v.totalPrice || 0), 0);
    
    data.push({
      month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      cars: monthCars,
      motorcycles: monthMotos,
      revenue: monthRevenue,
    });
    
    current = new Date(current.setMonth(current.getMonth() + 1));
  }
  
  return data;
}
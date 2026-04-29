import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { subMonths, format, startOfMonth, startOfYear } from 'date-fns';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get('period') || 'month';
  const format_ = url.searchParams.get('format') || 'xlsx';

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = subWeeks(now, 1);
      break;
    case 'month':
      startDate = startOfMonth(now);
      break;
    case '3months':
      startDate = subMonths(now, 3);
      break;
    case '6months':
      startDate = subMonths(now, 6);
      break;
    case 'year':
      startDate = startOfYear(now);
      break;
    default:
      startDate = subMonths(now, 1);
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
      createdAt: { gte: startDate },
      endTime: { not: null },
    },
    orderBy: { startTime: 'desc' },
  });

  if (format_ === 'json') {
    return NextResponse.json(vehicles);
  }

  const data = vehicles.map(v => {
    const start = new Date(v.startTime);
    const end = new Date(v.endTime!);
    const minutes = Math.ceil((end.getTime() - start.getTime()) / 60000);
    
    return {
      Placa: v.plate,
      Modelo: v.model,
      Tipo: v.type === 'CARRO' ? 'Carro' : 'Moto',
      'Entrada': format(start, 'dd/MM/yyyy HH:mm'),
      'Saída': format(end, 'dd/MM/yyyy HH:mm'),
      'Tempo (min)': minutes,
      'Valor (R$)': v.totalPrice?.toFixed(2) || '0.00',
    };
  });

  if (format_ === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="relatorio-${period}.xlsx"`,
      },
    });
  }

  return NextResponse.json({ vehicles, total: vehicles.length });
}
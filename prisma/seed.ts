import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

const dbPath = path.join(__dirname, 'dev.db');
const libsql = createClient({ url: `file:${dbPath}` });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  const adminPassword = await hash('admin123', 10);
  const operadorPassword = await hash('operador123', 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@willtechcode.com.br' },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@willtechcode.com.br',
        password: adminPassword,
        name: 'Administrador',
        role: 'ADMIN',
      },
    });
  }

  const existingOperador = await prisma.user.findUnique({
    where: { email: 'operador@willtechcode.com.br' },
  });

  if (!existingOperador) {
    await prisma.user.create({
      data: {
        email: 'operador@willtechcode.com.br',
        password: operadorPassword,
        name: 'Operador',
        role: 'USER',
      },
    });
  }

   const prices = await prisma.price.findMany();
  if (prices.length === 0) {
    // R$ 10/hora = 10/60 = 0.1667/min para CARRO
    // R$ 5/hora = 5/60 = 0.0833/min para MOTO
    await prisma.price.create({ data: { type: 'CARRO', pricePerMin: 10.0 / 60 } });
    await prisma.price.create({ data: { type: 'MOTO', pricePerMin: 5.0 / 60 } });
    console.log('   Prices created: CARRO R$10.00/h, MOTO R$5.00/h');
  }

  console.log('✅ Seed completed!');
  console.log('   Admin: admin@willtechcode.com.br (ADMIN)');
  console.log('   Operador: operador@willtechcode.com.br (USER)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
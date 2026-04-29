const bcrypt = require('bcryptjs');

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operadorPassword = await bcrypt.hash('operador123', 10);
  const { randomUUID } = require('crypto');
  const now = new Date().toISOString();
  
  console.log(`INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt") VALUES 
('${randomUUID()}', 'admin@willtechcode.com.br', '${adminPassword}', 'Administrador', 'ADMIN', '${now}', '${now}'),
('${randomUUID()}', 'operador@willtechcode.com.br', '${operadorPassword}', 'Operador', 'USER', '${now}', '${now}')`);
}

main();
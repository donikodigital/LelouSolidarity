import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'contact.lelousolidarity@gmail.com';
  const password = 'Lcd123456!';

  const admin = await prisma.admin.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!admin) {
    console.log('AUCUN admin trouve avec cet email exact.');
    const all = await prisma.admin.findMany({ select: { email: true } });
    console.log('Emails presents en base :', all.map((a) => JSON.stringify(a.email)));
    return;
  }

  console.log('Admin trouve, email en base :', JSON.stringify(admin.email));
  const valid = await bcrypt.compare(password, admin.passwordHash);
  console.log('Mot de passe valide ?', valid);
}

main().finally(() => prisma.$disconnect());
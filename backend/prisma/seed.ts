import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'contact.lelousolidarity@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Lcd123456!';
  const name = process.env.ADMIN_NAME || 'Administrateur';

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL et ADMIN_PASSWORD doivent etre definis dans .env avant de lancer le seed.',
    );
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Un administrateur existe deja pour ${email}, rien a faire.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.create({
    data: { email, passwordHash, name },
  });

  console.log(`Compte administrateur cree pour ${email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
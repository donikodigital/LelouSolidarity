import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Aucune valeur par défaut : l'e-mail et le mot de passe de l'administrateur
  // initial doivent venir de l'environnement (.env en local, variables Render),
  // jamais du code source (le dépôt est public).
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrateur';

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL et ADMIN_PASSWORD doivent etre definis dans .env avant de lancer le seed.',
    );
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD doit contenir au moins 12 caracteres.');
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Un administrateur existe deja pour ${email}, rien a faire.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
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

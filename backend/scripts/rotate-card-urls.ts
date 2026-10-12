// backend/scripts/rotate-card-urls.ts
//
// Renomme sur Cloudinary les PDF de cartes émis AVANT le correctif de sécurité
// (nom devinable : carte_LS-2026-0001.pdf) vers un nom aléatoire, puis met à
// jour `cardPdfUrl` en base. Aucun e-mail n'est envoyé aux membres.
//
// Utilisation (depuis le dossier backend, avec le .env rempli) :
//   npx ts-node scripts/rotate-card-urls.ts           -> simulation, ne change rien
//   npx ts-node scripts/rotate-card-urls.ts --apply   -> applique les changements
//
// Sûr à relancer : les cartes déjà renommées sont ignorées.
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { randomBytes } from 'crypto';

try {
  process.loadEnvFile(); // Node 20.12+ : charge le fichier .env du dossier courant
} catch {
  /* pas de fichier .env : on utilise les variables déjà définies */
}

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Identifiant public d'un fichier "raw" : chemin après /raw/upload/ (et la version éventuelle), extension comprise.
function extractRawPublicId(url: string): string | null {
  const match = url.match(/\/raw\/upload\/(?:v\d+\/)?([^?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const ALREADY_RANDOM = /_[0-9a-f]{32}\.pdf$/i;

async function main() {
  const members = await prisma.member.findMany({
    where: { cardPdfUrl: { not: null } },
    select: { id: true, email: true, memberCode: true, cardPdfUrl: true },
  });

  console.log(
    `${members.length} carte(s) avec PDF. Mode : ${APPLY ? 'APPLICATION' : 'SIMULATION (ajoute --apply pour appliquer)'}`,
  );

  let renamed = 0;
  let skipped = 0;
  let failed = 0;

  for (const member of members) {
    const label = member.memberCode ?? member.id;
    const publicId = member.cardPdfUrl ? extractRawPublicId(member.cardPdfUrl) : null;

    if (!publicId) {
      console.warn(`- ${label} : URL non reconnue, ignorée.`);
      failed++;
      continue;
    }
    if (ALREADY_RANDOM.test(publicId)) {
      skipped++;
      continue;
    }

    const newPublicId = `${publicId.replace(/\.pdf$/i, '')}_${randomBytes(16).toString('hex')}.pdf`;
    console.log(`- ${label} : ${publicId}  ->  ${newPublicId}`);
    if (!APPLY) continue;

    try {
      const result = await cloudinary.uploader.rename(publicId, newPublicId, {
        resource_type: 'raw',
        overwrite: false,
        invalidate: true,
      });
      await prisma.member.update({
        where: { id: member.id },
        data: { cardPdfUrl: result.secure_url },
      });
      renamed++;
    } catch (err) {
      failed++;
      console.error(`  ECHEC pour ${label} : ${(err as Error).message ?? JSON.stringify(err)}`);
    }
  }

  console.log(
    `Terminé : ${APPLY ? renamed + ' renommée(s)' : 'simulation'}, ${skipped} déjà aléatoire(s), ${failed} échec(s).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

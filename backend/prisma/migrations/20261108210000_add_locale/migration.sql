-- Langue choisie par la personne (« fr » ou « en ») : sert aux e-mails, à la carte PDF
-- et aux rappels d'expiration. « fr » pour tout ce qui existait déjà.
ALTER TABLE "FormRequest" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE "Member" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'fr';

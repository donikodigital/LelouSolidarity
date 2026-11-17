-- Langue d'affichage propre à chaque gérant (« fr », « en » ou « ff »).
-- Avant, la langue n'était mémorisée que dans le navigateur : la personne suivante
-- qui se connectait depuis le même appareil héritait de la langue de la précédente.
-- « fr » pour les comptes existants.
ALTER TABLE "Admin" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'fr';

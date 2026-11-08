-- Demande de formulaire : Etat et Pays de residence (la ville ne contient plus « Etats-Unis »).
-- Etat vide pour les demandes deja enregistrees : le membre le saisit alors lui-meme dans le formulaire.
ALTER TABLE "FormRequest" ADD COLUMN "state" TEXT NOT NULL DEFAULT '';
ALTER TABLE "FormRequest" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'États-Unis';

-- Membre : ville de naissance (vide pour les membres deja enregistres, l'administrateur peut la completer)
-- et pays de residence.
ALTER TABLE "Member" ADD COLUMN "birthCity" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'États-Unis';

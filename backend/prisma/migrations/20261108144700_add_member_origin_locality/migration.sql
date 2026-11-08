-- Localité d'origine du membre (ex. Korbé, Sagalé), imprimée sous la ville d'origine sur la carte.
-- Valeur vide pour les membres déjà enregistrés : l'administrateur peut la compléter depuis la fiche membre.
ALTER TABLE "Member" ADD COLUMN "originLocality" TEXT NOT NULL DEFAULT '';

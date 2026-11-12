-- Profil du gérant : coordonnées, photo, préférence de notification et suivi des connexions.
-- Colonnes facultatives ou avec valeur par défaut : le compte administrateur existant n'est pas modifié.
ALTER TABLE "Admin" ADD COLUMN "phone" TEXT;
ALTER TABLE "Admin" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "Admin" ADD COLUMN "avatarPublicId" TEXT;
ALTER TABLE "Admin" ADD COLUMN "notifyFormRequests" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Admin" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "Admin" ADD COLUMN "previousLoginAt" TIMESTAMP(3);
ALTER TABLE "Admin" ADD COLUMN "sessionsRevokedAt" TIMESTAMP(3);

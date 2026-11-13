-- Poste du membre dans l'association (imprimé sur la carte).
-- Les membres existants prennent « MEMBER » (simple membre).
ALTER TABLE "Member" ADD COLUMN "position" TEXT NOT NULL DEFAULT 'MEMBER';
ALTER TABLE "Member" ADD COLUMN "positionOther" TEXT NOT NULL DEFAULT '';

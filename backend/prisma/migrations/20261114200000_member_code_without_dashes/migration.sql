-- Code membre sans tiret ni espace : LS-2026-0001 devient LS20260001.
-- Chaque code garde son numéro unique, il n'y a donc aucun risque de doublon (index unique).
-- Les cartes PDF déjà émises gardent l'ancien code imprimé jusqu'à leur régénération.
UPDATE "Member"
SET "memberCode" = regexp_replace("memberCode", '[-[:space:]]', '', 'g')
WHERE "memberCode" ~ '[-[:space:]]';

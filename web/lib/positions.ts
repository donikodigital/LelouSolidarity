//web/lib/positions.ts
// Postes proposés dans l'association (même liste que backend/src/common/positions.ts).
// « OTHER » = poste saisi librement (positionOther).
export const POSITION_CODES = ['MEMBER', 'PRESIDENT', 'TREASURER', 'SECRETARY_GENERAL', 'OTHER'] as const;
export type PositionCode = (typeof POSITION_CODES)[number];
export const MAX_POSITION_OTHER_LENGTH = 60;

/** Intitulé du poste : le texte saisi pour « Autre », sinon le libellé de la langue courante. */
export function positionText(
  labels: Record<PositionCode, string>,
  position: string | undefined,
  other: string | undefined,
): string {
  if (position === 'OTHER') return (other ?? '').trim() || labels.MEMBER;
  return labels[(position as PositionCode) ?? 'MEMBER'] ?? labels.MEMBER;
}

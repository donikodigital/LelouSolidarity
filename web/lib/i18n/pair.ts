//web/lib/i18n/pair.ts
// Garantit que le dictionnaire anglais a exactement les mêmes clés que le français.
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? Widen<U>[]
      : T extends object
        ? { [K in keyof T]: Widen<T[K]> }
        : T;

/**
 * Un dictionnaire par langue. Le pular (ff) est facultatif : sans lui, la langue
 * retombe sur le français (c'est le cas de l'espace administrateur).
 */
export function pair<T>(fr: T, en: Widen<T>, ff?: Widen<T>) {
  return { fr, en, ff: (ff ?? fr) as Widen<T> };
}

/** Remplace {nom} par la valeur correspondante. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

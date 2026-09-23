import { randomInt } from 'crypto';

// Alphabet volontairement prive des caracteres ambigus (0/O, 1/I/L)
// pour que le code reste facile a lire et a retaper depuis un e-mail.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateAccessCode(length = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return code;
}

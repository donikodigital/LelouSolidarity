"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessCode = generateAccessCode;
const crypto_1 = require("crypto");
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateAccessCode(length = 8) {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += ALPHABET[(0, crypto_1.randomInt)(0, ALPHABET.length)];
    }
    return code;
}
//# sourceMappingURL=code-generator.js.map
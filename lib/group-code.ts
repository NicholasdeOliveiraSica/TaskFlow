const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Gera um código aleatório de 6 caracteres (letras maiúsculas + dígitos).
 * Ex: "AX3K9Z"
 */
export function generateGroupCode(): string {
  return Array.from({ length: 6 }, () =>
    ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join('')
}

/**
 * Valida se o código tem exatamente 6 caracteres alfanuméricos maiúsculos.
 */
export function validateGroupCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}

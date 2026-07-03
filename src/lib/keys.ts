import { parseSeedPhrase } from "near-seed-phrase";

/**
 * A BIP-39 mnemonic is a list of words (12 / 15 / 18 / 21 / 24 of them), while a
 * NEAR private key is a single `curve:base58data` token with no whitespace. We
 * use the word count to tell the two apart.
 */
export function isSeedPhrase(input: string): boolean {
  return input.trim().split(/\s+/).length >= 12;
}

/**
 * Normalises a user-provided secret into a NEAR private key string suitable for
 * `KeyPair.fromString`. Accepts either:
 *   - an existing private key (`ed25519:...`), returned as-is, or
 *   - a BIP-39 seed phrase, derived with NEAR's standard path (m/44'/397'/0').
 *
 * Derivation happens entirely client-side; the seed phrase never leaves the
 * browser.
 */
export function toPrivateKey(input: string): string {
  const trimmed = input.trim();
  if (isSeedPhrase(trimmed)) {
    return parseSeedPhrase(trimmed).secretKey;
  }
  return trimmed;
}

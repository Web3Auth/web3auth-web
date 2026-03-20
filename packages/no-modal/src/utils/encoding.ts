import { getBase58Decoder, getBase58Encoder } from "@solana/kit";

const base58Decoder = getBase58Decoder();
const base58Encoder = getBase58Encoder();

/**
 * Encode raw bytes as a base58 string (Solana addresses, signatures, etc.).
 */
export function encodeBase58(bytes: Uint8Array): string {
  return base58Decoder.decode(bytes);
}

/**
 * Decode a base58 string to raw bytes.
 */
export function decodeBase58(base58: string): Uint8Array {
  return new Uint8Array(base58Encoder.encode(base58));
}

/**
 * UTF-8 string → bytes (e.g. for Wallet Standard Solana `signMessage`).
 */
export function toBytes(utf8: string): Uint8Array {
  return new TextEncoder().encode(utf8);
}

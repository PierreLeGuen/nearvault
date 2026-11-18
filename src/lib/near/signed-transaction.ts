import { SignedTransaction } from "near-api-js";

/**
 * Decodes the signed transaction a wallet returned for `requested`, the
 * serialized transaction that was sent to it for signing. Throws unless the
 * response is exactly one signed transaction and that transaction is
 * byte-for-byte the one requested. near-api-js 7 decodes a valid prefix and
 * ignores trailing bytes, so both checks compare re-encoded bytes.
 */
export function decodeRequestedSignedTransaction(
  signedBytes: Uint8Array,
  requested: Uint8Array,
): SignedTransaction {
  const signed = SignedTransaction.decode(signedBytes);
  if (!Buffer.from(signed.encode()).equals(Buffer.from(signedBytes))) {
    throw new Error(
      "The wallet returned an unexpected signed transaction; nothing was broadcast.",
    );
  }
  if (
    !Buffer.from(signed.transaction.encode()).equals(Buffer.from(requested))
  ) {
    throw new Error(
      "The wallet signed a different transaction from the one requested; nothing was broadcast.",
    );
  }
  return signed;
}

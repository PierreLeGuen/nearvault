import { sha256 } from "js-sha256";
import {
  PublicKey,
  Signature,
  SignedTransaction,
  Signer,
  type Transaction,
  encodeTransaction,
} from "near-api-js";
import { LedgerClient } from "./LedgerClient";

const randomPublicKey = "ed25519:EU3JT4N2ahWEzVPfcjEutG89ZDfX1vcqeYz9N1DDest6";

/**
 * Signs with the NEAR Ledger app. The device takes the full serialized
 * transaction (it shows the details and hashes it itself), so this signer
 * overrides `signTransaction` rather than signing a precomputed hash.
 */
export class LedgerSigner extends Signer {
  private ledger: LedgerClient;
  private derivationPath: string;

  constructor(derivationPath: string) {
    super();
    this.ledger = new LedgerClient();
    this.derivationPath = derivationPath;
  }

  // We don't use this method - it exists only for type matching
  getPublicKey(): Promise<PublicKey> {
    return Promise.resolve(PublicKey.from(randomPublicKey));
  }

  protected signBytes(): Promise<Uint8Array> {
    return Promise.reject(
      new Error("The Ledger app signs whole transactions, not bare hashes"),
    );
  }

  async signTransaction(transaction: Transaction) {
    const message = encodeTransaction(transaction);
    const txHash = new Uint8Array(sha256.array(message));
    const signature = await this.signMessage(message);
    const signedTransaction = new SignedTransaction({
      transaction,
      signature: new Signature({
        keyType: transaction.publicKey.keyType,
        data: signature,
      }),
    });
    return { txHash, signedTransaction };
  }

  private async signMessage(message: Uint8Array): Promise<Uint8Array> {
    try {
      await this.ledger.connect();
      return await this.ledger.sign({
        data: message,
        derivationPath: this.derivationPath,
      });
    } catch (e) {
      console.log("ledger sign failed", (e as Error)?.name);
      throw e;
    } finally {
      await this.ledger.disconnect();
    }
  }
}

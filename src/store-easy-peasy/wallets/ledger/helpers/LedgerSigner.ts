import { Signer } from "near-api-js";
import { Signature, PublicKey } from "@near-js/crypto";
import { LedgerClient } from "./LedgerClient";

const randomPublicKey = "ed25519:EU3JT4N2ahWEzVPfcjEutG89ZDfX1vcqeYz9N1DDest6";

export class LedgerSigner extends Signer {
  private ledger: LedgerClient;

  constructor() {
    super();
    this.ledger = new LedgerClient();
  }

  // We don't use this method - it exists only for type matching
  async createKey() {
    return PublicKey.from(randomPublicKey);
  }

  // We don't use this method - it exists only for type matching
  async getPublicKey(_accountId?: string, _networkId?: string) {
    return PublicKey.from(randomPublicKey);
  }

  async signMessage(
    message: Uint8Array,
    _accountId?: string,
    _networkId?: string,
  ): Promise<Signature> {
    try {
      await this.ledger.connect();
      const signature = await this.ledger.sign({ data: message });

      return {
        signature,
        publicKey: "" as unknown as PublicKey,
      };
    } catch (e) {
      console.log(e);
      throw e;
    } finally {
      await this.ledger.disconnect();
    }
  }
}

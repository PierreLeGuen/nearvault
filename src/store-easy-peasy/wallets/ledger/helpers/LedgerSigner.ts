import { Signer } from 'near-api-js';
import { Signature, PublicKey } from '@near-js/crypto';
import { LedgerClient } from './LedgerClient';

export class LedgerSigner extends Signer {
  private ledger: LedgerClient;

  constructor() {
    super();
    this.ledger = new LedgerClient();
  }

  // @ts-ignore
  async createKey() {}

  getPublicKey(accountId?: string, networkId?: string): Promise<PublicKey> {
    // TODO Get Pk from selected account
    return Promise.resolve(PublicKey.from(''));
  }

  async signMessage(
    message: Uint8Array,
    accountId?: string,
    networkId?: string,
  ): Promise<Signature> {
    try {
      await this.ledger.connect();
      const signature = await this.ledger.sign({ data: message });
      const publicKey = await this.getPublicKey(accountId, networkId);

      return {
        signature,
        publicKey,
      };
    } catch (e) {
      console.log(e);
      throw e;
    } finally {
      await this.ledger.disconnect();
    }

  }
}

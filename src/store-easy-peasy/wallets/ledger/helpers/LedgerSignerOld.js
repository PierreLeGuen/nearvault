import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { Signer } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';
import { createClient } from 'near-ledger-js';

const defaultHooks = {
  onBeforeSignTx: () => {},
  onAfterSignTx: () => {},
};

export class LedgerSignerOld extends Signer {
  constructor() {
    super();
    this.client = null;
    this.hooks = defaultHooks;
  }

  async getPublicKey() {
    return PublicKey.from('ed25519:Cehn9GS2TfVmLycaATBmB58mooxRizRWBEr9r85epPV');
  }

  async signMessage(message) {
    try {
      const transport = await TransportWebHID.create();
      this.client = await createClient(transport);

      this.hooks.onBeforeSignTx();
      const signature = await this.client.sign(message);
      const publicKey = await this.getPublicKey();
      this.hooks.onAfterSignTx();

      return {
        signature,
        publicKey,
      };
    } catch (error) {
      error.fromLedgerSigner = true;
      throw error;
    } finally {
      await this.client?.transport?.close();
    }
  }
}

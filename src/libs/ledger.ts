import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { Signer } from "near-api-js";
import { PublicKey } from "near-api-js/lib/utils";

function bip32PathToBytes(path: string) {
  const parts = path.split("/");
  return Buffer.concat(
    parts
      .map((part) =>
        part.endsWith(`'`)
          ? Math.abs(parseInt(part.slice(0, -1))) | 0x80000000
          : Math.abs(parseInt(part))
      )
      .map((i32) =>
        Buffer.from([
          (i32 >> 24) & 0xff,
          (i32 >> 16) & 0xff,
          (i32 >> 8) & 0xff,
          i32 & 0xff,
        ])
      )
  );
}

const networkId = "W".charCodeAt(0);
const DEFAULT_PATH = "44'/397'/0'/0'/1'";

export async function createClient() {
  const transport = await TransportWebHID.create();

  return {
    transport,
    async getVersion() {
      const response = await this.transport.send(0x80, 6, 0, 0);
      const [major, minor, patch] = Array.from(response);
      if (!major || !minor || !patch) {
        throw new Error("App does not support getVersion");
      }
      return `${major}.${minor}.${patch}`;
    },
    async getPublicKey(path: string) {
      path = path || DEFAULT_PATH;
      const response = await this.transport.send(
        0x80,
        4,
        0,
        networkId,
        bip32PathToBytes(path)
      );
      return Buffer.from(response.subarray(0, -2));
    },
    async sign(transactionData: Uint8Array, path: string): Promise<Uint8Array> {
      // NOTE: getVersion call allows to reset state to avoid starting from partially filled buffer
      const version = await this.getVersion();
      console.info("Ledger app version:", version);
      // TODO: Assert compatible versions

      path = path || DEFAULT_PATH;
      transactionData = Buffer.from(transactionData);
      // 128 - 5 service bytes
      const CHUNK_SIZE = 123;
      const allData = Buffer.concat([bip32PathToBytes(path), transactionData]);
      for (let offset = 0; offset < allData.length; offset += CHUNK_SIZE) {
        const chunk = Buffer.from(
          allData.subarray(offset, offset + CHUNK_SIZE)
        );
        const isLastChunk = offset + CHUNK_SIZE >= allData.length;
        const response = await this.transport.send(
          0x80,
          2,
          isLastChunk ? 0x80 : 0,
          networkId,
          chunk
        );
        if (isLastChunk) {
          return Buffer.from(response.subarray(0, -2));
        }
      }
      throw new Error("Should not happen");
    },
  };
}

const defaultHooks = {
  onBeforeSignTx: () => {},
  onAfterSignTx: () => {},
};

export class LedgerSigner extends Signer {
  client: null;
  hooks: any;
  useWalletContext: any;

  constructor(useWalletContext) {
    super();
    this.client = null;
    this.hooks = defaultHooks;
    this.useWalletContext = useWalletContext;
  }

  setHooks(hooks) {
    this.hooks = { ...this.hooks, ...hooks };
  }

  resetHooks() {
    this.hooks = defaultHooks;
  }

  async getPublicKey() {
    return PublicKey.from(this.getStoreState().general.user.publicKey);
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

  createKey(
    accountId: string,
    networkId?: string | undefined
  ): Promise<PublicKey> {
    throw new Error("Method not implemented.");
  }
}

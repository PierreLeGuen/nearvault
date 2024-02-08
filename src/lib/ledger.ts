import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { Signer } from "near-api-js";
import { PublicKey } from "near-api-js/lib/utils";
import { type IStore } from "~/store/useStore";

function bip32PathToBytes(path: string) {
  const parts = path.split("/");
  return Buffer.concat(
    parts
      .map((part) =>
        part.endsWith(`'`)
          ? Math.abs(parseInt(part.slice(0, -1))) | 0x80000000
          : Math.abs(parseInt(part)),
      )
      .map((i32) =>
        Buffer.from([
          (i32 >> 24) & 0xff,
          (i32 >> 16) & 0xff,
          (i32 >> 8) & 0xff,
          i32 & 0xff,
        ]),
      ),
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
      return `${major}.${minor}.${patch}`;
    },
    async getPublicKey(path: string) {
      path = path || DEFAULT_PATH;
      const response = await this.transport.send(
        0x80,
        4,
        0,
        networkId,
        bip32PathToBytes(path),
      );
      return PublicKey.from(Buffer.from(response.subarray(0, -2)).toString());
    },
    async sign(
      transactionData: Uint8Array,
      path: string | null,
    ): Promise<Uint8Array> {
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
          allData.subarray(offset, offset + CHUNK_SIZE),
        );
        const isLastChunk = offset + CHUNK_SIZE >= allData.length;
        const response = await this.transport.send(
          0x80,
          2,
          isLastChunk ? 0x80 : 0,
          networkId,
          chunk,
        );
        if (isLastChunk) {
          return Buffer.from(response.subarray(0, -2));
        }
      }
      throw new Error("Should not happen");
    },
  };
}

export class LedgerSigner extends Signer {
  client: {
    getVersion(): Promise<string>;
    sign(transactionData: Uint8Array, path: string | null): Promise<Uint8Array>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: any;
    getPublicKey(path: string): Promise<PublicKey>;
  } | null;
  store: IStore;

  constructor(store: IStore) {
    super();
    this.client = null;
    this.store = store;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getPublicKey() {
    if (!this.store.publicKey) {
      throw new Error("No public key");
    }
    return PublicKey.from(this.store.publicKey);
  }

  async signMessage(message: Uint8Array) {
    try {
      console.log("signMessage, createClient");
      this.client = await createClient();

      const signature = await this.client.sign(message, null);
      const publicKey = await this.getPublicKey();

      return {
        signature,
        publicKey,
      };
    } catch (error) {
      throw error;
    } finally {
      console.log("signMessage, close transport");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      await this.client?.transport?.close();
    }
  }

  createKey(): Promise<PublicKey> {
    throw new Error("Method not implemented.");
  }
}

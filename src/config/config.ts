import * as process from "process";
import { mainnet } from "~/config/mainnet";
import { testnet } from "~/config/testnet";

export type Config = {
  networkId: "mainnet" | "testnet";
  urls: {
    rpc: string;
    myNearWallet: string;
  };
  getUrl: {
    txDetails: (hash: string) => string;
    accountDetails: (accountId: string) => string;
    kitWallet: {
      keyAccounts: (publicKey: string) => string;
    }
  };
  accounts: {
    multisigFactory: string;
    lockupFactory: string;
    lockupFactoryFoundation: string;
  };
  helpers: {
    getKeyAccounts: (publicKey: string) => Promise<string[]>;
  }
};

const getConfig = () =>
  process.env.NEXT_PUBLIC_NETWORK_ID === "mainnet" ? mainnet : testnet;

export const config: Config = getConfig();

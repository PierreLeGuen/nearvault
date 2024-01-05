import { Config } from "./config";

const kitWallet = {
  getKeyAccounts: async (publicKey: string) => {
    try {
      const response = await fetch(
        `https://api.kitwallet.app/publicKey/${publicKey}/accounts`,
      );
      return await response.json();
    } catch (e) {
      console.log(e);
    }
  },
};

export const mainnet: Config = {
  networkId: "mainnet",
  urls: {
    rpc: "https://rpc.mainnet.near.org",
    myNearWallet: "https://app.mynearwallet.com",
  },
  getUrl: {
    txDetails: (hash) => `https://nearblocks.io/txns/${hash}`,
    accountDetails: (accountId) => `https://nearblocks.io/address/${accountId}`,
    kitWallet: {
      keyAccounts: (publicKey) =>
        `https://api.kitwallet.app/publicKey/${publicKey}/accounts`,
    },
  },
  accounts: {
    multisigFactory: "multisignature.near",
    lockupFactory: "lockup.near",
    lockupFactoryFoundation: "foundation.near",
  },
  helpers: {
    getKeyAccounts: kitWallet.getKeyAccounts,
  },
};

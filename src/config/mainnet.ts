import { Config } from './config';

export const mainnet: Config = {
  networkId: 'mainnet',
  urls: {
    rpc: "https://beta.rpc.mainnet.near.org",
    myNearWallet: 'https://app.mynearwallet.com',
  },
  getUrl: {
    txDetails: (hash) => `https://nearblocks.io/txns/${hash}`,
    accountDetails: (accountId) => `https://nearblocks.io/address/${accountId}`
  },
  accounts: {
    multisigFactory: "multisignature.near",
    lockupFactory: "lockup.near",
    lockupFactoryFoundation: "foundation.near"
  },
}
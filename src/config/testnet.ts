import { Config } from '~/config/config';

export const testnet: Config = {
  networkId: 'testnet',
  urls: {
    rpc: "https://rpc.testnet.near.org",
    myNearWallet: 'https://testnet.mynearwallet.com',
  },
  getUrl: {
    txDetails: (hash) => `https://testnet.nearblocks.io/txns/${hash}`,
    accountDetails: (accountId) => `https:///testnet.nearblocks.io/address/${accountId}`
  },
  accounts: {
    multisigFactory: "multisignature.testnet",
    lockupFactory: "lockup.devnet"
  }
}
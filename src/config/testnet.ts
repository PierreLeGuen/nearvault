import { Config } from "~/config/config";

const nearBlocks = {
  getKeyAccounts: async (publicKey: any) => {
    try {
      const response = await fetch(
        `https://api-testnet.nearblocks.io/v1/keys/${publicKey}`,
      );
      const json = await response.json();
      return json.keys.map(({ account_id }: any) => account_id);
    } catch (e) {
      console.log(e);
    }
  },
};

const kitWallet = {
  getKeyAccounts: async (publicKey: string) => {
    try {
      const response = await fetch(
        `https://testnet-api.kitwallet.app/publicKey/${publicKey}/accounts`,
      );
      return await response.json();
    } catch (e) {
      console.log(e);
    }
  },
};

export const testnet: Config = {
  networkId: "testnet",
  urls: {
    rpc: "https://rpc.testnet.near.org",
    // rpc: "https://endpoints.omniatech.io/v1/near/testnet/public",
    myNearWallet: "https://testnet.mynearwallet.com",
  },
  getUrl: {
    txDetails: (hash) => `https://testnet.nearblocks.io/txns/${hash}`,
    accountDetails: (accountId) =>
      `https://testnet.nearblocks.io/address/${accountId}`,
    kitWallet: {
      keyAccounts: (publicKey) =>
        `https://testnet-api.kitwallet.app/publicKey/${publicKey}/accounts`,
    },
  },
  accounts: {
    multisigFactory: "multisignature.testnet",
    lockupFactory: "lockup.devnet", // TODO create a real one
    lockupFactoryFoundation: "foundation.testnet", // TODO create a real one
  },
  helpers: {
    getKeyAccounts: kitWallet.getKeyAccounts,
  },
};

/*
"keys": [
        {
            "public_key": "ed25519:F2RJPxru3LrZyfDr8YVidkofo5Mk33eU5NRV9PF6FcWe",
            "account_id": "multisig.pierre-dev.near",
            "permission_kind": "FUNCTION_CALL",
            "created": {
                "transaction_hash": "4DJtsU3jgkfsjuWDB5SWh8cL6FpjRbspRt2LfvRV3MHP",
                "block_timestamp": 1702379621468024800
            },
            "deleted": {
                "transaction_hash": null,
                "block_timestamp": null
            }
        },
 */

import { JsonRpcProvider } from "near-api-js/lib/providers";
import { PublicKey } from "near-api-js/lib/utils";
import { config } from "~/config/config";
import { fetchJson } from "~/store-easy-peasy/helpers/fetchJson";

type Key = {
  public_key: string;
  account_id: string;
  permission_kind: "FULL_ACCESS" | "FUNCTION_CALL";
  created: {
    transaction_hash: string;
    block_timestamp: number;
  };
  deleted: {
    transaction_hash: string | null;
    block_timestamp: number | null;
  };
};

type KeysResponse = {
  keys: Key[];
};

type AccesKeyResponse = {
  block_hash: string;
  block_height: number;
  nonce: number;
};

export const getAccessKey = async ({
  rpcUrl,
  senderId,
  signerPublicKey,
}: {
  rpcUrl: string;
  senderId: string;
  signerPublicKey: PublicKey;
}) => {
  console.log("getAccessKey", { rpcUrl, senderId, publicKey: signerPublicKey });

  const provider = new JsonRpcProvider({ url: rpcUrl });
  console.log(signerPublicKey.toString());

  const args = {
    request_type: "view_access_key",
    finality: "final",
    account_id: senderId,
    public_key: signerPublicKey.toString(),
  };
  console.log("args", args);

  const ak: AccesKeyResponse = await provider.query(args);
  console.log(ak);

  return ak;
};

export const getLatestBlockHash = async (rpcUrl: string) => {
  console.log("getAccessKey", { rpcUrl });

  const provider = new JsonRpcProvider({ url: rpcUrl });

  const b = await provider.block({ finality: "final" });

  return b;
};

export const getAccountsForPublicKey = async (
  publicKey: string,
): Promise<string[]> => {
  const accountsWithSameKey: KeysResponse = await fetchJson(
    config.urls.nearBlocksApi.getAccountsUrl(publicKey),
  );

  const accounts: string[] = await (
    await fetch(config.urls.kitWallet.keyAccounts(publicKey))
  ).json();

  // merge accounts from NEAR Blocks API and Kit Wallet API
  const a: string[] = accountsWithSameKey.keys
    .filter((k) => k.deleted.block_timestamp == null)
    .map((a) => a.account_id);

  const accountsWithSameKeyAndKitWallet = Array.from(
    new Set([...a, ...accounts]),
  );

  return accountsWithSameKeyAndKitWallet;
};

export const filterMultisig = async (accountIds: string[]) => {
  const provider = new JsonRpcProvider({ url: config.urls.rpc });

  const validAccIds = await Promise.all(
    accountIds
      .map(async (accountId) => {
        try {
          await provider.query({
            request_type: "call_function",
            finality: "final",
            account_id: accountId,
            method_name: "list_request_ids",
            args_base64: "e30=",
          });
          return accountId;
        } catch (e) {
          console.log("not multisig", e);
        }
      })
      .filter(Boolean),
  );

  return validAccIds;
};

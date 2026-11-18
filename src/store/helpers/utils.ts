import { type PublicKey } from "near-api-js";
import { config } from "~/config/config";
import { NearBlocksApi } from "~/config/nearBlocksApiNew";
import { NearRpcProvider } from "~/lib/near/compat";

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
  const provider = new NearRpcProvider({ url: rpcUrl });

  const args = {
    request_type: "view_access_key",
    finality: "final",
    account_id: senderId,
    public_key: signerPublicKey.toString(),
  };
  const ak: AccesKeyResponse = await provider.query(args);

  return ak;
};

export const getLatestBlockHash = async (rpcUrl: string) => {
  const provider = new NearRpcProvider({ url: rpcUrl });

  const b = await provider.block({ finality: "final" });

  return b;
};

export const getAccountsForPublicKey = async (
  publicKey: string,
): Promise<string[]> => {
  const accounts = await config.urls.fastNearApi.getAccountsForKey(publicKey);
  const accountsNb = await NearBlocksApi.getInstance(
    config.urls.nearBlocksApiUrl,
  ).getAccountsForPublicKey(publicKey);

  const uniqueAccounts = new Set([
    ...accounts.account_ids,
    ...accountsNb.data.map((k) => k.account_id),
  ]);

  return [...uniqueAccounts];
};

export const filterMultisig = async (accountIds: string[], rpcUrl: string) => {
  const provider = new NearRpcProvider({ url: rpcUrl });

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
          console.log("not multisig", (e as Error)?.name);
        }
      })
      .filter(Boolean),
  );

  return validAccIds as string[];
};

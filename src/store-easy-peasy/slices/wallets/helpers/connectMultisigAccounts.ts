import { JsonRpcProvider } from "near-api-js/lib/providers";
import { config } from "~/config/config";
import { fetchJson } from "~/store-easy-peasy/helpers/fetchJson";
import type { AccountId, PublicKey } from "~/store-easy-peasy/types";
import type { NavigateFn } from "~/store-easy-peasy/slices/wallets/slices/modal/types";
import type { AddAccountsFn } from "~/store-easy-peasy/slices/accounts/types";

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

const isMultisig = async (accountId: string, provider: JsonRpcProvider) =>
  await provider.query({
    request_type: "call_function",
    finality: "final",
    account_id: accountId,
    method_name: "list_request_ids",
    args_base64: "e30=",
  });

const getKeyMultisigAccounts = async (
  publicKey: PublicKey,
  wallet: string,
  rpcUrl: string,
) => {
  const provider = new JsonRpcProvider({ url: rpcUrl });

  const accountsWithSameKey: KeysResponse = await fetchJson(
    config.urls.nearBlocksApi.getAccountsUrl(publicKey),
  );

  const accounts: string[] = await (
    await fetch(config.urls.kitWallet.keyAccounts(publicKey))
  ).json();

  // merge accounts from NEAR Blocks API and Kit Wallet API
  const a: string[] = accountsWithSameKey.keys.map((a) => a.account_id);

  const accountsWithSameKeyAndKitWallet = Array.from(
    new Set([...a, ...accounts]),
  );

  const results = await Promise.allSettled(
    accountsWithSameKeyAndKitWallet.map((account) =>
      isMultisig(account, provider),
    ),
  );

  return results
    .map((promise, index) => ({
      status: promise.status,
      accountId: accountsWithSameKeyAndKitWallet[index],
    }))
    .filter((promise) => promise.status === "fulfilled")
    .map(({ accountId }) => ({
      accountId,
      publicKey,
      wallet,
    }));
};

type ConnectMultisigAccountsArgs = {
  publicKey: PublicKey;
  navigate: NavigateFn;
  rpcUrl: string;
  addAccounts: AddAccountsFn;
  wallet: string;
};

export const connectMultisigAccounts = async ({
  publicKey,
  navigate,
  rpcUrl,
  addAccounts,
  wallet,
}: ConnectMultisigAccountsArgs) => {
  navigate("/multisig-accounts/progress");

  try {
    const multisigAccounts = await getKeyMultisigAccounts(
      publicKey,
      wallet,
      rpcUrl,
    );

    if (multisigAccounts.length === 0) {
      navigate("/multisig-accounts/no-accounts");
      return;
    }

    navigate({
      route: "/multisig-accounts/success",
      routeParams: { accounts: multisigAccounts },
    });
    addAccounts(multisigAccounts);
  } catch (error) {
    console.error(error);
    navigate({
      route: "/multisig-accounts/error",
      routeParams: { error },
    });
  }
};

import { JsonRpcProvider } from "near-api-js/lib/providers";
import { config } from "~/config/config";
import { fetchJson } from "~/store-easy-peasy/helpers/fetchJson";
import type { AccountId, PublicKey } from "~/store-easy-peasy/types";

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

  const allAccountsWithSameKey: AccountId[] = await fetchJson(
    config.urls.kitWallet.keyAccounts(publicKey),
  );

  const results = await Promise.allSettled(
    allAccountsWithSameKey.map((accountId) => isMultisig(accountId, provider)),
  );

  return results
    .map((promise, index) => ({
      status: promise.status,
      accountId: allAccountsWithSameKey[index],
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
  navigate: any;
  rpcUrl: string;
  addAccounts: any;
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

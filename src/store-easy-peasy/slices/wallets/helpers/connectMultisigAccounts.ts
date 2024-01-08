import { JsonRpcProvider } from "near-api-js/lib/providers";
import { config } from "~/config/config";
import { fetchJson } from "~/store-easy-peasy/helpers/fetchJson";

const isMultisig = async (accountId: any, provider: any) =>
  await provider.query({
    request_type: "call_function",
    finality: "final",
    account_id: accountId,
    method_name: "list_request_ids",
    args_base64: "e30=",
  });

const getKeyMultisigAccounts = async (
  publicKey: any,
  wallet: string,
  rpcUrl: any,
) => {
  const provider = new JsonRpcProvider({ url: rpcUrl });

  const allAccountsWithSameKey = await fetchJson(
    config.getUrl.kitWallet.keyAccounts(publicKey),
  );

  const results = await Promise.allSettled(
    allAccountsWithSameKey.map((accountId: any) =>
      isMultisig(accountId, provider),
    ),
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

export const connectMultisigAccounts = async ({
  publicKey,
  navigate,
  rpcUrl,
  addAccounts,
  wallet,
}) => {
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

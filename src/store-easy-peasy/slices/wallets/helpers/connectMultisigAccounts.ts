import { JsonRpcProvider } from "near-api-js/lib/providers";

const isMultisig = async (accountId: any, provider: any) =>
  await provider.query({
    request_type: "call_function",
    finality: "final",
    account_id: accountId,
    method_name: "list_request_ids",
    args_base64: "e30=",
  });

const getAllAccountsWithSameKey1 = async (publicKey: any) =>
  await fetch(`https://api.kitwallet.app/publicKey/${publicKey}/accounts`, {
    headers: { "X-requestor": "near" },
  }).then((r) => r.json());

// eslint-disable-next-line
const getAllAccountsWithSameKey2 = async (publicKey: any) => {
  try {
    const res = await fetch(
      `https://api.nearblocks.io/v1/keys/${publicKey}`,
    ).then((r) => r.json());
    const a = res.keys.map(({ account_id }: any) => account_id);
    console.log(a);
    return a;
  } catch (e) {
    console.log(e);
  }
};

const getMultisigAccounts = async (
  publicKey: any,
  wallet: string,
  rpcUrl: any,
) => {
  const provider = new JsonRpcProvider({ url: rpcUrl });

  const allAccountsWithSameKey = await getAllAccountsWithSameKey1(publicKey);
  console.log(allAccountsWithSameKey);

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
    const multisigAccounts = await getMultisigAccounts(
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

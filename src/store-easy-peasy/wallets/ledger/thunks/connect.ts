import { thunk } from "easy-peasy";
import { LedgerClient } from "../helpers/LedgerClient";
import { JsonRpcProvider } from "near-api-js/lib/providers";

const INDEXER_SERVICE_URL = "https://api.kitwallet.app";

const getAllAccountsWithKey = async (publicKey: any) =>
  await fetch(`${INDEXER_SERVICE_URL}/publicKey/${publicKey}/accounts`, {
    headers: { "X-requestor": "near" },
  }).then((r) => r.json());

const isMultisig = async (accountId: any, provider: any) =>
  await provider.query({
    request_type: "call_function",
    finality: "final",
    account_id: accountId,
    method_name: "list_request_ids",
    args_base64: "e30=",
  });

const getMultisigAccounts = async (publicKey: any, provider: any) => {
  const allAccounts = await getAllAccountsWithKey(publicKey);
  console.log(allAccounts);

  const result = await Promise.allSettled(
    allAccounts.map((accountId: any) => isMultisig(accountId, provider)),
  );

  return result
    .map((v, index) => ({
      status: v.status,
      accountId: allAccounts[index],
      publicKey,
      wallet: "ledger",
      addedBy: "auto",
    }))
    .filter((v) => v.status === "fulfilled")
    .map((v) => ({
      accountId: v.accountId,
      publicKey: v.publicKey,
      wallet: v.wallet,
      addedBy: v.addedBy,
    }));
};

export const connect = thunk(async (_, __, { getStoreActions, getState }) => {
  const slice: any = getState();
  const actions: any = getStoreActions();
  const navigate = actions.walletsConnector.modal.navigate;

  navigate("/ledger/connect/progress");

  const ledger = new LedgerClient();
  let publicKey = null;

  try {
    await ledger.connect();
    publicKey = await ledger.getPublicKey();
    console.log("ledger pk = ", publicKey.toString());
  } catch (e) {
    console.log(e);
    navigate({ route: "/ledger/connect/error", routeParams: { error: e } });
  } finally {
    ledger.isConnected() && (await ledger.disconnect());
  }

  if (!publicKey) return;

  navigate("/ledger/multisig-accounts/progress");

  try {
    const provider = new JsonRpcProvider({ url: slice.rpcUrl });
    const accounts = await getMultisigAccounts(publicKey.toString(), provider);

    if (accounts.length > 0) {
      navigate({
        route: "/ledger/multisig-accounts/success",
        routeParams: { accounts },
      });
      actions.addAccount({ accounts }); // TODO Fix bug with ledger import when we have MNW
    }
  } catch (e) {
    console.log(e);
    navigate({
      route: "/ledger/multisig-accounts/error",
      routeParams: { error: e },
    });
  }
});

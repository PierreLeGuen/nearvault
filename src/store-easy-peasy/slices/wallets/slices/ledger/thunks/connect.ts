import { thunk } from "easy-peasy";
import { LedgerClient } from "../helpers/LedgerClient";
import { connectMultisigAccounts } from "~/store-easy-peasy/slices/wallets/helpers/connectMultisigAccounts";

export const connect = thunk(async (_, __, { getStoreActions, getState }) => {
  const slice: any = getState();
  const actions: any = getStoreActions();
  const navigate = actions.wallets.modal.navigate;

  navigate("/ledger/connect/progress");

  const ledger = new LedgerClient();
  let publicKey = null;

  try {
    await ledger.connect();
    publicKey = await ledger.getPublicKey();
  } catch (e) {
    console.log(e);
    navigate({ route: "/ledger/connect/error", routeParams: { error: e } });
  } finally {
    ledger.isConnected() && (await ledger.disconnect());
  }

  if (!publicKey) return;

  await connectMultisigAccounts({
    publicKey,
    navigate,
    rpcUrl: slice.rpcUrl,
    addAccounts: actions.accounts.addAccounts,
    wallet: "ledger",
  });
});

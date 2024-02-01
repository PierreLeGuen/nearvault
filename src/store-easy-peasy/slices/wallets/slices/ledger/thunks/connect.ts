import { thunk } from "easy-peasy";
import { LedgerClient } from "../helpers/LedgerClient";
import { connectMultisigAccounts } from "~/store-easy-peasy/slices/wallets/helpers/connectMultisigAccounts";
import type { Connect } from "~/store-easy-peasy/slices/wallets/slices/ledger/types";

export const connect: Connect = thunk(
  async (_, __, { getStoreActions, getState }) => {
    const slice = getState();
    const actions = getStoreActions();
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

    console.log('connect', { publicKey });
    console.log(publicKey.toString());
    

    if (!publicKey) return;

    await connectMultisigAccounts({
      publicKey,
      navigate,
      rpcUrl: slice.rpcUrl,
      addAccounts: actions.accounts.addAccounts,
      wallet: "ledger",
    });
  },
);

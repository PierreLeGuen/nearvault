import { thunk } from "easy-peasy";
import { connectMultisigAccounts } from "~/store-easy-peasy/slices/wallets/helpers/connectMultisigAccounts";

export const completeConnection = thunk(
  async (_, payload: any, { getStoreActions, getState }) => {
    const { publicKey } = payload;
    const slice: any = getState();
    const actions: any = getStoreActions();
    const navigate = actions.wallets.modal.navigate;

    actions.wallets.modal.open();

    await connectMultisigAccounts({
      publicKey,
      navigate,
      rpcUrl: slice.rpcUrl,
      addAccounts: actions.accounts.addAccounts,
      wallet: "myNearWallet",
    });
  },
);

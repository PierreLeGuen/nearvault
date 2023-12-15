import { thunk } from "easy-peasy";
import { signTx } from "~/store-easy-peasy/slices/wallets/slices/ledger/thunks/signAndSendTx/signTx";
import { sendTx } from "~/store-easy-peasy/slices/wallets/slices/ledger/thunks/signAndSendTx/sendTx";

export const signAndSendTx = thunk(
  async (_, payload: any, { getState, getStoreActions }) => {
    const { transaction } = payload;
    const slice: any = getState();
    const actions: any = getStoreActions();

    const navigate = actions.wallets.modal.navigate;

    actions.wallets.modal.open();

    const retrySignTxFn = () =>
      actions.wallets.ledger.signAndSendTx({ transaction });

    const signedTx = await signTx(transaction, navigate, retrySignTxFn);
    if (!signedTx) return;

    await sendTx(signedTx, slice.rpcUrl, navigate);
  },
);

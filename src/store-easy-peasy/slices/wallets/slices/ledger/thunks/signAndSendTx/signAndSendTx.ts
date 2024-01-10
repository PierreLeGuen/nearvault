import { thunk } from "easy-peasy";
import { signTx } from "~/store-easy-peasy/slices/wallets/slices/ledger/thunks/signAndSendTx/signTx";
import { sendTx } from "~/store-easy-peasy/slices/wallets/slices/ledger/thunks/signAndSendTx/sendTx";
import type { SignAndSendTx } from '~/store-easy-peasy/slices/wallets/slices/ledger/types';

export const signAndSendTx: SignAndSendTx = thunk(
  async (_, payload, { getState, getStoreActions }) => {
    const { transaction } = payload;
    const slice = getState();
    const actions = getStoreActions();

    const navigate = actions.wallets.modal.navigate;

    actions.wallets.modal.open();

    const retrySignTxFn = () =>
      actions.wallets.ledger.signAndSendTx({ transaction });

    const signedTx = await signTx(transaction, navigate, retrySignTxFn);
    if (!signedTx) return;

    await sendTx(signedTx, slice.rpcUrl, navigate);
  },
);

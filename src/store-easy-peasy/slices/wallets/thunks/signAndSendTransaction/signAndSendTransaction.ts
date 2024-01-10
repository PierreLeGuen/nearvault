import { thunk } from "easy-peasy";
import { createTx } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/createTx";
import type { SignAndSendTransaction } from '~/store-easy-peasy/slices/wallets/types';

export const signAndSendTransaction: SignAndSendTransaction = thunk(
  async (_, payload, { getStoreState, getStoreActions }) => {
    const { senderId, receiverId, action, actions } = payload;
    const state = getStoreState();
    const storeActions = getStoreActions();

    const { publicKey, wallet } = state.accounts.map[senderId];
    const { rpcUrl } = state.wallets[wallet];
    const signAndSendTx = storeActions.wallets[wallet].signAndSendTx;

    const transaction = await createTx({
      rpcUrl,
      senderId,
      publicKey,
      receiverId,
      action,
      actions,
    });

    await signAndSendTx({ transaction });
  },
);

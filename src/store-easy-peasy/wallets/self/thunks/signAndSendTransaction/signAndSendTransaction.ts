import { thunk } from "easy-peasy";
import { createTx } from "~/store-easy-peasy/wallets/self/thunks/signAndSendTransaction/createTx";

const getAccount = (accounts: any, accountId: any) =>
  accounts.find((account: any) => account.accountId === accountId);

export const signAndSendTransaction = thunk(
  async (_, payload: any, { getStoreState, getStoreActions }) => {
    const { senderId, receiverId, action, actions } = payload;
    const state: any = getStoreState();
    const storeActions: any = getStoreActions();

    const { publicKey, wallet } = getAccount(state.accounts, senderId);

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

    console.log('wallet.signAndSendTransaction', transaction);
    await signAndSendTx({ transaction });
  },
);

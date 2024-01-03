import { thunk } from "easy-peasy";
import { createTx } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/createTx";

type Payload = {
  senderId: string;
  receiverId: string;
  action: object;
  actions: object[];
};

export const signAndSendTransaction = thunk(
  async (_, payload: any, { getStoreState, getStoreActions }) => {
    const { senderId, receiverId, action, actions }: Payload = payload;
    const state: any = getStoreState();
    const storeActions: any = getStoreActions();

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

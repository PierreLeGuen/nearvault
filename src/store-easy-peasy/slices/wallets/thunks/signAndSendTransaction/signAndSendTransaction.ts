import { thunk } from "easy-peasy";
import { PublicKey } from "near-api-js/lib/utils";
import { createTx } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/createTx";
import type { SignAndSendTransaction } from '~/store-easy-peasy/slices/wallets/types';

export const signAndSendTransaction: SignAndSendTransaction = thunk(
  async (_, payload, { getStoreState, getStoreActions }) => {
    const { senderId, receiverId, action, actions } = payload;
    const state = getStoreState();
    const storeActions = getStoreActions();

    console.log('signAndSendTransaction', { senderId, receiverId, action, actions });
    
    const { publicKey, wallet } = state.accounts.map[senderId];
    console.log('STATE: signAndSendTransaction', { publicKey, wallet });
    
    const { rpcUrl } = state.wallets[wallet];
    const signAndSendTx = storeActions.wallets[wallet].signAndSendTx;

    console.log('signAndSendTransaction', { publicKey, wallet, rpcUrl });

    const transaction = await createTx({
      rpcUrl,
      senderId,
      publicKey: PublicKey.from(publicKey),
      receiverId,
      action,
      actions,
    });
        
    console.log('signAndSendTransaction', { transaction });
    
    await signAndSendTx({ transaction });
  },
);

import { thunk } from "easy-peasy";
import { toast } from "react-toastify";
import type { CanSignTx } from '~/store-easy-peasy/slices/accounts/types';

export const canSignTx: CanSignTx = thunk(
  (actions, accountId, { getState }) => {
    const slice = getState();

    const isConnected = Boolean(slice.map[accountId]);

    isConnected
      ? actions.selectAccount(accountId)
      : toast.error(
          `You need to connect ${accountId} before performing this action`,
        );

    return isConnected;
  },
);

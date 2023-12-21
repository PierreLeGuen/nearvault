import { thunk } from "easy-peasy";
import { toast } from "react-toastify";

export const canSignTx = thunk(
  (actions: any, accountId: string, { getState }) => {
    const slice: any = getState();

    const isConnected = Boolean(slice.map[accountId]);

    isConnected
      ? actions.selectAccount(accountId)
      : toast.error(
          `You need to connect ${accountId} before performing this action`,
        );

    return isConnected;
  },
);

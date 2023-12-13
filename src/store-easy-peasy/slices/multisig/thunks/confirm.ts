import { thunk } from "easy-peasy";

export const confirm = thunk(async (_, payload: any, { getStoreActions }) => {
  const { multisigAccountId, requestId } = payload;
  const actions: any = getStoreActions();

  await actions.wallets.signAndSendTransaction({
    senderId: multisigAccountId,
    receiverId: multisigAccountId,
    action: {
      type: "FunctionCall",
      method: "confirm",
      args: {
        request_id: requestId,
      },
      tGas: 25,
    },
  });
});

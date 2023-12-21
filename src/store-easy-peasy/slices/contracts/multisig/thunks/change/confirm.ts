import { thunk } from "easy-peasy";

export const confirm = thunk(async (_, payload: any, { getStoreActions }) => {
  const { contractId, requestId } = payload;
  const actions: any = getStoreActions();

  await actions.wallets.signAndSendTransaction({
    senderId: contractId,
    receiverId: contractId,
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

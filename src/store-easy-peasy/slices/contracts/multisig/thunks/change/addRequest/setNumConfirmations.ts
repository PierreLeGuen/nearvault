import { thunk } from "easy-peasy";

export type Payload = {
  contractId: string;
  numConfirmations: string;
};

export const setNumConfirmations = thunk(
  async (_, payload: Payload, { getStoreActions }) => {
    const { contractId, numConfirmations } = payload;
    const actions: any = getStoreActions();

    await actions.wallets.signAndSendTransaction({
      senderId: contractId,
      receiverId: contractId,
      action: {
        type: "FunctionCall",
        method: "add_request",
        args: {
          request: {
            receiver_id: contractId,
            actions: [
              {
                type: "SetNumConfirmations",
                num_confirmations: numConfirmations,
              },
            ],
          },
        },
        tGas: 5,
      },
    });
  },
);

import { thunk } from "easy-peasy";

type Payload = {
  contractId: string;
  publicKey: string;
}

export const addKey = thunk(async (_, payload: Payload, { getStoreActions }) => {
  const { contractId, publicKey } = payload;
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
              type: "AddKey",
              public_key: publicKey,
              permission: {
                receiver_id: contractId,
                allowance: null,
                method_names: [
                  "add_request",
                  "add_request_and_confirm",
                  "confirm",
                  "delete_request",
                ],
              },
            },
          ],
        },
      },
      tGas: 5,
    },
  });
});

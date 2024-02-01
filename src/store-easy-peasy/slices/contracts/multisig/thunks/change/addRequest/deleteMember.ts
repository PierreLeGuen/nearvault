import { thunk } from "easy-peasy";
import { PublicKey } from "near-api-js/lib/utils";

type Payload = {
  contractId: string;
  publicKey: PublicKey;
}

export const deleteMember = thunk(async (_, payload: Payload, { getStoreActions }) => {
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
              type: "DeleteMember",
              member: {
                public_key: publicKey,
              },
            },
          ],
        },
      },
      tGas: 6,
    },
  });
});

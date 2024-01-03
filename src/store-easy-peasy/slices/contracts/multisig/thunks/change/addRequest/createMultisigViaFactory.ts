import { thunk } from "easy-peasy";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { toGas } from "~/store-easy-peasy/helpers/toGas";
import { toBase64Json } from "~/store-easy-peasy/helpers/toBase64Json";
import { config } from '~/config/config';

type Payload = {
  contractId: string;
  publicKey: string;
};

export const createMultisigViaFactory = thunk(
  async (_, payload: Payload, { getStoreActions }) => {
    const {
      contractId,
      newMultisigAccountId,
      members,
      numConfirmations,
      deposit,
    }: any = payload;
    const actions: any = getStoreActions();

    await actions.wallets.signAndSendTransaction({
      senderId: contractId,
      receiverId: contractId,
      action: {
        type: "FunctionCall",
        method: "add_request",
        args: {
          request: {
            receiver_id: config.accounts.multisigFactory,
            actions: [
              {
                type: "FunctionCall",
                method_name: "create",
                args: toBase64Json({
                  name: newMultisigAccountId,
                  members,
                  num_confirmations: numConfirmations,
                }),
                deposit: parseNearAmount(deposit),
                gas: toGas(75).toString(),
              },
            ],
          },
        },
        tGas: 10,
      },
    });
  },
);

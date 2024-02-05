import { useMutation } from "@tanstack/react-query";
import { BN } from "bn.js";
import { transactions } from "near-api-js";
import { toGas } from "~/store-easy-peasy/helpers/toGas";
import { useWalletTerminator } from "~/store/slices/wallet-selector";

type AddKey = {
  key: string;
  accountId: string;
};

export const useAddKey = () => {
  const wsStore = useWalletTerminator();
  return useMutation({
    mutationFn: async ({ key, accountId }: AddKey) => {
      console.log("useAddKey", { key, accountId });

      const actions = transactions.functionCall(
        "add_request",
        {
          request: {
            receiver_id: accountId,
            actions: [
              {
                type: "AddKey",
                public_key: key,
                permission: {
                  receiver_id: accountId,
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
        new BN("30000000000000"),
        new BN("0"),
      );

      console.log("useAddKey", { actions });

      await wsStore.signAndSendTransaction({
        senderId: accountId,
        receiverId: accountId,
        actions: [actions],
      });
    },
  });
};

import { useMutation } from "@tanstack/react-query";
import BN from "bn.js";
import { transactions } from "near-api-js";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { functionCallAction } from "./lockup";
import { addMultisigRequestAction } from "./manage";
import { TGas } from "./staking";

export const useCheckTransferVote = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async (params: {
      lockupAddress: string;
      fundingAccId: string;
    }) => {
      const checkTransfersVote = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.lockupAddress, [
          functionCallAction(
            "check_transfers_vote",
            {},
            "0",
            (150 * TGas).toString(),
          ),
        ]),
        new BN(200 * TGas),
        new BN("0"),
      );
      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [checkTransfersVote],
      });
    },
  });
};

import { useMutation } from "@tanstack/react-query";
import BN from "bn.js";
import { transactions } from "near-api-js";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { functionCallAction, transferAction } from "./lockup";
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

export const useStorageDeposit = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async (params: {
      fundingAccId: string;
      tokenAddress: string;
      receiverAddress: string;
    }) => {
      const storageDepositRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.tokenAddress, [
          functionCallAction(
            "storage_deposit",
            {
              account_id: params.receiverAddress,
              registration_only: false,
            },
            parseNearAmount("0.005"),
            (50 * TGas).toString(),
          ),
        ]),
        new BN(100 * TGas),
        new BN("0"),
      );
      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [storageDepositRequest],
      });
    },
  });
};

export const useFtTransfer = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async (params: {
      fundingAccId: string;
      tokenAddress: string;
      receiverAddress: string;
      indivAmount: string;
    }) => {
      const ftTransferRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.tokenAddress, [
          functionCallAction(
            "ft_transfer",
            {
              receiver_id: params.receiverAddress,
              amount: params.indivAmount,
            },
            "1",
            (100 * TGas).toString(),
          ),
        ]),
        new BN(150 * TGas),
        new BN("0"),
      );
      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [ftTransferRequest],
      });
    },
  });
};

export const useLockupTransfer = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async (params: {
      fundingAccId: string;
      lockupAddress: string;
      receiverAddress: string;
      indivAmount: string;
    }) => {
      const lockupTransferRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.lockupAddress, [
          functionCallAction(
            "transfer",
            {
              receiver_id: params.receiverAddress,
              amount: params.indivAmount,
            },
            "0",
            (125 * TGas).toString(),
          ),
        ]),
        new BN(150 * TGas),
        new BN("0"),
      );
      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [lockupTransferRequest],
      });
    },
  });
};

export const useNearTransfer = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async (params: {
      fundingAccId: string;
      receiverAddress: string;
      indivAmount: string;
    }) => {
      const nearTransferRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.receiverAddress, [
          transferAction(params.indivAmount),
        ]),
        new BN(150 * TGas),
        new BN("0"),
      );
      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [nearTransferRequest],
      });
    },
  });
};

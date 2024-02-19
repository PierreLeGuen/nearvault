import { useMutation } from "@tanstack/react-query";
import { BN } from "bn.js";
import { transactions } from "near-api-js";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { TGas } from "./staking";

type AddKey = {
  publicKey: string;
  accountId: string;
  methodNames?: string[];
};

const addKeyAction = (
  publicKey: string,
  receiverId: string,
  methodNames: string[],
  allowance?: string,
) => {
  return {
    type: "AddKey",
    public_key: publicKey,
    permission: {
      receiver_id: receiverId,
      allowance: allowance ? new BN(allowance) : null,
      method_names: methodNames,
    },
  };
};

export const addMultisigRequestAction = (
  receiverId: string,
  actions: unknown[], // TODO: type this
) => {
  return {
    request: {
      receiver_id: receiverId,
      actions: actions,
    },
  };
};

export const useAddKey = () => {
  const wsStore = useWalletTerminator();
  return useMutation({
    mutationFn: async ({ publicKey, accountId, methodNames }: AddKey) => {
      console.log("useAddKey", { publicKey, accountId, methodNames });

      const action = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(accountId, [
          addKeyAction(
            publicKey,
            accountId,
            methodNames
              ? methodNames
              : [
                  "add_request",
                  "add_request_and_confirm",
                  "confirm",
                  "delete_request",
                ],
          ),
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      console.log("useAddKey", { actions: action });

      await wsStore.signAndSendTransaction({
        senderId: accountId,
        receiverId: accountId,
        actions: [action],
      });
    },
  });
};

type DeleteKey = {
  publicKey: string;
  accountId: string;
};

export const useDeleteKey = () => {
  const wsStore = useWalletTerminator();
  return useMutation({
    mutationFn: async ({ publicKey, accountId }: DeleteKey) => {
      console.log("useDeleteKey", { publicKey, accountId });

      const action = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(accountId, [
          {
            type: "DeleteKey",
            public_key: publicKey,
          },
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      console.log("useDeleteKey", { actions: action });

      await wsStore.signAndSendTransaction({
        senderId: accountId,
        receiverId: accountId,
        actions: [action],
      });
    },
  });
};

type NumConfirmations = {
  accountId: string;
  numConfirmations: number;
};

export const useSetNumConfirmations = () => {
  const wsStore = useWalletTerminator();
  return useMutation({
    mutationFn: async ({ accountId, numConfirmations }: NumConfirmations) => {
      console.log("useSetNumConfirmations", {
        accountId,
        numConfirmations,
      });

      const action = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(accountId, [
          {
            type: "SetNumConfirmations",
            num_confirmations: numConfirmations,
          },
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      console.log("useSetNumConfirmations", { actions: action });

      await wsStore.signAndSendTransaction({
        senderId: accountId,
        receiverId: accountId,
        actions: [action],
      });
    },
  });
};

type ConfirmRequest = {
  accountId: string;
  requestId: number;
};

export const useConfirmRequest = () => {
  const wsStore = useWalletTerminator();
  return useMutation({
    mutationFn: async ({ accountId, requestId }: ConfirmRequest) => {
      console.log("useConfirmRequest", { accountId, requestId });

      const action = transactions.functionCall(
        "confirm",
        {
          request_id: requestId,
        },
        new BN(300 * TGas),
        new BN("0"),
      );

      console.log("useConfirmRequest", { actions: action });

      await wsStore.signAndSendTransaction({
        senderId: accountId,
        receiverId: accountId,
        actions: [action],
      });
    },
  });
};

type DeleteRequest = {
  accountId: string;
  requestId: number;
};

export const useDeleteRequest = () => {
  const wsStore = useWalletTerminator();
  return useMutation({
    mutationFn: async ({ accountId, requestId }: DeleteRequest) => {
      console.log("useDeleteRequest", { accountId, requestId });

      const action = transactions.functionCall(
        "delete_request",
        {
          request_id: requestId,
        },
        new BN(300 * TGas),
        new BN("0"),
      );

      console.log("useDeleteRequest", { actions: action });

      await wsStore.signAndSendTransaction({
        senderId: accountId,
        receiverId: accountId,
        actions: [action],
      });
    },
  });
};

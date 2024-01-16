import { useMutation, useQuery } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useState } from "react";
import { z } from "zod";
import { config } from "~/config/config";
import { useWalletSelector } from "~/contexts/WalletSelectorContext";
import usePersistingStore from "~/store/useStore";

export const multisigFactoryFormSchema = z.object({
  fundingAccountId: z.string(),
  accountId: z.string(),
  threshold: z.string().refine((value) => {
    const threshold = Number(value);
    return threshold > 0; // TODO: && threshold <= maxThreshold
  }),
  owners: z.array(z.string()).transform((value) => {
    return value.filter(Boolean);
  }),
});

export function useCreateMultisigWithFactory() {
  const { selector } = useWalletSelector();

  return useMutation({
    mutationFn: async (data: z.infer<typeof multisigFactoryFormSchema>) => {
      const factory = config.accounts.multisigFactory;
      const wallet = await selector.wallet();
      const threshold = new Number(data.threshold);

      await wallet.signAndSendTransaction({
        receiverId: factory,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "create",
              args: {
                name: data.accountId,
                members: data.owners,
                num_confirmations: threshold,
              },
              gas: "300000000000000",
              deposit: parseNearAmount("5"),
            },
          },
        ],
      });
      return data.accountId + "." + config.accounts.multisigFactory;
    },
    onError: () => {
      throw new Error("Multisig wallet not created");
    },
  });
}

export const useGetTransactionStatus = () => {
  const { newNearConnection } = usePersistingStore();
  const [transactionHashes, setTransactionHashes] =
    useState<string[]>(undefined);

  const transactionStatusQuery = useQuery({
    queryKey: ["isTransactionComplete", transactionHashes],
    queryFn: async () => {
      const transactions = await Promise.all(
        transactionHashes.map(async (transactionHash) => {
          const near = await newNearConnection();
          const txStatus = await near.connection.provider.txStatus(
            transactionHash,
            config.accounts.multisigFactory,
          );
          return txStatus;
        }),
      );

      return transactions;
    },
    enabled: !!transactionHashes,
  });

  return {
    setTransactionHashes,
    transactionStatusQuery,
  };
};

export const useIsMultisigWalletSuccessfullyCreated = () => {
  const { setTransactionHashes, transactionStatusQuery } =
    useGetTransactionStatus();

  const query = useQuery({
    queryKey: ["isMultisigWalletSuccessfullyCreated", transactionStatusQuery],
    queryFn: async () => {
      for (const tx of transactionStatusQuery.data) {
        const matchingReceipt = tx.receipts_outcome.find((receipt) =>
          receipt.outcome.executor_id.includes(
            "." + config.accounts.multisigFactory,
          ),
        );
        if (matchingReceipt) {
          return matchingReceipt.outcome.executor_id; // Return the matching executor_id
        }
      }
      throw new Error("Multisig wallet not created");
    },
    enabled: !!transactionStatusQuery.data,
  });

  return { setTransactionHashes, query };
};

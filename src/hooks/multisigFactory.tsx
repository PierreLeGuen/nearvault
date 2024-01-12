import { useMutation } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { z } from "zod";
import { config } from "~/config/config";
import { useWalletSelector } from "~/contexts/WalletSelectorContext";

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
      console.error("failed to create multisig");
      debugger;
    },
  });
}

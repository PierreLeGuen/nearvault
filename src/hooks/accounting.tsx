import { useMutation } from "@tanstack/react-query";
import { getTransactionsReport } from "~/lib/client";

export function useReporting() {
  return useMutation({
    mutationFn: async ({
      startDate,
      endDate,
      accountIds,
      includeBalances,
    }: {
      startDate: Date;
      endDate: Date;
      accountIds: string[];
      includeBalances: boolean;
    }) => {
      await getTransactionsReport(
        startDate,
        endDate,
        accountIds,
        includeBalances,
      );
    },
  });
}

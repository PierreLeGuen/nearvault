import { useQueries } from "@tanstack/react-query";
import { getFtBalanceAtDate, getLikelyBlockIdForDate } from "~/lib/client";
import usePersistingStore from "~/store/useStore";

export function useGetBalanceBetweenDates(
  from: Date,
  to: Date,
  accounts: string[],
) {
  console.log("useGetBalanceBetweenDates", from, to, accounts);
  const daysTimestamps = getDaysDateBetweenDates(from, to);

  return useQueries({
    queries: daysTimestamps.flatMap((date) =>
      accounts.map((accountId) => ({
        queryKey: ["coinBalance", date, accountId],
        queryFn: async () => {
          return getFtBalanceAtDate(date, accountId);
        },
      })),
    ),
  });
}

export function useGetBalanceAtDate(date: Date, accountId: string) {
  const { newNearConnection } = usePersistingStore();

  return useQueries({
    queries: [
      {
        queryKey: ["coinBalanceAtDate", date, accountId],
        queryFn: async () => {
          const near = await newNearConnection();
          return getFtBalanceAtDate(date, accountId);
        },
      },
    ],
  });
}

export function useLikelyBlockIdForDate(date: Date) {
  return useQueries({
    queries: [
      {
        queryKey: ["likelyBlockIdForDate", date],
        queryFn: async () => {
          return await getLikelyBlockIdForDate(date);
        },
      },
    ],
  });
}

export function getDaysDateBetweenDates(from: Date, to: Date) {
  const daysTimestamps: Date[] = [];
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(
    Math.abs((from.getTime() - to.getTime()) / oneDay),
  );
  for (let i = 0; i < diffDays; i++) {
    daysTimestamps.push(new Date(from.getTime() + i * oneDay));
  }
  return daysTimestamps;
}

import { QueryClient } from "@tanstack/react-query";

/**
 * The one React Query client for the app. tRPC 11 hooks use the client given
 * to `createTRPCNext` (tRPC 10 used the nearest provider), so both the tRPC
 * config and the app's provider pass this instance to share one cache and
 * one set of defaults.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      gcTime: 1 * 60,
      staleTime: 2 * 60,
    },
  },
});

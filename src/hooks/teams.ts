import { Team } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import { initFungibleTokenContract } from "~/lib/ft/contract";
import {
  LikelyTokens,
  Token,
  dbDataToTransfersData,
} from "~/lib/transformations";
import usePersistingStore from "~/store/useStore";

export function useAddMember() {
  const inviteMutation = api.teams.inviteToTeam.useMutation();
  return inviteMutation;
}

export function useListInvitations() {
  const listInvitationsQuery = api.teams.getInvitationsForUser.useQuery();
  return listInvitationsQuery;
}

export function useRemoveInvitation() {
  const rm = api.teams.deleteInvitation.useMutation();
  return rm;
}

export function useAddWallet() {
  return api.teams.addWalletsForTeam.useMutation();
}

export function useListWallets() {
  const { currentTeam } = usePersistingStore();
  if (!currentTeam) {
    throw new Error("Missing team ID");
  }

  return api.teams.getWalletsForTeam.useQuery({
    teamId: currentTeam.id,
  });
}

export function useTeamsWalletsWithLockups() {
  const { currentTeam, newNearConnection } = usePersistingStore();
  if (!currentTeam) {
    throw new Error("Missing team ID");
  }

  const { data } = useListWallets();
  return useQuery({
    queryKey: ["wallets", currentTeam?.id],
    queryFn: async () => {
      const wallets = await dbDataToTransfersData({
        data: data || [],
        getNearConnection: newNearConnection,
      });
      return wallets;
    },
    enabled: !!data,
  });
}

export function useListAddressBook() {
  const { currentTeam } = usePersistingStore();
  if (!currentTeam) {
    throw new Error("Missing team ID");
  }

  return api.teams.getBeneficiariesForTeam.useQuery({
    teamId: currentTeam?.id || "",
  });
}

export function useGetTokensForWallet(walletId: string) {
  return useQuery({
    queryKey: ["tokens", walletId],
    queryFn: async () => {
      const res = fetch(
        `https://api.kitwallet.app/account/${walletId}/likelyTokensFromBlock?fromBlockTimestamp=0`,
      );
      const data = (await (await res).json()) as LikelyTokens;
      console.log(data);

      return data;
    },
    enabled: !!walletId,
  });
}

export function useGetAllTokensWithBalanceForWallet(walletId: string) {
  const { newNearConnection } = usePersistingStore();
  const { data: tokenAddresses } = useGetTokensForWallet(walletId);

  return useQuery({
    queryKey: ["tokens", walletId, tokenAddresses?.list],
    queryFn: async () => {
      const tokAddrs = tokenAddresses?.list || [];

      const promises = tokAddrs.map(async (token) => {
        const near = await newNearConnection();
        const contract = initFungibleTokenContract(
          await near.account(""),
          token,
        );
        try {
          const ft_metadata = await contract.ft_metadata();
          const ft_balance = await contract.ft_balance_of({
            account_id: walletId,
          });

          const t: Token = {
            ...ft_metadata,
            balance: ft_balance,
            account_id: token,
          };

          return t;
        } catch (e) {
          console.log(e);
        }
      });

      const nearPromise = async () => {
        try {
          const account = (await newNearConnection()).account(walletId);
          const balance = await (await account).getAccountBalance();
          const t = {
            balance: balance.available,
            decimals: 24,
            name: "NEAR",
            symbol: "NEAR",
            account_id: "near",
          } as Token;
          return t;
        } catch (e) {
          console.log(e);
        }
      };

      const tokenDetails = (
        await Promise.all(promises.concat(nearPromise()))
      ).filter((t) => !!t);

      return tokenDetails;
    },
    enabled: !!tokenAddresses,
  });
}

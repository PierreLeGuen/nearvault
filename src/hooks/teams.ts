import { api } from "~/lib/api";
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

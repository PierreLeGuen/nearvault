import { type UserTeam, type Team } from "@prisma/client";
import { toast } from "react-toastify";
import { type StateCreator } from "zustand";

export interface TeamsState {
  currentTeam: Team | null;
  setCurrentTeam: (
    team: (UserTeam & { team: Team }) | null | undefined
  ) => void;
  resetTeams: () => void;
}

export const createTeamsSlice: StateCreator<TeamsState> = (set, get) => ({
  currentTeam: null,
  setCurrentTeam: (currentTeam) => {
    if (!currentTeam) {
      set({ currentTeam: null });
      toast.warning("No team selected anymore");
      return;
    }
    set({ currentTeam: currentTeam.team });
    toast.success(`Team switched to: ${currentTeam.team.name}`);
  },
  resetTeams: () => set({ currentTeam: null }),
});

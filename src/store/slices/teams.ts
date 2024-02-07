import { type Team } from "@prisma/client";
import { toast } from "react-toastify";
import { type StateCreator } from "zustand";

export interface TeamsState {
  currentTeam?: Team;
}

export interface TeamsActions {
  setCurrentTeam: (team: Team) => void;
  resetTeams: () => void;
}

export const createTeamsSlice: StateCreator<TeamsState & TeamsActions> = (
  set,
) => ({
  currentTeam: null,
  setCurrentTeam: (team) => {
    if (!team) {
      throw new Error("No team provided");
    }
    set({ currentTeam: team });
    toast.success(`Team switched to: ${team.name}`);
  },
  resetTeams: () => set({ currentTeam: null }),
});

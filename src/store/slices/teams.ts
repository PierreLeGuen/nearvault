import { type UserTeam, type Team } from "@prisma/client";
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
  setCurrentTeam: (currentTeam) => set({ currentTeam: currentTeam?.team }),
  resetTeams: () => set({ currentTeam: null }),
});

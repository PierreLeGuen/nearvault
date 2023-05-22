import { type Team } from "@prisma/client";
import { type StateCreator } from "zustand";
import { api } from "~/lib/api";

export interface TeamsState {
  teams: Team[] | null;
  currentTeam: Team | null;
  fetchTeams: () => void;
  setTeams: (teams: Team[]) => void;
  setCurrentTeam: (team: Team | null) => void;
}

export const createTeamsSlice: StateCreator<TeamsState> = (set, get) => ({
  teams: null,
  currentTeam: null,
  fetchTeams: () => {
    const teams = api.teams.getTeamsForUser
      .useQuery()
      .data?.map((ut) => ut.team);

    // set default team to first team
    if (!get().currentTeam && teams?.length) {
      set({ ...get(), teams, currentTeam: teams[0] });
    }

    set({ ...get(), teams });
  },
  setTeams: (teams) => set({ teams }),
  setCurrentTeam: (currentTeam) => set({ currentTeam }),
});

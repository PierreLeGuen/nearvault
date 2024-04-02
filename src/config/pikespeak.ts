import { fetchJson } from "~/lib/client";

type AccountInfo = {
  account_ids: string[];
  public_key: string;
};

export type PikeSpeakApiType = ReturnType<typeof newPikeSpeakApi>;
export const newPikeSpeakApi = () => {
  return {
    getTokensForAccount: async (accountId: string) => {
      return await fetchJson<
        {
          amount: string;
          contract: string;
          symbol: string;
          icon: string;
          isParsed: boolean;
        }[]
      >(`https://pikespeak.ai/api/contract/balance/${accountId}`);
    },
  };
};

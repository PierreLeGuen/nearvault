import { env } from "~/env.mjs";
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
      >(`https://api.pikespeak.ai/account/balance/${accountId}`, {
        headers: {
          "x-api-key": env.PIKESPEAK_API_KEY,
        },
      });
    },
  };
};

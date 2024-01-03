import { action } from "easy-peasy";

export const setMultisigAccounts: any = action((slice: any, payload: any) => {
  const { teamAccounts, accessKeys } = payload;

  slice.multisigAccounts = teamAccounts.map(
    ({ walletAddress }: any, index: number) => ({
      accountId: walletAddress,
      keys: accessKeys[index].map((key: any) => key.public_key),
    }),
  );
});

import { thunk } from "easy-peasy";
import { connect } from "near-api-js";
import { config } from '~/config/config';

const getAccountAccessKeys = async (accountId: string) => {
  const near = await connect({
    networkId: config.networkId,
    nodeUrl: config.urls.rpc,
  });
  const account = await near.account(accountId);
  return await account.getAccessKeys();
};

export const getMultisigAccounts = thunk(async (actions: any, payload: any) => {
  const { teamAccounts, setIsLoading } = payload;

  try {
    setIsLoading(true);
    const accessKeys = await Promise.all(
      teamAccounts.map(({ walletAddress }: any) =>
        getAccountAccessKeys(walletAddress),
      ),
    );

    actions.setMultisigAccounts({ teamAccounts, accessKeys });
  } catch (e) {
    console.error(e);
  } finally {
    setIsLoading(false);
  }
});

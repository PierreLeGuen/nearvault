import { thunk } from "easy-peasy";

export const requestConnect = thunk(
  async (_, __, { getState, getStoreActions }) => {
    const slice: any = getState();
    const actions: any = getStoreActions();

    const url = new URL(slice.loginUrl);

    url.searchParams.set(
      "success_url",
      `${window.location.origin}/connect/my-near-wallet/success?prevPage=${window.location.pathname}`,
    );
    url.searchParams.set(
      "failure_url",
      `${window.location.origin}/connect/my-near-wallet/failure?prevPage=${window.location.pathname}`,
    );

    actions.wallets.setConnectInProgress("my-near-wallet");

    window.location.assign(url.toString());
  },
);

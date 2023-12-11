import { thunk } from "easy-peasy";

const LOGIN_WALLET_URL_SUFFIX = "/login";

export const requestConnect = thunk(
  async (actions, payload, { getState, getStoreActions }) => {
    const slice = getState();
    const storeActions = getStoreActions();
    const url = new URL(
      slice.connection.config.walletUrl + LOGIN_WALLET_URL_SUFFIX,
    );

    url.searchParams.set(
      "success_url",
      `${window.location.origin}/connect/my-near-wallet/success?prevPage=${window.location.pathname}`,
    );
    url.searchParams.set(
      "failure_url",
      `${window.location.origin}/connect/my-near-wallet/failure?prevPage=${window.location.pathname}`,
    );

    storeActions.wallets.setConnectionInProgress("my-near-wallet");

    window.location.assign(url.toString());
  },
);

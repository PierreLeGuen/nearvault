import { thunk } from "easy-peasy";

export const requestConnect = thunk(
  async (_, __, { getState }) => {
    const slice: any = getState();
    const url = new URL(slice.loginUrl);

    url.searchParams.set(
      "success_url",
      `${window.location.origin}/wallet-redirects/my-near-wallet?connectStatus=Allowed&returnTo=${window.location.pathname}`,
    );
    url.searchParams.set(
      "failure_url",
      `${window.location.origin}/wallet-redirects/my-near-wallet?connectStatus=Rejected&returnTo=${window.location.pathname}`,
    );

    window.location.assign(url.toString());
  },
);

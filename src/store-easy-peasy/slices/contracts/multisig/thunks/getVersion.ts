import { thunk } from "easy-peasy";
import { JsonRpcProvider } from "near-api-js/lib/providers";

export const getVersion = thunk(async (actions: any, payload: any) => {
  const { contractId }: any = payload;

  const provider = new JsonRpcProvider({
    url: "https://beta.rpc.mainnet.near.org", // TODO move to config
  });

  try {
    const res = await actions.getMembers({ contractId, provider });
    console.log(res);
    return 2;
  } catch (e) {
    return 1;
  }
});

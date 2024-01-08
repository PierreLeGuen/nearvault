import { thunk } from "easy-peasy";
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { config } from "~/config/config";

export const getMultisigContract = thunk((actions: any, payload: any) => {
  const { contractId }: any = payload;

  const provider = new JsonRpcProvider({ url: config.urls.rpc });

  return {
    listRequestIds: () => actions.listRequestIds({ contractId, provider }),
    getNumConfirmations: () =>
      actions.getNumConfirmations({ contractId, provider }),
    getConfirmations: ({ requestId }) =>
      actions.getConfirmations({ contractId, provider, requestId }),
    getRequest: ({ requestId }) =>
      actions.getRequest({ contractId, provider, requestId }),
  };
});

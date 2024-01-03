import { thunk } from "easy-peasy";
import { viewFunction } from "~/store-easy-peasy/slices/contracts/helpers/viewFunction";

export const getRequest = thunk(async (_, payload: any) => {
  const { contractId, provider, requestId }: any = payload;

  return await viewFunction({
    provider,
    contractId,
    method: "get_request",
    args: {
      request_id: requestId,
    },
  });
});

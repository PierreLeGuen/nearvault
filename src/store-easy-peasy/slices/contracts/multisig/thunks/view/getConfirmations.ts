import { thunk } from "easy-peasy";
import { viewFunction } from "~/store-easy-peasy/slices/contracts/helpers/viewFunction";

export const getConfirmations = thunk(async (_, payload: any) => {
  const { contractId, provider, requestId }: any = payload;

  return await viewFunction({
    provider,
    contractId,
    method: "get_confirmations",
    args: {
      request_id: requestId,
    }
  });
});

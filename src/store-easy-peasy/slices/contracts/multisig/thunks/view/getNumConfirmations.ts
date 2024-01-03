import { thunk } from "easy-peasy";
import { viewFunction } from "~/store-easy-peasy/slices/contracts/helpers/viewFunction";

export const getNumConfirmations = thunk(async (_, payload: any) => {
  const { contractId, provider }: any = payload;

  return await viewFunction({
    provider,
    contractId,
    method: "get_num_confirmations",
  });
});

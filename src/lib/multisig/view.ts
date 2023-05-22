import * as naj from "near-api-js";
import { type Action } from "near-api-js/lib/transaction";

interface MultisigViewFunction extends naj.Contract {
  list_request_ids(): Promise<string[]>;
  get_request({ request_id }: { request_id: string }): Promise<MultisigRequest>;
}

export interface MultisigRequest {
  receiver_id: string;
  actions: Action[];
}

const MultisigViewContract = (
  account: naj.Account,
  wallet: string
): MultisigViewFunction => {
  return new naj.Contract(account, wallet, {
    viewMethods: ["list_request_ids", "get_request"],
    changeMethods: [],
  }) as MultisigViewFunction;
};

export default MultisigViewContract;

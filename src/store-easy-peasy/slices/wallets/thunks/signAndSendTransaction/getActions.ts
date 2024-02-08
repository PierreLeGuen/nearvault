import { transactions, utils } from "near-api-js";
import BN from "bn.js";
import { toGas } from "src/store-easy-peasy/helpers/toGas";
import { type Action } from "near-api-js/lib/transaction";

type FunctionCallAction = {
  type: string;
  method: string;
  args: object;
  tGas?: number;
  gas?: number;
  deposit?: string;
};

const functionCall = (action: FunctionCallAction) => {
  const gas: any = action.tGas ? toGas(action.tGas) : action.gas;

  const deposit: any = action.deposit
    ? utils.format.parseNearAmount(action.deposit)
    : new BN(0);

  return transactions.functionCall(action.method, action.args, gas, deposit);
};

export const getActions = (action: Action, actions: Action[]) => {
  const list = actions ? actions : [action];
  // check if action is of type Uint8Array
  const l = list.map((action: Action) => {
    //@ts-expect-error
    if (action.type === "FunctionCall") return functionCall(action);
    return action;
  });
  console.log("getActions", { l });
  return l;
};

import BN from "bn.js";
import { type Action } from "near-api-js";
import { toGas } from "src/store-easy-peasy/helpers/toGas";
import { parseNearAmount, transactions } from "~/lib/near/compat";

type FunctionCallAction = {
  type: string;
  method: string;
  args: object;
  tGas?: number;
  gas?: number;
  deposit?: string;
};

const functionCall = (action: FunctionCallAction) => {
  const gas = action.tGas ? toGas(action.tGas) : action.gas;

  const deposit = action.deposit ? parseNearAmount(action.deposit)! : new BN(0);

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
  console.log("getActions", { count: l.length });
  return l;
};

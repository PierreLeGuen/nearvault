import { transactions, utils } from "near-api-js";
import BN from "bn.js";
import { toGas } from "src/store-easy-peasy/helpers/toGas";

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

export const getActions = (action: any, actions: any) => {
  const list = actions ? actions : [action];
  return list.map((action: any) => {
    if (action.type === "FunctionCall") return functionCall(action);
  });
};

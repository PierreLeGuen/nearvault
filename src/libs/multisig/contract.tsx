import * as nearAPI from "near-api-js";
import { AccessKeyInfoView } from "near-api-js/lib/providers/provider";
import { Gas, NEAR } from "near-units";

type Base64VecU8 = string;
type Base58PublicKey = string;

interface FunctionCallPermission {
  allowance?: string;
  receiver_id?: string;
  method_names?: string[];
}

type MultiSigRequestAction =
  | {
      type: "Transfer";
      amount: string;
    }
  | {
      type: "CreateAccount";
    }
  | {
      type: "DeployContract";
      code: Base64VecU8;
    }
  | {
      type: "AddKey";
      public_key: Base58PublicKey;
      permission?: FunctionCallPermission;
    }
  | {
      type: "DeleteKey";
      public_key: Base58PublicKey;
    }
  | {
      type: "FunctionCall";
      method_name: string;
      args: Base64VecU8;
      deposit: string;
      gas: number;
    }
  | {
      type: "SetNumConfirmations";
      num_confirmations: number;
    }
  | {
      type: "SetActiveRequestsLimit";
      active_requests_limit: number;
    };

export type MultiSigRequest = {
  receiver_id: string;
  actions: MultiSigRequestAction[];
};

export interface MultisigContract extends nearAPI.Contract {
  add_request(options: {
    args: {
      request: MultiSigRequest;
    };
    gas?: Gas;
    attachedDeposit?: NEAR;
  }): Promise<void>;

  getAccessKeys(): Promise<AccessKeyInfoView[]>;
}

export function init(
  account: nearAPI.Account,
  contractName: string
): MultisigContract {
  return new nearAPI.Contract(account, contractName, {
    changeMethods: [],
    viewMethods: [],
  }) as MultisigContract;
}

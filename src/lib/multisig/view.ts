import * as naj from "near-api-js";

export enum MultiSigRequestActionType {
  CreateAccount = "CreateAccount",
  DeployContract = "DeployContract",
  AddMember = "AddMember",
  DeleteMember = "DeleteMember",
  AddKey = "AddKey",
  SetNumConfirmations = "SetNumConfirmations",
  SetActiveRequestsLimit = "SetActiveRequestsLimit",
  Transfer = "Transfer",
  NearEscrowTransfer = "NearEscrowTransfer",
  FTEscrowTransfer = "FTEscrowTransfer",
  FunctionCall = "FunctionCall",
}
interface CreateAccountAction {
  type: MultiSigRequestActionType.CreateAccount;
}

interface DeployContractAction {
  type: MultiSigRequestActionType.DeployContract;
  code: string; // Base64VecU8
}

interface AddMemberAction {
  type: MultiSigRequestActionType.AddMember;
  member: MultisigMember;
}

interface DeleteMemberAction {
  type: MultiSigRequestActionType.DeleteMember;
  member: MultisigMember;
}

interface AddKeyAction {
  type: MultiSigRequestActionType.AddKey;
  public_key: string; // PublicKey
  permission?: FunctionCallPermission;
}

interface SetNumConfirmationsAction {
  type: MultiSigRequestActionType.SetNumConfirmations;
  num_confirmations: number;
}

interface SetActiveRequestsLimitAction {
  type: MultiSigRequestActionType.SetActiveRequestsLimit;
  active_requests_limit: number;
}

interface TransferAction {
  type: MultiSigRequestActionType.Transfer;
  amount: string; // U128
}

interface NearEscrowTransferAction {
  type: MultiSigRequestActionType.NearEscrowTransfer;
  receiver_id: string; // AccountId
  amount: string; // U128
  label: string;
  is_cancellable: boolean;
}

interface FTEscrowTransferAction {
  type: MultiSigRequestActionType.FTEscrowTransfer;
  receiver_id: string; // AccountId
  amount: string; // U128
  token_id: string; // AccountId
  label: string;
  is_cancellable: boolean;
}

interface MultisigMember {
  AccessKey: {
    public_key: PublicKey;
  };
  Account: {
    account_id: string; // AccountId
  };
}

type PublicKey = string; // In near-api-js, PublicKey is usually represented as a string.

interface FunctionCallPermission {
  allowance: string | null; // U128
  receiver_id: string; // AccountId
  method_names: string[];
}

interface FunctionCallAction {
  type: MultiSigRequestActionType.FunctionCall; // Add FunctionCall to MultiSigRequestActionType enum
  method_name: string;
  args: string; // Base64VecU8
  deposit: string; // U128
  gas: string; // U64
}

type MultiSigAction =
  | CreateAccountAction
  | DeployContractAction
  | AddMemberAction
  | DeleteMemberAction
  | AddKeyAction
  | SetNumConfirmationsAction
  | SetActiveRequestsLimitAction
  | TransferAction
  | NearEscrowTransferAction
  | FTEscrowTransferAction
  | FunctionCallAction;

export interface MultisigRequest {
  request_id: number;
  receiver_id: string;
  actions: MultiSigAction[];
}

interface MultisigViewFunction extends naj.Contract {
  list_request_ids(): Promise<string[]>;
  get_request({ request_id }: { request_id: string }): Promise<MultisigRequest>;
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

import * as nearAPI from "near-api-js";

export type U128 = string; // Assuming it is a string representation of a 128-bit unsigned integer
export type U64 = string; // Assuming it is a string representation of a 64-bit unsigned integer
export type Base58PublicKey = string; // Assuming it is a Base58 encoded string
export type Base64VecU8 = string; // Assuming it is a Base64 encoded string
export type AccountId = string; // Assuming it is a string
export type RequestId = string; // Assuming it is a string

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
  DeleteKey = "DeleteKey",
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
  public_key: PublicKey;
  account_id: string; // AccountId
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

interface DeleteKeyAction {
  type: MultiSigRequestActionType.DeleteKey;
  public_key: Base58PublicKey;
}

export type MultiSigAction =
  | CreateAccountAction
  | DeployContractAction
  | AddMemberAction
  | DeleteMemberAction
  | AddKeyAction
  | DeleteKeyAction
  | SetNumConfirmationsAction
  | SetActiveRequestsLimitAction
  | TransferAction
  | NearEscrowTransferAction
  | FTEscrowTransferAction
  | FunctionCallAction;

export interface MultisigRequest {
  request_id: number;
  receiver_id: string;
  confirmations: string[];
  requiredConfirmations: number;
  actions: MultiSigAction[];
}

export interface MultiSigContract extends nearAPI.Contract {
  add_request(params: { request: MultisigRequest }): Promise<RequestId>;
  add_request_and_confirm(params: {
    request: MultisigRequest;
  }): Promise<RequestId>;
  delete_request(params: { request_id: RequestId }): Promise<void>;
  confirm(params: { request_id: RequestId }): Promise<boolean>;

  // View methods
  get_request(params: { request_id: RequestId }): Promise<MultisigRequest>;
  get_num_requests_per_member(params: {
    member: MultisigMember;
  }): Promise<number>;
  list_request_ids(): Promise<RequestId[]>;
  get_confirmations(params: { request_id: RequestId }): Promise<string[]>;
  get_num_confirmations(): Promise<number>;
  get_request_nonce(): Promise<number>;
}

export function initMultiSigContract(
  account: nearAPI.Account,
  contractName: string,
): MultiSigContract {
  return new nearAPI.Contract(account, contractName, {
    viewMethods: [
      "get_request",
      "get_num_requests_per_member",
      "list_request_ids",
      "get_confirmations",
      "get_num_confirmations",
      "get_request_nonce",
    ],
    changeMethods: [
      "add_request",
      "add_request_and_confirm",
      "delete_request",
      "confirm",
    ],
  }) as MultiSigContract;
}

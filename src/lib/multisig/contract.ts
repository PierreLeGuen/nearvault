import * as nearAPI from "near-api-js";

export type U128 = string; // Assuming it is a string representation of a 128-bit unsigned integer
export type U64 = string; // Assuming it is a string representation of a 64-bit unsigned integer
export type Base58PublicKey = string; // Assuming it is a Base58 encoded string
export type Base64VecU8 = string; // Assuming it is a Base64 encoded string
export type AccountId = string; // Assuming it is a string
export type RequestId = string; // Assuming it is a string

export enum MultiSigRequestAction {
  Transfer = "Transfer",
  CreateAccount = "CreateAccount",
  DeployContract = "DeployContract",
  AddMember = "AddMember",
  DeleteMember = "DeleteMember",
  AddKey = "AddKey",
  FunctionCall = "FunctionCall",
  SetNumConfirmations = "SetNumConfirmations",
  SetActiveRequestsLimit = "SetActiveRequestsLimit",
}

export interface FunctionCallPermission {
  allowance: U128 | null;
  receiver_id: AccountId;
  method_names: string[];
}

export interface MultiSigRequest {
  receiver_id: AccountId;
  actions: MultiSigRequestAction[];
}

export interface MultiSigRequestWithSigner {
  request: MultiSigRequest;
  member: MultisigMember;
  added_timestamp: number;
}

export enum MultisigMember {
  AccessKey = "AccessKey",
  Account = "Account",
}

export interface MultiSigContract extends nearAPI.Contract {
  add_request(params: { request: MultiSigRequest }): Promise<RequestId>;
  add_request_and_confirm(params: {
    request: MultiSigRequest;
  }): Promise<RequestId>;
  delete_request(params: { request_id: RequestId }): Promise<void>;
  confirm(params: { request_id: RequestId }): Promise<boolean>;

  // View methods
  get_request(params: { request_id: RequestId }): Promise<MultiSigRequest>;
  get_num_requests_per_member(params: {
    member: MultisigMember;
  }): Promise<number>;
  list_request_ids(): Promise<RequestId[]>;
  get_confirmations(params: {
    request_id: RequestId;
  }): Promise<MultisigMember[]>;
  get_num_confirmations(): Promise<number>;
  get_request_nonce(): Promise<number>;
}

export function initMultiSigContract(
  account: nearAPI.Account,
  contractName: string
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

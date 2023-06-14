import * as nearAPI from "near-api-js";

export type AccountId = string;
export type WrappedBalance = string;
export type TerminationStatus = string; // Define it more precisely if you know the exact possible values
export type VestingInformation = string; // Define it more precisely if you know the exact possible values
export type VestingSchedule = string; // Define it more precisely if you know the exact possible values

export interface LockupContract extends nearAPI.Contract {
  get_owner_account_id(): Promise<AccountId>;
  get_staking_pool_account_id(): Promise<AccountId | null>;
  get_known_deposited_balance(): Promise<WrappedBalance>;
  get_termination_status(): Promise<TerminationStatus | null>;
  get_terminated_unvested_balance(): Promise<WrappedBalance>;
  get_terminated_unvested_balance_deficit(): Promise<WrappedBalance>;
  get_locked_amount(): Promise<WrappedBalance>;
  get_locked_vested_amount(
    vesting_schedule: VestingSchedule
  ): Promise<WrappedBalance>;
  get_unvested_amount(
    vesting_schedule: VestingSchedule
  ): Promise<WrappedBalance>;
  get_vesting_information(): Promise<VestingInformation>;
  get_owners_balance(): Promise<WrappedBalance>;
  get_balance(): Promise<WrappedBalance>;
  get_liquid_owners_balance(): Promise<WrappedBalance>;
  are_transfers_enabled(): Promise<boolean>;
}

export function initLockupContract(
  account: nearAPI.Account,
  contractName: string
): LockupContract {
  return new nearAPI.Contract(account, contractName, {
    viewMethods: [
      "get_owner_account_id",
      "get_staking_pool_account_id",
      "get_known_deposited_balance",
      "get_termination_status",
      "get_terminated_unvested_balance",
      "get_terminated_unvested_balance_deficit",
      "get_locked_amount",
      "get_locked_vested_amount",
      "get_unvested_amount",
      "get_vesting_information",
      "get_owners_balance",
      "get_balance",
      "get_liquid_owners_balance",
      "are_transfers_enabled",
    ],
    changeMethods: [],
  }) as LockupContract;
}

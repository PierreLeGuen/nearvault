import * as nearAPI from "near-api-js";
import { type Base58PublicKey } from "../multisig/contract";
import usePersistingStore from "~/store/useStore";

export type AccountId = string;
export type WrappedBalance = string;
export type TerminationStatus = string; // Define it more precisely if you know the exact possible values
export type VestingInformation = string; // Define it more precisely if you know the exact possible values
export type VestingSchedule = string; // Define it more precisely if you know the exact possible values

export interface LockupContract extends nearAPI.Contract {
  // View methods
  get_owner_account_id(): Promise<AccountId>;
  get_staking_pool_account_id(): Promise<AccountId | null>;
  get_known_deposited_balance(): Promise<WrappedBalance>;
  get_termination_status(): Promise<TerminationStatus | null>;
  get_terminated_unvested_balance(): Promise<WrappedBalance>;
  get_terminated_unvested_balance_deficit(): Promise<WrappedBalance>;
  get_locked_amount(): Promise<WrappedBalance>;
  get_locked_vested_amount(
    vesting_schedule: VestingSchedule,
  ): Promise<WrappedBalance>;
  get_unvested_amount(
    vesting_schedule: VestingSchedule,
  ): Promise<WrappedBalance>;
  get_vesting_information(): Promise<VestingInformation>;
  get_owners_balance(): Promise<WrappedBalance>;
  get_balance(): Promise<WrappedBalance>;
  get_liquid_owners_balance(): Promise<WrappedBalance>;
  are_transfers_enabled(): Promise<boolean>;

  // Change methods
  add_full_access_key(params: {
    new_public_key: Base58PublicKey;
  }): Promise<void>;
  transfer(params: {
    amount: WrappedBalance;
    receiver_id: AccountId;
  }): Promise<void>;
  check_transfers_vote(): Promise<void>;
  unstake_all(): Promise<void>;
  unstake(params: { amount: WrappedBalance }): Promise<void>;
  withdraw_all_from_staking_pool(): Promise<void>;
  withdraw_from_staking_pool(params: { amount: WrappedBalance }): Promise<void>;
  refresh_staking_pool_balance(): Promise<void>;
  deposit_and_stake(params: { amount: WrappedBalance }): Promise<void>;
  deposit_to_staking_pool(params: { amount: WrappedBalance }): Promise<void>;
  unselect_staking_pool(): Promise<void>;
  select_staking_pool(params: {
    staking_pool_account_id: AccountId;
  }): Promise<void>;
}

export const changeMethods = [
  "select_staking_pool",
  "unselect_staking_pool",
  "deposit_to_staking_pool",
  "deposit_and_stake",
  "refresh_staking_pool_balance",
  "withdraw_from_staking_pool",
  "withdraw_all_from_staking_pool",
  "unstake",
  "unstake_all",
  "check_transfers_vote",
  "transfer",
  "add_full_access_key",
];

export const lockupChangeMethods = new Set(changeMethods);

export async function initLockupContract(
  accountId: string,
  contractName: string,
  near: nearAPI.Near,
): Promise<LockupContract> {
  const account = await near.account(accountId);

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
    changeMethods: changeMethods,
  }) as LockupContract;
}

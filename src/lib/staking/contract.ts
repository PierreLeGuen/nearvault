import * as nearAPI from "near-api-js";

export type RewardFeeFraction = {
  numerator: number;
  denominator: number;
};

export type HumanReadableAccount = {
  account_id: string;
  unstaked_balance: string;
  staked_balance: string;
  can_withdraw: boolean;
};

export type Base58PublicKey = string; // Assuming it is a Base58 encoded string

export interface StakingContract extends nearAPI.Contract {
  get_account_staked_balance(account_id: string): Promise<string>;
  get_account_unstaked_balance(account_id: string): Promise<string>;
  get_account_total_balance(account_id: string): Promise<string>;
  is_account_unstaked_balance_available(account_id: string): Promise<boolean>;
  get_total_staked_balance(): Promise<string>;
  get_owner_id(): Promise<string>;
  get_reward_fee_fraction(): Promise<RewardFeeFraction>;
  get_staking_key(): Promise<Base58PublicKey>;
  is_staking_paused(): Promise<boolean>;
  get_account(account_id: string): Promise<HumanReadableAccount>;
  get_number_of_accounts(): Promise<number>;
  get_accounts(
    from_index: number,
    limit: number
  ): Promise<HumanReadableAccount[]>;

  // Change methods
  ping(): Promise<void>;
  deposit(): Promise<void>;
  deposit_and_stake(): Promise<void>;
  stake(amount: string): Promise<void>;
  stake_all(): Promise<void>;
  unstake(amount: string): Promise<void>;
  unstake_all(): Promise<void>;
  withdraw(amount: string): Promise<void>;
  withdraw_all(): Promise<void>;

  // Owner's methods
  update_staking_key(stake_public_key: Base58PublicKey): Promise<void>;
  update_reward_fee_fraction(
    reward_fee_fraction: RewardFeeFraction
  ): Promise<void>;
  vote(voting_account_id: string, is_vote: boolean): Promise<void>;
  pause_staking(): Promise<void>;
  resume_staking(): Promise<void>;
}

export function initStakingContract(
  account: nearAPI.Account,
  contractName: string
): StakingContract {
  return new nearAPI.Contract(account, contractName, {
    viewMethods: [
      "get_account_staked_balance",
      "get_account_unstaked_balance",
      "get_account_total_balance",
      "is_account_unstaked_balance_available",
      "get_total_staked_balance",
      "get_owner_id",
      "get_reward_fee_fraction",
      "get_staking_key",
      "is_staking_paused",
      "get_account",
      "get_number_of_accounts",
      "get_accounts",
    ],
    changeMethods: [
      "ping",
      "deposit",
      "deposit_and_stake",
      "withdraw",
      "withdraw_all",
      "stake",
      "stake_all",
      "unstake",
      "unstake_all",
      "update_staking_key",
      "update_reward_fee_fraction",
      "vote",
      "pause_staking",
      "resume_staking",
    ],
  }) as StakingContract;
}

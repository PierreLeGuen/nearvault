import type BN from "bn.js";
import { type ConnectConfig } from "near-api-js/lib/connect";
import { type KeyStore } from "near-api-js/lib/key_stores/keystore";
import { type QueryResponseKind } from "near-api-js/lib/providers/provider";
import * as nearAPI from "near-api-js";

export type LockupState = {
  readonly owner: string;
  readonly lockupAmount: BN;
  readonly terminationWithdrawnTokens: BN;
  readonly lockupDuration: BN;
  readonly releaseDuration?: BN;
  readonly lockupTimestamp?: BN;
  readonly blockTimestamp: BN;
  readonly transferInformation: TransferInformation;
  readonly vestingInformation?: FromStateVestingInformation;
  readonly hasBrokenTimestamp: boolean;
  readonly stakingPoolWhitelistAccountId: string;
  readonly stakingInfo?: StakingInformation;
  readonly foundationAccount: string;
};

export type AccountLockup = {
  readonly lockupAccountId: string;
  readonly calculatedAtBlockHeight: number;
  readonly ownerAccountBalance: BN;
  readonly lockedAmount: BN;
  readonly liquidAmount: BN;
  readonly totalAmount: BN;
  readonly lockupReleaseStartDate: Date;
  readonly lockupState: LockupState & {
    readonly vestedInfo: string;
  };
};

export type TransferInformation = {
  readonly transfers_timestamp?: BN;
  readonly transfer_poll_account_id?: string;
};

export type StakingInformation = {
  readonly staking_pool_account_id?: string;
  readonly status?: number;
  readonly deposit_amount?: BN;
};

export type FromStateVestingInformation = {
  readonly vestingHash?: Uint8Array;
  readonly start?: BN;
  readonly cliff?: BN;
  readonly end?: BN;
  readonly unvestedAmount?: BN;
  readonly terminationStatus?: number;
};

type StateItem = {
  readonly key: string;
  readonly value: string;
  readonly proof: readonly string[];
};

export type BlockReference =
  | {
      readonly block_id: string | number;
    }
  | {
      readonly finality: "optimistic" | "near-final" | "final";
    }
  | {
      readonly sync_checkpoint: "genesis" | "earliest_available";
    };

export type ViewStateResult = QueryResponseKind & {
  readonly values: readonly StateItem[];
  readonly proof: readonly string[];
};

export type ViewAccountQuery = QueryResponseKind & {
  readonly amount: string;
  readonly locked: string;
  readonly code_hash: string;
  readonly storage_usage: number;
  readonly storage_paid_at: number;
};

export type ViewAccount = {
  readonly amount: BN;
  readonly codeHash: string;
  readonly blockHeight: number;
};

export type ConnectOptions = Omit<
  ConnectConfig,
  "networkId" | "keyStore" | "headers"
> & {
  readonly networkId?: string;
  readonly keyStore?: KeyStore;
  readonly headers?: {
    readonly [key: string]: string | number;
  };
};

// Code herE: https://github.com/near/core-contracts/blob/215d4ed2edb563c47edd961555106b74275c4274/lockup/src/getters.rs#L7
export interface LockupContract extends nearAPI.Contract {
  get_owner_account_id(): Promise<string>;
  get_staking_pool_account_id(): Promise<string>;
  get_vesting_information(): Promise<FromStateVestingInformation | "None">;
  get_termination_status(): Promise<number>;
}

export function init(
  account: nearAPI.Account,
  contractName: string
): LockupContract {
  return new nearAPI.Contract(account, contractName, {
    changeMethods: [],
    viewMethods: ["get_vesting_information", "get_termination_status"],
  }) as LockupContract;
}

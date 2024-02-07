import { type WalletPretty } from "~/pages/staking/stake";

export interface StakedPool {
  deposit: string;
  withdraw_available: string;
  validator_id: string;
}

export interface WalletData {
  wallet: WalletPretty;
  stakedPools: StakedPool[];
}

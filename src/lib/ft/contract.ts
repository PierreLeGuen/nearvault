import * as nearAPI from "near-api-js";

export type FungibleTokenMetadata = {
  spec: string;
  name: string;
  symbol: string;
  icon: string | null;
  reference: string | null;
  reference_hash: string | null;
  decimals: number;
};

export interface FungibleTokenContract extends nearAPI.Contract {
  ft_transfer(params: {
    receiver_id: string;
    amount: string;
    memo: string | null;
  }): Promise<void>;
  ft_transfer_call(params: {
    receiver_id: string;
    amount: string;
    memo: string | null;
    msg: string;
  }): Promise<void>;

  // View methods
  ft_total_supply(): Promise<string>;
  ft_balance_of(params: { account_id: string }): Promise<string>;
  ft_metadata(): Promise<FungibleTokenMetadata>;
}

export function initFungibleTokenContract(
  account: nearAPI.Account,
  contractName: string
): FungibleTokenContract {
  return new nearAPI.Contract(account, contractName, {
    changeMethods: ["ft_transfer", "ft_transfer_call"],
    viewMethods: ["ft_total_supply", "ft_balance_of", "ft_metadata"],
  }) as FungibleTokenContract;
}

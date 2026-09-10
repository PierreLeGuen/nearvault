import { parseNearAmount } from "near-api-js/lib/utils/format";
import { type FungibleTokenMetadata } from "~/lib/ft/contract";

export const BURROW_CONTRACT_ID = "contract.main.burrow.near";
export const REF_FINANCE_CONTRACT_ID = "v2.ref-finance.near";

const T_GAS = 1000000000000;
const ONE_YOCTO = "1";
const FT_STORAGE_DEPOSIT = parseNearAmount("0.005") ?? "0";
// Attached to add_liquidity / add_stable_liquidity to pay for the LP share
// storage; the exchange refunds whatever it does not use.
const LP_STORAGE_DEPOSIT = parseNearAmount("0.01") ?? "0";

export const REF_POOL_KINDS = [
  "SIMPLE_POOL",
  "STABLE_SWAP",
  "RATED_SWAP",
  "DEGEN_SWAP",
] as const;
export type RefPoolKind = (typeof REF_POOL_KINDS)[number];

/**
 * Pool kinds built on Rhea's StableSwap engine. They must be funded with
 * `add_stable_liquidity` (any token combination, guarded by `min_shares`).
 * Calling the classic `add_liquidity` on them panics on-chain with
 * "not implemented" (ref-exchange/src/pool.rs). DEGEN_SWAP is the kind Rhea
 * markets as "ALMM" pools (e.g. wNEAR/USDt #6063).
 */
export const STABLE_LIKE_POOL_KINDS: readonly RefPoolKind[] = [
  "STABLE_SWAP",
  "RATED_SWAP",
  "DEGEN_SWAP",
];

export const isStableLikePool = (poolKind: string) =>
  (STABLE_LIKE_POOL_KINDS as readonly string[]).includes(poolKind);

const REF_POOL_KIND_LABELS: Record<RefPoolKind, string> = {
  SIMPLE_POOL: "Classic",
  STABLE_SWAP: "Stable",
  RATED_SWAP: "Rated",
  DEGEN_SWAP: "ALMM",
};

export const getRefPoolKindLabel = (poolKind: string) =>
  REF_POOL_KIND_LABELS[poolKind as RefPoolKind] ?? poolKind;

/** Default tolerated drop between predicted and minted LP shares, in percent. */
export const DEFAULT_LIQUIDITY_SLIPPAGE_PERCENT = 1;

/**
 * Lowers an indivisible amount by `slippagePercent`, rounding down.
 * Percentages with up to four decimals are applied exactly.
 */
export const applySlippage = (amount: string, slippagePercent: number) => {
  if (
    !Number.isFinite(slippagePercent) ||
    slippagePercent < 0 ||
    slippagePercent >= 100
  ) {
    throw new Error("Slippage must be between 0 and 100 percent.");
  }
  const keep = BigInt(Math.round((100 - slippagePercent) * 10000));
  return ((BigInt(amount) * keep) / BigInt(1000000)).toString();
};

export type BurrowPositionType = "supplied" | "collateral";

export type BurrowWithdrawParams = {
  funding: string;
  token: string;
  positionType: BurrowPositionType;
  amount: string;
};

export type RefDeposit = {
  tokenId: string;
  amount: string;
  formattedAmount: string;
  metadata?: FungibleTokenMetadata;
};

type FunctionCallAction = {
  type: "FunctionCall";
  method_name: string;
  args: string;
  deposit: string;
  gas: string;
};

type MultisigRequestPayload = {
  request: {
    receiver_id: string;
    actions: FunctionCallAction[];
  };
};

const tGas = (amount: number) => (amount * T_GAS).toString();

const encodeArgs = (args: Record<string, unknown>) => {
  return btoa(JSON.stringify(args));
};

const functionCallAction = (
  methodName: string,
  args: Record<string, unknown>,
  deposit: string,
  gas: string,
): FunctionCallAction => ({
  type: "FunctionCall",
  method_name: methodName,
  args: encodeArgs(args),
  deposit,
  gas,
});

export const buildBurrowWithdrawRequest = ({
  tokenId,
  positionType,
  amount,
}: {
  tokenId: string;
  positionType: BurrowPositionType;
  amount: string;
}): MultisigRequestPayload => {
  const withdrawAction = {
    Withdraw: {
      token_id: tokenId,
      max_amount: amount,
    },
  };

  const actions =
    positionType === "collateral"
      ? [
          {
            DecreaseCollateral: {
              token_id: tokenId,
              max_amount: amount,
            },
          },
          withdrawAction,
        ]
      : [withdrawAction];

  return {
    request: {
      receiver_id: BURROW_CONTRACT_ID,
      actions: [
        functionCallAction(
          "execute_with_pyth",
          { actions },
          ONE_YOCTO,
          tGas(200),
        ),
      ],
    },
  };
};

/** Classic (SIMPLE_POOL) pools only; other kinds panic on this method. */
export const buildRefAddLiquidityRequest = ({
  poolId,
  amounts,
}: {
  poolId: number;
  amounts: string[];
}): MultisigRequestPayload => ({
  request: {
    receiver_id: REF_FINANCE_CONTRACT_ID,
    actions: [
      functionCallAction(
        "add_liquidity",
        {
          pool_id: poolId,
          amounts,
        },
        LP_STORAGE_DEPOSIT,
        tGas(50),
      ),
    ],
  },
});

/** Stable, rated and ALMM (DEGEN_SWAP) pools. */
export const buildRefAddStableLiquidityRequest = ({
  poolId,
  amounts,
  minShares,
}: {
  poolId: number;
  amounts: string[];
  minShares: string;
}): MultisigRequestPayload => ({
  request: {
    receiver_id: REF_FINANCE_CONTRACT_ID,
    actions: [
      functionCallAction(
        "add_stable_liquidity",
        {
          pool_id: poolId,
          amounts,
          min_shares: minShares,
        },
        LP_STORAGE_DEPOSIT,
        tGas(100),
      ),
    ],
  },
});

export const buildRefRemoveLiquidityRequest = ({
  poolId,
  shares,
  minAmounts,
}: {
  poolId: number;
  shares: string;
  minAmounts: string[];
}): MultisigRequestPayload => ({
  request: {
    receiver_id: REF_FINANCE_CONTRACT_ID,
    actions: [
      functionCallAction(
        "remove_liquidity",
        {
          pool_id: poolId,
          shares,
          min_amounts: minAmounts,
        },
        ONE_YOCTO,
        tGas(100),
      ),
    ],
  },
});

export const buildRefWithdrawDepositRequest = ({
  tokenId,
  amount,
}: {
  tokenId: string;
  amount: string;
}): MultisigRequestPayload => ({
  request: {
    receiver_id: REF_FINANCE_CONTRACT_ID,
    actions: [
      functionCallAction(
        "withdraw",
        {
          token_id: tokenId,
          amount,
          unregister: false,
        },
        ONE_YOCTO,
        tGas(200),
      ),
    ],
  },
});

export const buildFtStorageDepositRequest = ({
  tokenId,
  accountId,
}: {
  tokenId: string;
  accountId: string;
}): MultisigRequestPayload => ({
  request: {
    receiver_id: tokenId,
    actions: [
      functionCallAction(
        "storage_deposit",
        {
          account_id: accountId,
          registration_only: false,
        },
        FT_STORAGE_DEPOSIT,
        tGas(50),
      ),
    ],
  },
});

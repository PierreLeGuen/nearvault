import { parseNearAmount } from "near-api-js/lib/utils/format";
import { type FungibleTokenMetadata } from "~/lib/ft/contract";

export const BURROW_CONTRACT_ID = "contract.main.burrow.near";
export const REF_FINANCE_CONTRACT_ID = "v2.ref-finance.near";

const T_GAS = 1000000000000;
const ONE_YOCTO = "1";
const FT_STORAGE_DEPOSIT = parseNearAmount("0.005") ?? "0";

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

/* eslint-disable @typescript-eslint/require-await */
import BigNumber from "bignumber.js";
import type * as naj from "near-api-js";
import { formatNearAmount } from "near-api-js/lib/utils/format";
import {
  BURROW_CONTRACT_ID,
  REF_FINANCE_CONTRACT_ID,
} from "~/lib/defi/requests";
import {
  initFungibleTokenContract,
  type FungibleTokenContract,
} from "~/lib/ft/contract";
import { type LockupContract } from "~/lib/lockup/contract";
import {
  MultiSigRequestActionType,
  type MultiSigAction,
  type MultisigRequest,
} from "~/lib/multisig/contract";
import {
  NEW_MULTISIG_HASH,
  summarizeDeployAction,
} from "~/lib/multisig/upgrade";

export type explanation = {
  full_description: string;
  short_description?: string;
  actual_receiver?: string;
};

// new definitnon with multisig request and explanation Multisig & Explanation
export type RequestRow = {
  request: MultisigRequest;
  explanations: explanation[];
  actual_receiver: string;
};

// Action is the action request done from the multisig contract.
// multisig_call_receiver is the receiver of the action.
export async function explainAction(
  action: MultiSigAction,
  to: string,
  from: string,
  getNearConnection: () => Promise<naj.Near>,
): Promise<explanation> {
  const c = await getNearConnection();
  c.connection;
  switch (action.type) {
    case MultiSigRequestActionType.CreateAccount:
      return {
        full_description: `Creates a new account on behalf of the multisig contract.`,
        short_description: `Creates Account ${to}`,
      };

    case MultiSigRequestActionType.DeployContract:
      if (to === from) {
        const summary = summarizeDeployAction(action);
        if (summary.ok && summary.codeHash === NEW_MULTISIG_HASH) {
          return {
            full_description: `Upgrades the multisig contract on ${from} by deploying the verified security patch.`,
            short_description: `Upgrade Multisig Contract`,
          };
        }
        if (summary.ok) {
          return {
            full_description: `Deploys contract code to self (code hash: ${summary.codeHash}).`,
            short_description: `Deploy Contract Code to Multisig`,
          };
        }
        return {
          full_description: `Deploys contract code to self (unverified).`,
          short_description: `Deploy Contract Code to Multisig`,
        };
      }
      return {
        full_description: `Deploys a contract to ${to} with the provided code.`,
        short_description: `Deploy Contract`,
      };

    case MultiSigRequestActionType.AddMember:
      return {
        full_description: `Adds a new member with the public key: ${action.member.public_key} to ${to}.`,
        short_description: `Add Member`,
      };

    case MultiSigRequestActionType.DeleteMember:
      return {
        full_description: `Removes a member with the public key: ${action.member.public_key} from ${to}.`,
        short_description: `Delete Member`,
      };

    case MultiSigRequestActionType.AddKey:
      return {
        full_description: `Adds a new key with the public key: ${action.public_key} to ${to}.`,
        short_description: `Adds Key to ${to}`,
      };

    case MultiSigRequestActionType.SetNumConfirmations:
      return {
        full_description: `Sets the number of confirmations required for a multisig request to: ${action.num_confirmations}.`,
        short_description: `Set Confirmations`,
      };

    case MultiSigRequestActionType.SetActiveRequestsLimit:
      return {
        full_description: `Sets the limit for active (unconfirmed) requests to: ${action.active_requests_limit}.`,
        short_description: `Set Request Limit`,
      };

    case MultiSigRequestActionType.Transfer:
      return {
        full_description: `Transfers ${formatNearAmount(
          action.amount,
        )}Ⓝ from ${from} to ${to}.`,
        short_description: `Transfer ${formatNearAmount(
          action.amount,
        )}Ⓝ to ${to}`,
      };

    case MultiSigRequestActionType.NearEscrowTransfer:
      return {
        full_description: `Transfers ${formatNearAmount(
          action.amount,
        )}Ⓝ from ${from} to the receiver: ${
          action.receiver_id
        } with the label: ${action.label}. Transaction is ${
          action.is_cancellable ? "" : "not "
        }cancellable.`,
        short_description: `Escrow Transfer ${formatNearAmount(
          action.amount,
        )}Ⓝ to ${action.receiver_id}`,
      };

    case MultiSigRequestActionType.FTEscrowTransfer:
      return {
        full_description: `Transfers ${formatNearAmount(
          action.amount,
        )}Ⓝ of the token: ${action.token_id} from ${from} to the receiver: ${
          action.receiver_id
        } with the label: ${action.label}. Transaction is ${
          action.is_cancellable ? "" : "not "
        }cancellable.`,
        short_description: `FT Escrow Transfer ${formatNearAmount(
          action.amount,
        )}Ⓝ to ${action.receiver_id}`,
      };

    case MultiSigRequestActionType.FunctionCall:
      let desc = `The deposit for this function call is: ${formatNearAmount(
        action.deposit,
      )}Ⓝ and the gas limit is: ${Number(action.gas) / 10 ** 12} TGas.`;
      let actual_receiver = "";

      const methodDescription = methodDescriptions[action.method_name];
      if (!methodDescription) {
        return {
          full_description: desc,
          short_description: desc,
        };
      }
      // If args are available and methodDescription has a processArgs function, use it
      if (action.args && methodDescription.getExplanation) {
        const parsedArgs = parseFunctionCallArgs(action.args) as MethodArgs;
        const argsDescription = await methodDescription.getExplanation(
          parsedArgs,
          to,
          from,
          await c.account(""),
        );
        desc = `${argsDescription.desc} ` + desc;
        actual_receiver = argsDescription.fnReceiverId;
      }

      return {
        full_description: desc,
        short_description: desc,
        actual_receiver: actual_receiver,
      };

    case MultiSigRequestActionType.DeleteKey:
      return {
        full_description: `Deletes a key with the public key: ${action.public_key} from ${from} multisig contract.`,
        short_description: `Delete Key: ${action.public_key}`,
      };

    default:
      return {
        full_description: "",
        short_description: "",
      };
  }
}

// Lockup Contract
type TransferParams = Parameters<LockupContract["transfer"]>[0];
type AddFullAccessKeyParams = Parameters<
  LockupContract["add_full_access_key"]
>[0];
type UnstakeParams = Parameters<LockupContract["unstake"]>[0];
type WithdrawFromStakingPoolParams = Parameters<
  LockupContract["withdraw_from_staking_pool"]
>[0];
type DepositAndStakeParams = Parameters<LockupContract["deposit_and_stake"]>[0];
type DepositToStakingPoolParams = Parameters<
  LockupContract["deposit_to_staking_pool"]
>[0];
type SelectStakingPoolParams = Parameters<
  LockupContract["select_staking_pool"]
>[0];

// Fungible Token Contract
type FtTransferParams = Parameters<FungibleTokenContract["ft_transfer"]>[0];
type FtTransferCallParams = Parameters<
  FungibleTokenContract["ft_transfer_call"]
>[0];
type ExecuteWithPythParams = {
  actions: Array<{
    DecreaseCollateral?: {
      token_id: string;
      amount?: string;
      max_amount?: string;
    };
    Withdraw?: {
      token_id: string;
      amount?: string;
      max_amount?: string;
    };
  }>;
};
type RefRemoveLiquidityParams = {
  pool_id: number | string;
  shares: string;
  min_amounts?: string[];
};
type RefWithdrawParams = {
  token_id?: string;
  amount?: string;
  unregister?: boolean;
};
type StorageDepositParams = {
  account_id?: string;
  registration_only?: boolean;
};

type MethodArgs =
  | TransferParams
  | AddFullAccessKeyParams
  | UnstakeParams
  | WithdrawFromStakingPoolParams
  | DepositAndStakeParams
  | DepositToStakingPoolParams
  | SelectStakingPoolParams
  | FtTransferParams
  | FtTransferCallParams
  | ExecuteWithPythParams
  | RefRemoveLiquidityParams
  | RefWithdrawParams
  | StorageDepositParams;

type fnCallDetails = {
  desc: string;
  fnReceiverId: string | undefined;
};

const parseFunctionCallArgs = (args: unknown) => {
  if (typeof args !== "string") return args;

  try {
    return JSON.parse(Buffer.from(args, "base64").toString("utf8")) as unknown;
  } catch {
    try {
      return JSON.parse(args) as unknown;
    } catch {
      return {};
    }
  }
};

const trimFormattedAmount = (amount: string) => {
  return amount.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
};

const formatTokenAmount = async (
  nearConnection: naj.Account,
  tokenId: string,
  amount: string | undefined,
  decimalsOverride?: number,
) => {
  const c = initFungibleTokenContract(nearConnection, tokenId);
  const metadata = await c.ft_metadata();
  if (!amount) {
    return metadata.symbol;
  }

  const decimals = decimalsOverride ?? metadata.decimals;
  const formattedAmount = new BigNumber(amount)
    .div(new BigNumber(10).pow(decimals))
    .decimalPlaces(6, BigNumber.ROUND_DOWN)
    .toFormat();

  return `${trimFormattedAmount(formattedAmount)} ${metadata.symbol}`;
};

const getBurrowAmountDecimals = async (
  nearConnection: naj.Account,
  tokenId: string,
) => {
  const c = initFungibleTokenContract(nearConnection, tokenId);
  const metadata = await c.ft_metadata();

  try {
    const asset = (await nearConnection.viewFunction({
      contractId: BURROW_CONTRACT_ID,
      methodName: "get_asset",
      args: { token_id: tokenId },
    })) as { config?: { extra_decimals?: number } };

    return metadata.decimals + (asset.config?.extra_decimals ?? 0);
  } catch {
    return metadata.decimals;
  }
};

const methodDescriptions: {
  [methodName: string]: {
    getExplanation: (
      args: MethodArgs,
      contract: string,
      from_account: string,
      near_connection: naj.Account,
    ) => Promise<fnCallDetails>;
  };
} = {
  execute_with_pyth: {
    getExplanation: async (
      args: MethodArgs,
      contract: string,
      from_account: string,
      near_connection: naj.Account,
    ) => {
      const executeArgs = args as ExecuteWithPythParams;
      const actions = executeArgs.actions ?? [];
      const decreaseCollateralAction = actions.find(
        (action) => action.DecreaseCollateral,
      )?.DecreaseCollateral;
      const withdrawAction = actions.find((action) => action.Withdraw)
        ?.Withdraw;

      if (contract !== BURROW_CONTRACT_ID || !withdrawAction) {
        return {
          desc: `Executes a Burrow action.`,
          fnReceiverId: undefined,
        };
      }

      const tokenId =
        withdrawAction.token_id ?? decreaseCollateralAction?.token_id ?? "";
      const amount =
        withdrawAction.max_amount ??
        withdrawAction.amount ??
        decreaseCollateralAction?.max_amount ??
        decreaseCollateralAction?.amount;
      const decimals = await getBurrowAmountDecimals(near_connection, tokenId);
      const formattedAmount = await formatTokenAmount(
        near_connection,
        tokenId,
        amount,
        decimals,
      );

      return {
        desc: decreaseCollateralAction
          ? `Withdraws ${formattedAmount} from Burrow collateral.`
          : `Withdraws ${formattedAmount} from Burrow supplied balance.`,
        fnReceiverId: from_account,
      };
    },
  },
  remove_liquidity: {
    getExplanation: async (args: MethodArgs) => {
      const removeLiquidityParams = args as RefRemoveLiquidityParams;
      return {
        desc: `Removes liquidity from Rhea pool #${removeLiquidityParams.pool_id}.`,
        fnReceiverId: REF_FINANCE_CONTRACT_ID,
      };
    },
  },
  remove_liquidity_by_tokens: {
    getExplanation: async (args: MethodArgs) => {
      const removeLiquidityParams = args as RefRemoveLiquidityParams;
      return {
        desc: `Removes liquidity from Rhea pool #${removeLiquidityParams.pool_id}.`,
        fnReceiverId: REF_FINANCE_CONTRACT_ID,
      };
    },
  },
  withdraw: {
    getExplanation: async (
      args: MethodArgs,
      contract: string,
      from_account: string,
      near_connection: naj.Account,
    ) => {
      const withdrawParams = args as RefWithdrawParams;
      if (contract !== REF_FINANCE_CONTRACT_ID || !withdrawParams.token_id) {
        return {
          desc: `Withdraws from ${contract}.`,
          fnReceiverId: from_account,
        };
      }

      const formattedAmount = await formatTokenAmount(
        near_connection,
        withdrawParams.token_id,
        withdrawParams.amount,
      );

      return {
        desc: `Withdraws ${formattedAmount} from Rhea internal deposits.`,
        fnReceiverId: from_account,
      };
    },
  },
  storage_deposit: {
    getExplanation: async (
      args: MethodArgs,
      contract: string,
      from_account: string,
      near_connection: naj.Account,
    ) => {
      const storageDepositParams = args as StorageDepositParams;
      const accountId = storageDepositParams.account_id ?? from_account;

      if (contract === REF_FINANCE_CONTRACT_ID) {
        return {
          desc: `Registers ${accountId} for Rhea internal deposit storage.`,
          fnReceiverId: accountId,
        };
      }

      try {
        const c = initFungibleTokenContract(near_connection, contract);
        const metadata = await c.ft_metadata();
        return {
          desc: `Registers ${accountId} to receive ${metadata.symbol}.`,
          fnReceiverId: accountId,
        };
      } catch {
        return {
          desc: `Registers ${accountId} for storage on ${contract}.`,
          fnReceiverId: accountId,
        };
      }
    },
  },
  // Lockup Contract
  add_full_access_key: {
    getExplanation: async (args: MethodArgs) => {
      const addFullAccessKeyParams = args as AddFullAccessKeyParams;
      return {
        desc: `Adds a new full access key: ${addFullAccessKeyParams.new_public_key}.`,
        fnReceiverId: undefined, // No receiver ID for this action
      };
    },
  },
  transfer: {
    getExplanation: async (args: MethodArgs, executed_from: string) => {
      const transferParams = args as TransferParams;
      return {
        desc: `Transfers ${formatNearAmount(
          transferParams.amount,
        )}Ⓝ from ${executed_from} to ${transferParams.receiver_id}.`,
        fnReceiverId: transferParams.receiver_id,
      };
    },
  },
  unstake: {
    getExplanation: async (args: MethodArgs) => {
      const unstakeParams = args as UnstakeParams;
      return {
        desc: `Unstakes ${formatNearAmount(unstakeParams.amount)}Ⓝ.`,
        fnReceiverId: undefined, // No specific receiver ID for unstaking
      };
    },
  },
  withdraw_from_staking_pool: {
    getExplanation: async (args: MethodArgs) => {
      const withdrawFromStakingPoolParams =
        args as WithdrawFromStakingPoolParams;
      return {
        desc: `Withdraws ${formatNearAmount(
          withdrawFromStakingPoolParams.amount,
        )}Ⓝ from the staking pool.`,
        fnReceiverId: undefined, // No specific receiver ID for this action
      };
    },
  },
  deposit_and_stake: {
    getExplanation: async () => {
      return {
        desc: `Stakes the attached deposit.`,
        fnReceiverId: undefined, // No specific receiver ID for this action
      };
    },
  },
  select_staking_pool: {
    getExplanation: async (args: MethodArgs, from: string) => {
      const selectStakingPoolParams = args as SelectStakingPoolParams;
      return {
        desc: `Selects staking pool ${selectStakingPoolParams.staking_pool_account_id} for lockup: ${from}.`,
        fnReceiverId: selectStakingPoolParams.staking_pool_account_id,
      };
    },
  },

  unselect_staking_pool: {
    getExplanation: async () => {
      return {
        desc: `Unselects the currently selected staking pool.`,
        fnReceiverId: undefined, // No specific receiver ID for this action
      };
    },
  },

  refresh_staking_pool_balance: {
    getExplanation: async () => {
      return {
        desc: `Refreshes the balance of the selected staking pool.`,
        fnReceiverId: undefined, // No specific receiver ID for this action
      };
    },
  },
  withdraw_all_from_staking_pool: {
    getExplanation: async () => {
      return {
        desc: `Withdraws all funds from the selected staking pool.`,
        fnReceiverId: undefined, // No specific receiver ID for this action
      };
    },
  },
  unstake_all: {
    getExplanation: async () => {
      return {
        desc: `Unstakes all tokens.`,
        fnReceiverId: undefined, // No specific receiver ID for this action
      };
    },
  },
  check_transfers_vote: {
    getExplanation: async () => {
      return {
        desc: `Checks the vote on transfers. If the voting contract returns "yes", transfers will be enabled. If the vote is "no", transfers will remain disabled.`,
        fnReceiverId: undefined, // No specific receiver ID for this action
      };
    },
  },
  // Fungible Token Contract
  ft_transfer: {
    getExplanation: async (
      args: MethodArgs,
      contract: string,
      from_account: string,
      near_connection: naj.Account,
    ) => {
      const c = initFungibleTokenContract(near_connection, contract);
      const metadata = await c.ft_metadata();
      const ftTransferParams = args as FtTransferParams;
      return {
        desc: `Transfers ${(
          parseInt(ftTransferParams.amount) /
          10 ** metadata.decimals
        ).toLocaleString()} ${metadata.symbol}.`,
        fnReceiverId: ftTransferParams.receiver_id,
      };
    },
  },

  ft_transfer_call: {
    getExplanation: async (
      args: MethodArgs,
      contract: string,
      from_account: string,
      near_connection: naj.Account,
    ) => {
      const c = initFungibleTokenContract(near_connection, contract);
      const metadata = await c.ft_metadata();
      const ftTransferCallParams = args as FtTransferCallParams;
      return {
        desc: `Transfers ${(
          parseInt(ftTransferCallParams.amount) /
          10 ** metadata.decimals
        ).toLocaleString()} ${metadata.symbol}. ${
          ftTransferCallParams.msg.length > 0
            ? `Message: ${ftTransferCallParams.msg}.`
            : ""
        }`,
        fnReceiverId: ftTransferCallParams.receiver_id,
      };
    },
  },
};

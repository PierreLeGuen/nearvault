/* eslint-disable @typescript-eslint/require-await */
import type * as naj from "near-api-js";
import { formatNearAmount } from "near-api-js/lib/utils/format";
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
        const parsedArgs = action.args as unknown as MethodArgs;
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

type MethodArgs =
  | TransferParams
  | AddFullAccessKeyParams
  | UnstakeParams
  | WithdrawFromStakingPoolParams
  | DepositAndStakeParams
  | DepositToStakingPoolParams
  | SelectStakingPoolParams
  | FtTransferParams
  | FtTransferCallParams;

type fnCallDetails = {
  desc: string;
  fnReceiverId: string | undefined;
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
    getExplanation: async (args: MethodArgs, executed_from: string) => {
      const ftTransferCallParams = args as FtTransferCallParams;
      return {
        desc: `Transfers ${
          ftTransferCallParams.amount
        } tokens from ${executed_from} to ${
          ftTransferCallParams.receiver_id
        }, and makes a contract call. Memo: ${
          ftTransferCallParams.memo || "None"
        }, Message: ${ftTransferCallParams.msg}`,
        fnReceiverId: ftTransferCallParams.receiver_id,
      };
    },
  },
};

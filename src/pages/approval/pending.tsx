import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { type Wallet } from "@prisma/client";
import * as naj from "near-api-js";
import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import {
  FungibleTokenContract,
  initFungibleTokenContract,
} from "~/lib/ft/contract";
import { LockupContract } from "~/lib/lockup/contract";
import {
  MultiSigRequestActionType,
  initMultiSigContract,
  type MultiSigAction,
  type MultisigRequest,
} from "~/lib/multisig/contract";
import { assertCorrectMultisigWallet as assertCanSignForMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

type ApproveOrReject = "approve" | "reject";

const PendingRequests: NextPageWithLayout = () => {
  useSession({ required: true });
  const wallet = useWalletSelector();

  const { currentTeam, publicKey, newNearConnection } = usePersistingStore();
  const [pendingRequests, setPendingRequests] = useState<
    Map<Wallet, Array<MultisigRequest>>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState(new Map());
  if (!currentTeam) {
    throw new Error("No current team");
  }
  const [explanations, setExplanations] = useState<Map<string, string>>(
    new Map()
  );

  const wallets =
    api.teams.getWalletsForTeam.useQuery({ teamId: currentTeam.id }).data ??
    null;

  const approveOrRejectRequest = async (
    multisig_wallet: Wallet,
    request: MultisigRequest,
    kind: ApproveOrReject
  ) => {
    // if (!request.request_id) {
    //   throw new Error("No request id");
    // }

    try {
      setLoadingState((prev) => new Map(prev.set(request.request_id, kind)));

      try {
        await assertCanSignForMultisigWallet(
          wallet,
          multisig_wallet.walletAddress
        );
      } catch (e) {
        toast.error((e as Error).message);
        return;
      }

      wallet.selector.setActiveAccount(multisig_wallet.walletAddress);
      const w = await wallet.selector.wallet();
      const res = await toast.promise(
        w.signAndSendTransaction({
          receiverId: multisig_wallet.walletAddress,
          actions: [
            {
              type: "FunctionCall",
              params: {
                gas: "300000000000000",
                deposit: "0",
                methodName: kind === "approve" ? "confirm" : "delete_request",
                args: {
                  request_id: request.request_id,
                },
              },
            },
          ],
        }),
        {
          pending: "Check your wallet to approve the request",
          success: {
            render: (data) => {
              if (!data.data) {
                return `Successfully sent request to the multisig wallet`;
              }
              return (
                <span>
                  Successfully sent request to the multisig wallet, transaction
                  id:{" "}
                  <a
                    href={`https://nearblocks.io/txns/${data.data.transaction_outcome.id}`}
                    target="_blank"
                    className="font-bold underline"
                  >
                    {data.data.transaction_outcome.id}
                  </a>
                  `
                </span>
              );
            },
          },
          error: {
            render: (err) => {
              return `Failed to send transaction: ${
                (err.data as Error).message
              }`;
            },
          },
        }
      );

      if (kind === "reject") {
        const updatedRequests = new Map(pendingRequests);
        const walletRequests = updatedRequests.get(multisig_wallet);
        const remainingRequests = walletRequests!.filter(
          (r) => r.request_id !== request.request_id
        );
        updatedRequests.set(multisig_wallet, remainingRequests);

        setPendingRequests(updatedRequests);
      }
      if (kind === "approve") {
        const updatedRequests = new Map(pendingRequests);
        const walletRequests = updatedRequests.get(multisig_wallet);
        const remainingRequests = walletRequests!.filter((r) => {
          if (r.request_id !== request.request_id) {
            return true;
          }
          if (publicKey) {
            request.confirmations.push(publicKey.toString());
          }
          if (
            request.confirmations.length + 1 >=
            request.requiredConfirmations
          ) {
            return false;
          }
          return true;
        });
        updatedRequests.set(multisig_wallet, remainingRequests);
        setPendingRequests(updatedRequests);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingState((prev) => new Map(prev.set(request.request_id, "idle")));
    }
  };

  // Action is the action request done from the multisig contract.
  // multisig_call_receiver is the receiver of the action.
  async function explainAction(
    action: MultiSigAction,
    to: string,
    from: string
  ): Promise<string> {
    const c = await newNearConnection();
    c.connection;
    switch (action.type) {
      case MultiSigRequestActionType.CreateAccount:
        return `Creates a new account on behalf of the multisig contract.`;

      case MultiSigRequestActionType.DeployContract:
        return `Deploys a contract to ${from} with the provided code.`;

      case MultiSigRequestActionType.AddMember:
        return `Adds a new member with the public key: ${action.member.public_key} to ${from} multisig contract.`;

      case MultiSigRequestActionType.DeleteMember:
        return `Removes a member with the public key: ${action.member.public_key} from ${from}.`;

      case MultiSigRequestActionType.AddKey:
        return `Adds a new key with the public key: ${action.public_key} to ${from} multisig contract.`;

      case MultiSigRequestActionType.SetNumConfirmations:
        return `Sets the number of confirmations required for a multisig request to: ${action.num_confirmations}.`;

      case MultiSigRequestActionType.SetActiveRequestsLimit:
        return `Sets the limit for active (unconfirmed) requests to: ${action.active_requests_limit}.`;

      case MultiSigRequestActionType.Transfer:
        return `Transfers ${formatNearAmount(
          action.amount
        )}Ⓝ from ${from} to ${to}.`;

      case MultiSigRequestActionType.NearEscrowTransfer:
        return `Transfers ${formatNearAmount(
          action.amount
        )}Ⓝ from ${from} to the receiver: ${
          action.receiver_id
        } with the label: ${action.label}. Transaction is ${
          action.is_cancellable ? "" : "not "
        }cancellable.`;

      case MultiSigRequestActionType.FTEscrowTransfer:
        return `Transfers ${formatNearAmount(action.amount)}Ⓝ of the token: ${
          action.token_id
        } from ${from} to the receiver: ${action.receiver_id} with the label: ${
          action.label
        }. Transaction is ${action.is_cancellable ? "" : "not "}cancellable.`;

      case MultiSigRequestActionType.FunctionCall:
        let desc = `The deposit for this function call is: ${formatNearAmount(
          action.deposit
        )}Ⓝ and the gas limit is: ${Number(action.gas) / 10 ** 12} TGas.`;

        const methodDescription = methodDescriptions[action.method_name];
        if (!methodDescription) {
          return desc;
        }
        // If args are available and methodDescription has a processArgs function, use it
        if (action.args && methodDescription.getExplanation) {
          const parsedArgs = action.args as unknown as MethodArgs;
          const argsDescription = await methodDescription.getExplanation(
            parsedArgs,
            to,
            await c.account("")
          );
          desc = `${argsDescription} ` + desc;
        }

        return desc;
      case MultiSigRequestActionType.DeleteKey:
        return `Deletes a key with the public key: ${action.public_key} from ${from} multisig contract.`;

      default:
        return "";
    }
  }

  useEffect(() => {
    const connectionConfig = {
      networkId: "mainnet",
      keyStore: new naj.keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: "https://rpc.mainnet.near.org",
      walletUrl: "https://wallet.mainnet.near.org",
      helperUrl: "https://helper.mainnet.near.org",
      explorerUrl: "https://explorer.mainnet.near.org",
    };

    const fetchPendingRequests = async () => {
      setLoading(true);

      if (!wallets) {
        return;
      }

      const tempPendingRequests = new Map();
      const _explanations: Map<string, string> = new Map();

      for (const wallet of wallets) {
        try {
          const nearConnection = await naj.connect(connectionConfig);
          const walletConnection = new naj.WalletConnection(nearConnection, "");
          const c = initMultiSigContract(
            walletConnection.account(),
            wallet.walletAddress
          );
          const request_ids = await c.list_request_ids();
          const numConfirmations = await c.get_num_confirmations();
          request_ids.sort((a, b) => Number(b) - Number(a));

          const requestPromises = request_ids.map(async (request_id) => {
            const request = await c.get_request({ request_id: request_id });
            const confirmations = await c.get_confirmations({
              request_id: request_id,
            });
            return {
              ...request,
              request_id,
              confirmations: confirmations,
              requiredConfirmations: numConfirmations,
              actions: request.actions.map((action) => {
                if (action.type === MultiSigRequestActionType.FunctionCall) {
                  let a = action.args;
                  try {
                    const b = JSON.parse(
                      Buffer.from(action.args, "base64").toString("utf8")
                    ) as string;
                    a = b;
                  } catch (e) {
                    console.log(e);
                  }
                  return {
                    ...action,
                    args: a,
                  };
                }
                return action;
              }),
            };
          });

          const requests = await Promise.all(requestPromises);
          for (const request of requests) {
            for (let index = 0; index < request.actions.length; index++) {
              const action = request.actions[index];
              const explanation = await explainAction(
                action!,
                request.receiver_id,
                wallet.walletAddress
              );
              _explanations.set(
                wallet.walletAddress +
                  request.request_id.toString() +
                  index.toString(),
                explanation
              );
            }
          }
          tempPendingRequests.set(wallet, requests);
        } catch (e) {
          console.log(e);
        }
      }
      setPendingRequests(tempPendingRequests);
      setExplanations(_explanations);
      setLoading(false);
    };

    if (wallets) {
      fetchPendingRequests().catch(console.error);
    }
  }, [wallets]);

  const alreadyApproved = (confirmations: string[], publicKey: string) => {
    return confirmations.some((c) => c === publicKey);
  };

  return (
    <div className="prose p-4">
      <h1>Pending requests</h1>
      {loading && <p>Loading...</p>}
      {!loading && pendingRequests.size === 0 && <p>No pending requests.</p>}
      {Array.from(pendingRequests).map(([wallet, requests]) =>
        requests.length > 0 ? (
          <div key={wallet.id} className="mb-2 border-gray-200 p-2">
            <h2 className="text-md mb-1 font-bold">
              Wallet ID: {wallet.walletAddress}
            </h2>
            <h3 className="mb-1 text-sm font-bold">Requests:</h3>
            {requests.map((request: MultisigRequest, index) => (
              <div
                key={index}
                className="mb-1 rounded border-2 border-gray-200 p-1"
              >
                <h4 className="mb-1 text-xs font-bold">
                  Request {request.request_id}:
                </h4>
                <div className="">Receiver ID: {request.receiver_id}</div>
                <div>
                  <div>
                    Approvals: {request.confirmations.length} voter
                    {request.confirmations.length > 1 ? "s" : ""} approved.{" "}
                    {request.requiredConfirmations} vote
                    {request.requiredConfirmations > 1 ? "s" : ""} needed.
                  </div>
                  <div>
                    {request.confirmations.map((confirmation, index) => (
                      <div key={index}>
                        {index + 1}. {confirmation}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mb-1 text-xs">Actions:</p>
                <ul className="text-xs">
                  {request.actions.map((action, index) => (
                    <li key={index}>
                      <b>Action {index + 1}:</b>
                      <pre className="text-xs">
                        {JSON.stringify(action, null, 2)}
                      </pre>
                      {(() => {
                        const key =
                          wallet.walletAddress +
                          request.request_id.toString() +
                          index.toString();

                        const e = explanations.get(key);
                        console.log(e);
                        return e;
                      })()}
                    </li>
                  ))}
                </ul>
                <div className="my-2 flex justify-end space-x-4">
                  <button
                    type="button"
                    disabled={
                      (loadingState.get(request.request_id) !== undefined &&
                        loadingState.get(request.request_id) !== "idle") ||
                      alreadyApproved(
                        request.confirmations,
                        publicKey?.toString() || ""
                      )
                    }
                    onClick={() => {
                      approveOrRejectRequest(wallet, request, "approve").catch(
                        console.error
                      );
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  >
                    {loadingState.get(request.request_id) === "approve" ? (
                      <>
                        <CheckIcon className="mr-2 h-4 w-4" />
                        <span>Approving...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="mr-2 h-4 w-4" />
                        <span>
                          {alreadyApproved(
                            request.confirmations,
                            publicKey?.toString() || ""
                          )
                            ? "Already approved"
                            : "Approve"}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={
                      loadingState.get(request.request_id) !== undefined &&
                      loadingState.get(request.request_id) !== "idle"
                    }
                    onClick={() => {
                      approveOrRejectRequest(wallet, request, "reject").catch(
                        console.error
                      );
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    {loadingState.get(request.request_id) === "reject" ? (
                      <>
                        <XMarkIcon className="mr-2 h-4 w-4" />
                        <span>Rejecting...</span>
                      </>
                    ) : (
                      <>
                        <XMarkIcon className="mr-2 h-4 w-4" />
                        <span>Reject</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
};

PendingRequests.getLayout = getSidebarLayout;
export default PendingRequests;

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
const methodDescriptions: {
  [methodName: string]: {
    getExplanation: (
      args: MethodArgs,
      executed_from: string,
      near_connection: naj.Account
    ) => Promise<string>;
  };
} = {
  // Lockup Contract
  add_full_access_key: {
    getExplanation: async (args: MethodArgs) => {
      const addFullAccessKeyParams = args as AddFullAccessKeyParams;
      return Promise.resolve(
        `Adds a new full access key: ${addFullAccessKeyParams.new_public_key}.`
      );
    },
  },
  transfer: {
    getExplanation: async (args: MethodArgs, executed_from: string) => {
      const transferParams = args as TransferParams;
      return Promise.resolve(
        `Transfers ${formatNearAmount(
          transferParams.amount
        )}Ⓝ from ${executed_from} to ${transferParams.receiver_id}.`
      );
    },
  },
  unstake: {
    getExplanation: async (args: MethodArgs) => {
      const unstakeParams = args as UnstakeParams;
      return Promise.resolve(
        `Unstakes ${formatNearAmount(unstakeParams.amount)}Ⓝ.`
      );
    },
  },
  withdraw_from_staking_pool: {
    getExplanation: async (args: MethodArgs) => {
      const withdrawFromStakingPoolParams =
        args as WithdrawFromStakingPoolParams;
      return Promise.resolve(
        `Withdraws ${formatNearAmount(
          withdrawFromStakingPoolParams.amount
        )}Ⓝ from the staking pool.`
      );
    },
  },
  deposit_and_stake: {
    getExplanation: async (args: MethodArgs) => {
      const depositAndStakeParams = args as DepositAndStakeParams;
      return Promise.resolve(
        `Deposits and stakes ${formatNearAmount(
          depositAndStakeParams.amount
        )}Ⓝ.`
      );
    },
  },
  select_staking_pool: {
    getExplanation: async (args: MethodArgs) => {
      const selectStakingPoolParams = args as SelectStakingPoolParams;
      return Promise.resolve(
        `Selects staking pool with account ID: ${selectStakingPoolParams.staking_pool_account_id}.`
      );
    },
  },
  unselect_staking_pool: {
    getExplanation: async () =>
      Promise.resolve(`Unselects the currently selected staking pool.`),
  },
  refresh_staking_pool_balance: {
    getExplanation: async () =>
      Promise.resolve(`Refreshes the balance of the selected staking pool.`),
  },
  withdraw_all_from_staking_pool: {
    getExplanation: async () =>
      Promise.resolve(`Withdraws all funds from the selected staking pool.`),
  },
  unstake_all: {
    getExplanation: async () => Promise.resolve(`Unstakes all tokens.`),
  },
  check_transfers_vote: {
    getExplanation: async () =>
      Promise.resolve(
        `Checks the vote on transfers. If the voting contract returns "yes", transfers will be enabled. If the vote is "no", transfers will remain disabled.`
      ),
  },
  // Fungible Token Contract
  ft_transfer: {
    getExplanation: async (
      args: MethodArgs,
      executed_from: string,
      near_connection: naj.Account
    ) => {
      const c = initFungibleTokenContract(near_connection, executed_from);
      const metadata = await c.ft_metadata();
      const ftTransferParams = args as FtTransferParams;
      return `Transfers ${(
        parseInt(ftTransferParams.amount) /
        10 ** metadata.decimals
      ).toLocaleString()} ${metadata.symbol} from ${executed_from} to ${
        ftTransferParams.receiver_id
      }. Memo: ${ftTransferParams.memo || "None"}.`;
    },
  },
  ft_transfer_call: {
    getExplanation: async (args: MethodArgs, executed_from: string) => {
      const ftTransferCallParams = args as FtTransferCallParams;
      return Promise.resolve(
        `Transfers ${
          ftTransferCallParams.amount
        } tokens from ${executed_from} to ${
          ftTransferCallParams.receiver_id
        }, and makes a contract call. Memo: ${
          ftTransferCallParams.memo || "None"
        }, Message: ${ftTransferCallParams.msg}`
      );
    },
  },
};

import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { type Wallet } from "@prisma/client";
import * as naj from "near-api-js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import MultisigViewContract, {
  MultiSigRequestActionType,
  type MultisigRequest,
} from "~/lib/multisig/view";
import { assertCorrectMultisigWallet as assertCanSignForMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

type ApproveOrReject = "approve" | "reject";

const PendingRequests: NextPageWithLayout = () => {
  useSession({ required: true });
  const wallet = useWalletSelector();

  const { currentTeam, publicKey } = usePersistingStore();
  const [pendingRequests, setPendingRequests] = useState<
    Map<Wallet, Array<MultisigRequest>>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState(new Map());
  if (!currentTeam) {
    throw new Error("No current team");
  }

  const wallets =
    api.teams.getWalletsForTeam.useQuery({ teamId: currentTeam.id }).data ??
    null;

  const approveOrRejectRequest = async (
    multisig_wallet: Wallet,
    request: MultisigRequest,
    kind: ApproveOrReject
  ) => {
    if (!request.request_id) {
      throw new Error("No request id");
    }

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

  // const updateTransactionHisory = async () => {
  //   api.teams.insertTransferHistory
  // }

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
      for (const wallet of wallets) {
        try {
          const nearConnection = await naj.connect(connectionConfig);
          const walletConnection = new naj.WalletConnection(nearConnection, "");
          const c = MultisigViewContract(
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
          tempPendingRequests.set(wallet, await Promise.all(requestPromises));
        } catch (e) {
          console.log(e);
        }
      }
      setPendingRequests(tempPendingRequests);
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
                        <span>Approve</span>
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

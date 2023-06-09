import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { type Wallet } from "@prisma/client";
import * as naj from "near-api-js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import MultisigViewContract, {
  MultiSigRequestActionType,
  type MultisigRequest,
} from "~/lib/multisig/view";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

type ApproveOrReject = "approve" | "reject";

const PendingRequests: NextPageWithLayout = () => {
  useSession({ required: true });
  const wallet = useWalletSelector();

  const { currentTeam } = usePersistingStore();
  const [pendingRequests, setPendingRequests] = useState<
    Map<Wallet, Array<MultisigRequest>>
  >(new Map());

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
    console.log(request);

    if (!request.request_id) {
      throw new Error("No request id");
    }

    wallet.selector.setActiveAccount(multisig_wallet.walletAddress);
    const w = await wallet.selector.wallet();

    await w.signAndSendTransaction({
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
    });

    console.log("deleting request");

    if (kind === "reject") {
      // Make a copy of the Map
      const updatedRequests = new Map(pendingRequests);

      // Get the current wallet's requests
      const walletRequests = updatedRequests.get(multisig_wallet);

      // Filter out the rejected request
      const remainingRequests = walletRequests!.filter(
        (r) => r.request_id !== request.request_id
      );

      // Update the Map
      updatedRequests.set(multisig_wallet, remainingRequests);

      // Update the state
      setPendingRequests(updatedRequests);
    }
  };

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
      console.log("Fetching pending requests");

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
          request_ids.sort((a, b) => Number(b) - Number(a));
          const requestPromises = request_ids.map((request_id) =>
            c.get_request({ request_id: request_id }).then((request) => {
              return {
                ...request,
                request_id,
                actions: request.actions.map((action) => {
                  if (action.type === MultiSigRequestActionType.FunctionCall) {
                    return {
                      ...action,
                      args: JSON.parse(
                        Buffer.from(action.args, "base64").toString("utf8")
                      ) as string,
                    };
                  }
                  return action;
                }),
              };
            })
          );
          tempPendingRequests.set(wallet, await Promise.all(requestPromises));
        } catch (e) {
          console.log(e);
        }
      }
      setPendingRequests(tempPendingRequests);
    };

    if (wallets) {
      fetchPendingRequests().catch(console.error);
    }
  }, [wallets]);

  return (
    <div className="prose p-4">
      <h1>Pending requests</h1>
      {Array.from(pendingRequests).map(([wallet, requests]) => (
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
              <p className="">Receiver ID: {request.receiver_id}</p>
              <p className="mb-1 text-xs">Actions:</p>
              <ul className="text-xs">
                {request.actions.map((action, index) => {
                  return (
                    <li key={index}>
                      <b>Action {index + 1}:</b>
                      <pre className="text-xs">
                        {JSON.stringify(action, null, 2)}
                      </pre>
                    </li>
                  );
                })}
              </ul>
              <div className="my-2 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log(`Approving request ${JSON.stringify(request)}`);
                    approveOrRejectRequest(wallet, request, "approve").catch(
                      console.error
                    );
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                >
                  <CheckIcon className="mr-2 h-4 w-4" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log(`Rejecting request ${index + 1}`);
                    approveOrRejectRequest(wallet, request, "reject").catch(
                      console.error
                    );
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  <XMarkIcon className="mr-2 h-4 w-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

PendingRequests.getLayout = getSidebarLayout;
export default PendingRequests;

import { type Wallet } from "@prisma/client";
import * as naj from "near-api-js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import MultisigViewContract, {
  MultiSigRequestActionType,
  type MultisigRequest,
} from "~/lib/multisig/view";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const PendingRequests: NextPageWithLayout = () => {
  useSession({ required: true });
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
      if (!wallets) {
        return;
      }
      const tempPendingRequests = new Map();
      for (const wallet of wallets) {
        const nearConnection = await naj.connect(connectionConfig);
        const walletConnection = new naj.WalletConnection(nearConnection, "");
        const c = MultisigViewContract(
          walletConnection.account(),
          wallet.walletAddress
        );
        const requests = await c.list_request_ids();
        const requestPromises = requests.map((id) =>
          c.get_request({ request_id: id }).then((request) => {
            return {
              ...request,
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
              <h4 className="mb-1 text-xs font-bold">Request {index + 1}:</h4>
              <p className="text-xs">Receiver ID: {request.receiver_id}</p>
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
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

PendingRequests.getLayout = getSidebarLayout;
export default PendingRequests;

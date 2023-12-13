import { type Wallet } from "@prisma/client";
import * as naj from "near-api-js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import HeaderTitle from "~/components/ui/header";
import { api } from "~/lib/api";
import {
  MultiSigRequestActionType,
  initMultiSigContract,
} from "~/lib/multisig/contract";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { RequestRow, explainAction } from "./lib/explain";
import { RequestsTable } from "~/components/approval/pending/RequestsTable/RequestsTable";
import { useStoreActions } from "easy-peasy";

export type ApproveOrReject = "approve" | "reject";

const Pending: NextPageWithLayout = () => {
  useSession({ required: true });
  const isAccountConnected = useStoreActions(
    (store: any) => store.isAccountConnected,
  );
  const selectAccount = useStoreActions((store: any) => store.selectAccount);
  const onApproveOrRejectRequest = useStoreActions(
    (store: any) => store.pages.approval.pending.onApproveOrRejectRequest,
  );

  const { currentTeam, publicKey, newNearConnection } = usePersistingStore(); // TODO from where we take this publicKey?

  const [requests, setRequests] = useState<Map<Wallet, Array<RequestRow>>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);

  // TODO Does it work and don't break the useEffect? Also, we need to show some error message instead of break the app
  if (!currentTeam) {
    throw new Error("No current team");
  }

  const wallets =
    api.teams.getWalletsForTeam.useQuery({ teamId: currentTeam.id }).data ??
    null;

  const fetchWalletData = async (wallet: Wallet): Promise<RequestRow[]> => {
    try {
      // TODO rework to Account
      const near = await newNearConnection(); //////////////////////////////// UPDATE!
      const walletConnection = new naj.WalletConnection(near, ""); //////////////////////////////// UPDATE!

      const contract = initMultiSigContract(
        //////////////////////////////// UPDATE
        walletConnection.account(),
        wallet.walletAddress,
      );

      const request_ids = await contract.list_request_ids();
      const numConfirmations = await contract.get_num_confirmations();

      request_ids.sort((a, b) => Number(b) - Number(a));

      const requestPromises = request_ids.map(async (request_id) => {
        const request = await contract.get_request({ request_id: request_id });
        const confirmations = await contract.get_confirmations({
          request_id: request_id,
        });

        return {
          ...request,
          request_id: Number(request_id),
          confirmations: confirmations,
          requiredConfirmations: numConfirmations,
          actions: request.actions.map((action) => {
            if (action.type === MultiSigRequestActionType.FunctionCall) {
              let args = action.args;
              try {
                args = JSON.parse(
                  Buffer.from(action.args, "base64").toString("utf8"),
                ) as string;
              } catch (e) {
                console.log(e);
              }
              return {
                ...action,
                args,
              };
            }
            return action;
          }),
        };
      });

      const list: RequestRow[] = [];
      const requests = await Promise.all(requestPromises);

      for (const request of requests) {
        for (let index = 0; index < request.actions.length; index++) {
          const action = request.actions[index];
          const explanation = await explainAction(
            action!,
            request.receiver_id,
            wallet.walletAddress,
            newNearConnection,
          ).catch((e) => {
            console.error(e);
            return undefined;
          });
          list.push({
            request: request,
            actual_receiver:
              explanation?.actual_receiver || request.receiver_id,
            explanation: explanation!,
          });
        }
      }

      return list;
    } catch (e) {
      console.log(e);
      return [];
    }
  };

  const approveOrRejectRequest = async (
    multisigWallet: Wallet,
    requestId: number,
    kind: ApproveOrReject,
  ) => {
    const multisigAccountId = multisigWallet.walletAddress;

    if (!isAccountConnected(multisigAccountId)) {
      toast.error(
        `You need to connect ${multisigAccountId} before performing this action`,
      );
      return;
    }

    selectAccount(multisigAccountId);

    try {
      await toast.promise(
        onApproveOrRejectRequest({ multisigAccountId, requestId, kind }),
        {
          pending: "Check your wallet to approve the request",
          success: {
            render: (data: any) => {
              if (!data.data) {
                return `Request #${requestId} was ${
                  kind === "approve" ? "approved" : "rejected"
                }`;
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
            render: (err: any) =>
              `Failed to send transaction: ${(err.data as Error).message}`,
          },
        },
      );

      // If we store data in global store - we won't need to re-fetch this data cuz we have
      // all info for update - it helps keep the app fast
      const updatedRequests = new Map(requests);
      const updatedWalletRequests = await fetchWalletData(multisigWallet);
      updatedRequests.set(multisigWallet, updatedWalletRequests);
      setRequests(updatedRequests);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    const fetchPendingRequests = async () => {
      setLoading(true);

      if (!wallets) return;

      const walletPromises = wallets.map(async (wallet) => {
        const data = await fetchWalletData(wallet);
        return [wallet, data] as [Wallet, RequestRow[]];
      });

      const results = await Promise.all(walletPromises);
      const tempPendingRequests = new Map();

      results.forEach(([wallet, requestRow]) => {
        tempPendingRequests.set(wallet, requestRow);
      });

      setRequests(tempPendingRequests);
      setLoading(false);
    };

    if (wallets) fetchPendingRequests().catch(console.error);
  }, [wallets, newNearConnection]);

  return (
    <div className="flex flex-col gap-10 px-12 py-10">
      <HeaderTitle level="h1" text="Pending requests" />
      {loading && <p>Loading...</p>}
      {!loading && requests.size === 0 && <p>No pending requests.</p>}
      {!loading &&
        requests.size > 0 &&
        Array.from(requests).map(([wallet, _requests]) =>
          _requests.length === 0 ? null : (
            <div key={wallet.id} className="mb-2 border-gray-200 ">
              <h2 className="text-md mb-1 font-bold">
                Wallet ID: {wallet.walletAddress}
              </h2>
              <div>
                <RequestsTable
                  data={_requests}
                  wallet={wallet}
                  approveRejectFn={approveOrRejectRequest}
                  publicKey={publicKey || undefined}
                />
              </div>
            </div>
          ),
        )}
    </div>
  );
};

Pending.getLayout = getSidebarLayout;

export default Pending;

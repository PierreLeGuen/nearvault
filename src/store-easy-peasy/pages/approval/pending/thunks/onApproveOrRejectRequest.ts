// import { Wallet } from "@prisma/client";
// import { explainAction, RequestRow } from "~/pages/approval/lib/explain";
// import * as naj from "near-api-js";
// import {
//   initMultiSigContract,
//   MultiSigRequestActionType,
// } from "~/lib/multisig/contract";
// import { toast } from 'react-toastify';
// import { ApproveOrReject } from '~/pages/approval/pending';
// import { fetchWalletData } from '~/store-easy-peasy/pages/approval/pending/fetchWalletData';
import { thunk } from "easy-peasy";

export const onApproveOrRejectRequest = thunk(
  async (_actions, payload, { getStoreState, getStoreActions }) => {
    console.log("da");
    // { multisigAccountId, requestId, kind } = payload;
    // w.signAndSendTransaction({
    //   receiverId: multisigWallet.walletAddress,
    //   actions: [
    //     {
    //       type: "FunctionCall",
    //       params: {
    //         gas: "300000000000000",
    //         deposit: "0",
    //         methodName: kind === "approve" ? "confirm" : "delete_request",
    //         args: {
    //           request_id: requestId,
    //         },
    //       },
    //     },
    //   ],
    // })
  },
);

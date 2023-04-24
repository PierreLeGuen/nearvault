import bs58 from "bs58";
import { providers } from "near-api-js";
import { useState } from "react";
import Layout from "~/components/layout";
import { useWalletSelector } from "~/context/wallet";
import { viewLockupAccount } from "~/libs/front/lockup/lib/lockup";
import { calculateLockup } from "~/libs/lockup";
import { type NextPageWithLayout } from "../_app";
const ManageLockup: NextPageWithLayout = () => {
  const [account, setAccount] = useState("");
  const [accountError, setAccountError] = useState("");
  const { selector } = useWalletSelector();

  const getLockupInformation = async (account: string) => {
    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    try {
      console.log("getLockupInformation", account);
      const l = calculateLockup(account, "lockup.near");

      const r = await viewLockupAccount(l, provider);
      console.log(r);
      // r?
    } catch {
      setAccountError("Account not found");
    }
  };

  return (
    <div className="prose pl-4 pt-4">
      <h1>Manage Lockup</h1>
      <label className="block">
        <span>NEAR account (account or lockup)</span>
        <span className="flex flex-row">
          <input
            type="text"
            className="w-full rounded"
            placeholder="NEAR account or lockup"
            value={account || ""}
            onChange={(e) => {
              setAccount(e.target.value);
              setAccountError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void getLockupInformation(account);
              }
            }}
          />
          <button
            className="ml-4 rounded bg-blue-300 px-2 py-1 hover:bg-blue-400"
            onClick={() => {
              void getLockupInformation(account);
              setAccountError("");
            }}
          >
            View
          </button>
        </span>
      </label>
      {accountError && <p className="text-red-500">{accountError}</p>}
    </div>
  );
};

function prepareAccountId(data: string) {
  if (data.toLowerCase().endsWith(".near")) {
    return data
      .replace("@", "")
      .replace("https://wallet.near.org/send-money/", "")
      .toLowerCase();
  }
  if (data.length === 64 && !data.startsWith("ed25519:")) {
    return data;
  }
  let publicKey: Uint8Array;

  if (data.startsWith("NEAR")) {
    publicKey = bs58.decode(data.slice(4)).slice(0, -4);
  } else {
    publicKey = bs58.decode(data.replace("ed25519:", ""));
  }
  return Buffer.from(publicKey).toString("hex");
}

// async function lookup(inputAccId: string, options: nearAPI.ConnectConfig) {
//   const near = await nearAPI.connect(options);
//   let accountId = prepareAccountId(inputAccId);

//   let lockupAccountId = "",
//     lockupAccountBalance = 0,
//     ownerAccountBalance = 0,
//     lockupReleaseStartTimestamp = new BN(0),
//     lockupState = null,
//     lockedAmount = 0;

//   try {
//     let account = await near.account(accountId);
//     let state = await account.state();
//     ownerAccountBalance = state.amount;
//     ({ lockupAccountId, lockupAccountBalance, lockupState } =
//       await lookupLockup(near, accountId));
//   } catch (e) {}
// }

// interface LockupBalance {
//   lockupAccountId: string;
// }

// async function lookupLockup(near: nearAPI.Near, accountId: string) {
//   near.co;
//   const lockupAccountId = calculateLockup(accountId, "lockup.near");
//   try {
//     const lockupAccount = await near.account(lockupAccountId);
//     const lockupAccountBalance: unknown = await lockupAccount.viewFunction({
//       contractId: lockupAccountId,
//       methodName: "get_balance",
//       args: {},
//     });
//     const lockupState = await viewLockupState(near.connection, lockupAccountId);
//     // More details: https://github.com/near/core-contracts/pull/136
//     lockupState.hasBrokenTimestamp = [
//       "3kVY9qcVRoW3B5498SMX6R3rtSLiCdmBzKs7zcnzDJ7Q",
//       "DiC9bKCqUHqoYqUXovAnqugiuntHWnM3cAc7KrgaHTu",
//     ].includes((await lockupAccount.state()).code_hash);
//     return { lockupAccountId, lockupAccountBalance, lockupState };
//   } catch (error) {
//     console.log(error);
//     return {
//       lockupAccountId: `${lockupAccountId}${DOES_NOT_EXIST}`,
//       lockupAmount: 0,
//     };
//   }
// }

// export interface QueryResult {
//   block_hash: string;
//   block_height: number;
//   proof: unknown[];
//   values: Value[];
// }

// export interface Value {
//   key: string;
//   proof: unknown[];
//   value: string;
// }

// // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
// async function viewLockupState(
//   connection: nearAPI.Connection,
//   contractId: string
// ) {
//   const result: unknown = await connection.provider.query({
//     request_type: "view_state",
//     finality: "final",
//     account_id: contractId,
//     prefix_base64: "U1RBVEU=",
//   });
//   const res: QueryResult = result as QueryResult;
//   const value = Buffer.from(res?.values[0]?.value ?? "", "base64");
//   const reader = new nearAPI.utils.serialize.BinaryReader(value);
//   const owner = reader.readString();
//   const lockupAmount = reader.readU128();
//   let terminationWithdrawnTokens = reader.readU128().toString();
//   let lockupDuration = reader.readU64().toString();
//   let releaseDuration = readOption(
//     reader,
//     () => reader.read_u64().toString(),
//     "0"
//   );
//   let lockupTimestamp = readOption(
//     reader,
//     () => reader.read_u64().toString(),
//     "0"
//   );
//   let tiType = reader.read_u8();
//   let transferInformation;
//   if (tiType === 0) {
//     transferInformation = {
//       transfers_timestamp: reader.read_u64(),
//     };
//   } else {
//     transferInformation = {
//       transfer_poll_account_id: reader.read_string(),
//     };
//   }
//   let vestingType = reader.read_u8();
//   let vestingInformation;
//   switch (vestingType) {
//     case 1:
//       vestingInformation = {
//         vestingHash: reader.read_array(() => reader.read_u8()),
//       };
//       break;
//     case 2:
//       let start = reader.read_u64();
//       let cliff = reader.read_u64();
//       let end = reader.read_u64();
//       vestingInformation = { start, cliff, end };
//       break;
//     case 3:
//       let unvestedAmount = reader.read_u128();
//       let terminationStatus = reader.read_u8();
//       vestingInformation = { unvestedAmount, terminationStatus };
//       break;
//     default:
//       vestingInformation = "TODO";
//       break;
//   }

//   return {
//     owner,
//     lockupAmount: new BN(lockupAmount),
//     terminationWithdrawnTokens: new BN(terminationWithdrawnTokens),
//     lockupDuration: new BN(lockupDuration),
//     releaseDuration: new BN(releaseDuration),
//     lockupTimestamp: new BN(lockupTimestamp),
//     transferInformation,
//     vestingInformation,
//   };
// }

ManageLockup.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ManageLockup;

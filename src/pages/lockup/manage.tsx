import bs58 from "bs58";
import { providers } from "near-api-js";
import { useState } from "react";
import Layout from "~/components/layout";
import { useWalletSelector } from "~/context/wallet";
import { viewLockupAccount } from "~/libs/front/lockup/lib/lockup";
import { type AccountLockup } from "~/libs/front/lockup/types/types";
import { calculateLockup } from "~/libs/lockup";
import { type NextPageWithLayout } from "../_app";

const ManageLockup: NextPageWithLayout = () => {
  const [account, setAccount] = useState("");
  const [accountError, setAccountError] = useState("");
  const { selector } = useWalletSelector();
  const [lockupInformation, setLockupInformation] =
    useState<AccountLockup | null>(null);

  const getLockupInformation = async (account: string) => {
    const { network } = selector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    try {
      console.log("getLockupInformation", account);
      const l = calculateLockup(prepareAccountId(account), "lockup.near");

      const r = await viewLockupAccount(l, provider);
      console.log(r);
      setLockupInformation(r);
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
      {lockupInformation && <p>{showLockupInfo(lockupInformation)}</p>}
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

const showLockupInfo = (lockupInfo: AccountLockup) => {
  return (
    <div className="grid">
      <div className="grid grid-cols-3">
        <div className="col-span-1">Account ID</div>
        <div>TODO</div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Lockup ID</div>
        <div>{lockupInfo.lockupAccountId}</div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Total Balance</div>
        <div>{lockupInfo.ownerAccountBalance.toString()}</div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Owners Balance</div>
        <div>{lockupInfo.ownerAccountBalance.toString()}</div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Liquid amount (unlocked + rewards)</div>
        <div>{lockupInfo.liquidAmount.toString()}</div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Vesting</div>
        <div>
          {lockupInfo.lockupState?.vestingInformation?.start?.toString() ?? ""}
        </div>
      </div>
    </div>
  );
};

ManageLockup.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ManageLockup;

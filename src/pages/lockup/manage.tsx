import BN from "bn.js";
import bs58 from "bs58";
import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useState } from "react";
import { getSidebarLayout } from "~/components/layout";
import { useNearContext } from "~/context/near";
import { viewLockupAccount } from "~/libs/front/lockup/lib/lockup";
import {
  type AccountLockup,
  type VestingInformation,
} from "~/libs/front/lockup/types/types";
import { calculateLockup } from "~/libs/lockup";
import { type NextPageWithLayout } from "../_app";

const ManageLockup: NextPageWithLayout = () => {
  const [account, setAccount] = useState("");
  const [accountError, setAccountError] = useState("");
  const [lockupInformation, setLockupInformation] =
    useState<AccountLockup | null>(null);
  const provider = useNearContext().archival_provider;

  const getLockupInformation = async (account: string) => {
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
      {lockupInformation && <div>{showLockupInfo(lockupInformation)}</div>}
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
  const getVestingDetails = (vesting: VestingInformation | undefined) => {
    console.log("getVestingDetails", vesting);

    if (!vesting) {
      return (
        <>
          <h2 className="prose">Vesting schedule</h2>
          <div>No vesting schedule</div>
        </>
      );
    }

    if (vesting.vestingHash) {
      return (
        <>
          <h2 className="prose">Vesting schedule</h2>
          <div className="grid grid-cols-3">
            <div className="col-span-1">Vesting Schedule</div>
            <div className="text-red-500">Private vesting</div>
          </div>
        </>
      );
    }

    if (!vesting.start || !vesting.end) {
      console.error("Invalid vesting schedule", vesting);

      return;
    }

    const start = new Date(vesting.start.divn(1000000).toNumber());
    const end = new Date(vesting.end.divn(1000000).toNumber());
    let cliff: Date | null = null;
    if (vesting.cliff) {
      cliff = new Date(vesting.cliff.divn(1000000).toNumber());
    }
    return (
      <>
        <h2 className="prose">Vesting schedule</h2>

        <div className="grid grid-cols-3">
          <div className="col-span-1">Start</div>
          <div>{start.toLocaleString()}</div>
        </div>
        {cliff && (
          <div className="grid grid-cols-3">
            <div className="col-span-1">Cliff</div>
            <div> {cliff.toLocaleString()}</div>
          </div>
        )}
        <div className="grid grid-cols-3">
          <div className="col-span-1">End</div>
          <div>{end.toLocaleString()}</div>
        </div>
      </>
    );
  };

  const getLinearVestingDetails = (
    start: BN | undefined,
    duration: BN | undefined
  ) => {
    if (!start || !duration || duration.isZero()) {
      return (
        <>
          <h2 className="prose">Linear vesting</h2>
          <div>No linear release</div>
        </>
      );
    }
    console.log("getLinearVestingDetails", start);
    console.log(duration.toString());

    const startDate = new Date(start.divn(1000000).toNumber());

    //  add duration to start date, duration is in days
    const endDate = new Date(
      startDate.getTime() + duration.toNumber() * 24 * 60 * 60 * 1000
    );

    return (
      <>
        <h2 className="prose">Linear vesting</h2>
        <div className="grid grid-cols-3">
          <div className="col-span-1">Start</div>
          <div>{startDate.toLocaleString()}</div>
        </div>
        <div className="grid grid-cols-3">
          <div className="col-span-1">End</div>
          <div>{endDate.toLocaleString()}</div>
        </div>
      </>
    );
  };

  return (
    <div className="mt-4 grid">
      <div className="grid grid-cols-3">
        <div className="col-span-1">Account ID</div>
        <div>{lockupInfo.lockupState.owner}</div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Lockup ID</div>
        <div>{lockupInfo.lockupAccountId}</div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Lockup Amount</div>
        <div>
          {formatNearAmount(lockupInfo.lockupState.lockupAmount.toString(), 2) +
            " Ⓝ"}
        </div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Locked Balance</div>
        <div>
          {formatNearAmount(lockupInfo.lockedAmount.toString(), 2) + " Ⓝ"}
        </div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Liquid amount (unlocked + rewards)</div>
        <div>
          {formatNearAmount(lockupInfo.liquidAmount.toString(), 2) + " Ⓝ"}
        </div>
      </div>
      {getVestingDetails(lockupInfo.lockupState.vestingInformation)}
      {getLinearVestingDetails(
        lockupInfo.lockupState.lockupTimestamp,
        lockupInfo.lockupState.releaseDuration
      )}
    </div>
  );
};

ManageLockup.getLayout = getSidebarLayout;

export default ManageLockup;

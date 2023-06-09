import type BN from "bn.js";
import bs58 from "bs58";
import { connect } from "near-api-js";
import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { CancelLockupDialog } from "~/components/CancelLockupDialog";
import { getSidebarLayout } from "~/components/Layout";
import { useNearContext } from "~/context/near";
import { useWalletSelector } from "~/context/wallet";
import { calculateLockup, viewLockupAccount } from "~/lib/lockup/lockup";
import {
  type AccountLockup,
  type FromStateVestingInformation,
} from "~/lib/lockup/types";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const ManageLockup: NextPageWithLayout = () => {
  useSession({ required: true });

  const [account, setAccount] = useState("");
  const [accountError, setAccountError] = useState("");
  const [cancelLockupModalIsOpen, cancelSetIsOpen] = useState(false);

  const [lockupInformation, setLockupInformation] =
    useState<AccountLockup | null>(null);
  const provider = useNearContext().archival_provider;
  const store = usePersistingStore();
  const walletSelector = useWalletSelector();

  useEffect(() => {
    const getKeys = async () => {
      const c = await connect({
        networkId: "mainnet",
        nodeUrl: "https://rpc.mainnet.near.org",
      });
      // const m = new multisig.AccountMultisig(
      //   c.connection,
      //   "foundation.near",
      //   {}
      // );
      // const ks = await m.getAccessKeys();
      // console.log(ks);

      // ks.map((k) => {
      //   console.log(k.public_key);
      // });w
      const w = await walletSelector.selector.wallet();
    };
    void getKeys();
  }, []);

  const getLockupInformation = async (account: string) => {
    try {
      const l = calculateLockup(prepareAccountId(account), "lockup.near");
      const r = await viewLockupAccount(l, provider);
      setLockupInformation(r);
    } catch (e) {
      if (e) {
        setAccountError(
          `Error while retrieving account, err: ${JSON.stringify(e)}`
        );
      } else {
        setAccountError("Account not found");
      }
    }
  };

  const cancelLockupFn = async () => {
    const w = await walletSelector.selector.wallet();
    const res = await w.signAndSendTransaction({
      receiverId: "foundation.near",
      actions: [
        {
          type: "FunctionCall",
          params: {
            gas: "300000000000000",
            deposit: "0",
            methodName: "add_request",
            args: {
              request: {
                receiver_id: lockupInformation?.lockupAccountId,
                actions: [
                  {
                    type: "FunctionCall",
                    method_name: "terminate_vesting",
                    deposit: "0",
                    gas: "200000000000000",
                  },
                ],
              },
            },
          },
        },
      ],
    });

    console.log(res);
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
            onChange={(e) => {
              setAccount(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setAccountError("");
                void getLockupInformation(e.currentTarget.value);
              }
            }}
          />
          <button
            className="ml-4 rounded bg-blue-300 px-2 py-1 hover:bg-blue-400"
            onClick={() => {
              setAccountError("");
              void getLockupInformation(account);
            }}
          >
            View
          </button>
        </span>
      </label>
      {accountError && <p className="text-red-500">{accountError}</p>}
      {lockupInformation && (
        <>
          <div>{showLockupInfo(lockupInformation)}</div>
          <div>
            <div className="mt-4">
              <button
                className="rounded bg-red-300 px-2 py-1 hover:bg-red-400"
                onClick={() => {
                  cancelSetIsOpen(true);
                }}
              >
                Cancel lockup
                {cancelLockupModalIsOpen &&
                  CancelLockupDialog(
                    cancelLockupModalIsOpen,
                    cancelSetIsOpen,
                    cancelLockupFn
                  )}
              </button>
            </div>
          </div>
        </>
      )}
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
  const getVestingDetails = (
    vesting: FromStateVestingInformation | undefined
  ) => {
    if (
      lockupInfo.lockupState.vestingInformation?.terminationStatus ||
      lockupInfo.lockupState.terminationWithdrawnTokens.toString() !== "0"
    ) {
      return (
        <>
          <h2 className="prose">Vesting schedule</h2>
          <div className="grid grid-cols-3">
            <div className="col-span-1">Vesting Schedule</div>
            <div className="text-red-500">Lockup terminated</div>
          </div>
        </>
      );
    }

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
          <div className="col-span-2">
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "full",
              timeStyle: "long",
            }).format(start)}
          </div>
        </div>
        {cliff && (
          <div className="grid grid-cols-3">
            <div className="col-span-1">Cliff</div>
            <div className="col-span-2">
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "full",
                timeStyle: "long",
              }).format(cliff)}
            </div>
          </div>
        )}
        <div className="grid grid-cols-3">
          <div className="col-span-1">End</div>
          <div className="col-span-2">
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "full",
              timeStyle: "long",
            }).format(end)}
          </div>
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
          <div className="col-span-2">
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "full",
              timeStyle: "long",
            }).format(startDate)}
          </div>
        </div>
        <div className="grid grid-cols-3">
          <div className="col-span-1">End</div>
          <div className="col-span-2">
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "full",
              timeStyle: "long",
            }).format(endDate)}
          </div>
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
        <div className="col-span-2">
          {formatNearAmount(lockupInfo.liquidAmount.toString(), 2) + " Ⓝ"}
        </div>
      </div>
      <div className="grid grid-cols-3">
        <div className="col-span-1">Is staking allowed?</div>
        <div className="col-span-2">
          {lockupInfo.lockupState.stakingPoolWhitelistAccountId === "system" ? (
            <>No</>
          ) : (
            <>Yes</>
          )}
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

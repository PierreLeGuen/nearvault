import { Dialog, Transition } from "@headlessui/react";
import type BN from "bn.js";
import bs58 from "bs58";
import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useSession } from "next-auth/react";
import { Fragment, useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { getSidebarLayout } from "~/components/Layout";
import { useNearContext } from "~/context/near";
import { useWalletSelector } from "~/context/wallet";
import { initLockupContract } from "~/lib/lockup/contract";
import { calculateLockup, viewLockupAccount } from "~/lib/lockup/lockup";
import {
  type AccountLockup,
  type FromStateVestingInformation,
} from "~/lib/lockup/types";
import { findProperVestingSchedule } from "~/lib/lockup/utils";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { addRequestToMultisigWallet } from "../approval/manage";

const isPrivateSchedule = (
  vestingInformation: FromStateVestingInformation | undefined
): boolean => {
  if (!vestingInformation) {
    return false;
  }
  return vestingInformation.vestingHash !== undefined;
};

interface IFormInput {
  startDate: Date;
  endDate: Date;
  cliffDate: Date;
  authToken: string;
}

const ManageLockup: NextPageWithLayout = () => {
  useSession({ required: true });

  const [account, setAccount] = useState("");
  const [accountError, setAccountError] = useState("");
  const [cancelLockupModalIsOpen, cancelSetIsOpen] = useState(false);
  const [lockupInformation, setLockupInformation] =
    useState<AccountLockup | null>(null);
  const [terminationStatus, setTerminationStatus] = useState<string | null>("");

  const provider = useNearContext().provider;
  const walletSelector = useWalletSelector();
  const { newNearConnection } = usePersistingStore();
  const multisigWalletId = "foundation.near";

  // Lockup termination

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<IFormInput>();
  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    void cancelLockupFn(
      data.authToken,
      data.startDate,
      data.cliffDate,
      data.endDate
    );
  };

  const startDate = useWatch({
    control,
    name: "startDate",
  });

  const cliffDate = useWatch({
    control,
    name: "cliffDate",
  });

  const endDate = useWatch({
    control,
    name: "endDate",
  });

  useEffect(() => {
    if (startDate && cliffDate && endDate) {
      // Start Date vs Cliff Date validation
      if (new Date(startDate).getTime() >= new Date(cliffDate).getTime()) {
        setError("cliffDate", {
          type: "manual",
          message: "Cliff date should be greater than start date",
        });
      } else {
        clearErrors("cliffDate");
      }

      // Cliff Date vs End Date validation
      if (new Date(cliffDate).getTime() >= new Date(endDate).getTime()) {
        setError("endDate", {
          type: "manual",
          message: "End date should be greater than cliff date",
        });
      } else {
        clearErrors("endDate");
      }
    }
  }, [startDate, cliffDate, endDate, setError, clearErrors]);

  const getLockupInformation = async (account: string) => {
    console.log("getLockupInformation", account);

    try {
      const l = calculateLockup(prepareAccountId(account), "lockup.near");
      const r = await viewLockupAccount(l, provider);
      await updateTerminationStatus();
      setLockupInformation(r);
    } catch (e) {
      if (e) {
        setAccountError(
          `Error while retrieving account, error: ${JSON.stringify(e)}`
        );
      } else {
        setAccountError("Account not found");
      }
    }
  };

  async function updateTerminationStatus() {
    const n = await newNearConnection();
    const l = initLockupContract(
      await n.account(account),
      calculateLockup(account, "lockup.near")
    );
    const terminationStatus = await l.get_termination_status();
    setTerminationStatus(terminationStatus);
  }

  const tryWithdrawFn = async () => {
    const w = await walletSelector.selector.wallet();
    await assertCorrectMultisigWallet(walletSelector, multisigWalletId);
    const lockupAccountId = calculateLockup(account, "lockup.near");

    if (
      terminationStatus === "VestingTerminatedWithDeficit" ||
      terminationStatus === "EverythingUnstaked"
    ) {
      await addRequestToMultisigWallet(w, multisigWalletId, lockupAccountId, [
        {
          type: "FunctionCall",
          method_name: "termination_prepare_to_withdraw",
          args: btoa(JSON.stringify({})),
          deposit: "0",
          gas: "200000000000000",
        },
      ]);

      if (terminationStatus === "VestingTerminatedWithDeficit") {
        alert(
          `Account ${lockupAccountId} will the tokens unstaked after confirmation (get back to "Try Withdraw" in 2 days after the confirmation)`
        );
      } else {
        alert(
          `Account ${lockupAccountId} will get the tokens withdrawn from the staking pool after confirmation (get back to "Try Withdraw" immediately after the confirmation to withdraw the funds back to foundation)`
        );
      }
    } else {
      await addRequestToMultisigWallet(w, multisigWalletId, lockupAccountId, [
        {
          type: "FunctionCall",
          method_name: "termination_withdraw",
          args: btoa(JSON.stringify({ receiver_id: multisigWalletId })),
          deposit: "0",
          gas: "200000000000000",
        },
      ]);

      alert(
        `Account ${lockupAccountId} will get the tokens withdrawn to foundation and the termination will be completed after confirmation!`
      );
    }
  };

  const cancelLockupFn = async (
    authToken: string,
    start: Date,
    cliff: Date,
    end: Date
  ) => {
    const w = await walletSelector.selector.wallet();
    await assertCorrectMultisigWallet(walletSelector, multisigWalletId);

    // No vesting hash -> not private schedule
    if (!lockupInformation?.lockupState.vestingInformation?.vestingHash) {
      if (!lockupInformation) {
        throw new Error("Lockup information not found");
      }
      await addRequestToMultisigWallet(
        w,
        multisigWalletId,
        lockupInformation?.lockupAccountId,
        [
          {
            type: "FunctionCall",
            method_name: "terminate_vesting",
            args: btoa(JSON.stringify({})),
            deposit: "0",
            gas: "200000000000000",
          },
        ]
      );
    } else {
      await addRequestToMultisigWallet(
        w,
        multisigWalletId,
        lockupInformation?.lockupAccountId,
        [
          {
            type: "FunctionCall",
            method_name: "terminate_vesting",
            args: btoa(
              JSON.stringify(
                findProperVestingSchedule(
                  lockupInformation.lockupState.owner,
                  authToken,
                  new Date(start),
                  new Date(cliff),
                  new Date(end),
                  Buffer.from(
                    lockupInformation.lockupState.vestingInformation.vestingHash
                  ).toString("base64")
                )
              )
            ),
            deposit: "0",
            gas: "200000000000000",
          },
        ]
      );
    }

    await tryWithdrawFn();

    cancelSetIsOpen(false);
  };

  return (
    <>
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
              <div className="mt-4 flex flex-row gap-3">
                <button
                  className="rounded bg-red-300 px-2 py-1 hover:bg-red-400"
                  disabled={!lockupInformation.lockupState.vestingInformation}
                  onClick={() => {
                    cancelSetIsOpen(true);
                  }}
                >
                  {!lockupInformation.lockupState.vestingInformation
                    ? "Can't cancel lockup without a vesting schedule or terminated"
                    : "Cancel lockup"}
                </button>
                {terminationStatus && terminationStatus !== "" && (
                  <button
                    className="rounded bg-blue-300 px-2 py-1 hover:bg-blue-400"
                    onClick={() => {
                      void tryWithdrawFn();
                    }}
                  >
                    Try withdraw
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Transition appear show={cancelLockupModalIsOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => cancelSetIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  as="form"
                  className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <Dialog.Title
                    as="h3"
                    className="mb-3 text-lg font-medium leading-6 text-gray-900"
                  >
                    Are you sure?
                  </Dialog.Title>

                  {isPrivateSchedule(
                    lockupInformation?.lockupState.vestingInformation
                  ) && (
                    <div className="flex flex-col gap-3">
                      <p>
                        This lockup is private, you need to give the start,
                        cliff and end date that were used when creating the
                        lockup
                      </p>
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-row items-center gap-3">
                          <label className="flex flex-col">
                            Start date
                            <input
                              type="date"
                              {...register("startDate")}
                              required
                            />
                          </label>
                          <label className="flex flex-col">
                            Cliff date
                            <input
                              type="date"
                              {...register("cliffDate")}
                              required
                            />{" "}
                          </label>
                          <label className="flex flex-col">
                            End date
                            <input
                              type="date"
                              {...register("endDate")}
                              required
                            />
                          </label>
                        </div>
                        <div className="flex flex-col">
                          <label className="flex flex-col">
                            Auth token
                            <input
                              type="text"
                              {...register("authToken")}
                              required
                            />
                          </label>
                        </div>
                      </div>

                      {errors.startDate && (
                        <p className="text-red-500">
                          {errors.startDate.message}
                        </p>
                      )}
                      {errors.cliffDate && (
                        <p className="text-red-500">
                          {errors.cliffDate.message}
                        </p>
                      )}
                      {errors.endDate && (
                        <p className="text-red-500">{errors.endDate.message}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      The lockup will be cancelled. There is no way back.
                    </p>
                  </div>

                  <div className="mt-4">
                    <input
                      type="submit"
                      value="Create termination request"
                      className="inline-flex cursor-pointer justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    />
                    <button
                      type="button"
                      className="ml-4 inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => cancelSetIsOpen(false)}
                    >
                      Abort
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
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
  }

  if (data.startsWith("ed25519:")) {
    publicKey = bs58.decode(data.replace("ed25519:", ""));
  } else {
    return "";
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
          <div className="grid grid-cols-3">
            <div className="col-span-1">Vesting Hash</div>
            <div>{Buffer.from(vesting.vestingHash).toString("base64")}</div>
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

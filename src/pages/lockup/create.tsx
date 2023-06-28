import { Switch } from "@headlessui/react";
import { differenceInDays, subDays } from "date-fns";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import WalletsDropDown from "~/components/Staking/WalletsDropDown";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import { calculateLockup } from "~/lib/lockup/lockup";
import { assertCorrectMultisigWallet, getNearTimestamp } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { handleWalletRequestWithToast } from "../payments/transfers";
import { type WalletPretty } from "../staking/stake";

interface CreateLockupProps {
  owner_account_id: string;
  lockup_duration: number;
  vesting_schedule:
    | {
        start_timestamp: number;
        cliff_timestamp: number;
        end_timestamp: number;
      }
    | undefined;
  lockup_timestamp: number;
  release_duration: number;
  whitelist_account_id: string | undefined;
}

interface VestingSchedule {
  start_timestamp: number;
  cliff_timestamp: number;
  end_timestamp: number;
}

const CreateLockup: NextPageWithLayout = () => {
  const [amount, setAmount] = useState(0);
  const [account, setAccount] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [cliffDate, setCliffDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 4))
  );
  const [error, setError] = useState("");

  const [withCliff, setWithCliff] = useState(false);
  const [allowStaking, setAllowStaking] = useState(true);

  const [explenation, setExplenation] = useState("");

  const [teamsWallet, setTeamsWallet] = useState<WalletPretty[]>([]);
  const [fromWallet, setFromWallet] = useState<WalletPretty>({
    prettyName: "",
    walletDetails: { walletAddress: "", id: "", teamId: "" },
    isLockup: false,
    ownerAccountId: undefined,
  });

  const { newNearConnection } = usePersistingStore();
  const { currentTeam } = usePersistingStore.getState();

  const walletSector = useWalletSelector();
  api.teams.getWalletsForTeam.useQuery(
    {
      teamId: currentTeam?.id || "",
    },
    {
      enabled: true,
      async onSuccess(data) {
        if (!data || data.length == 0 || data[0] === undefined) {
          throw new Error("No wallets found");
        }
        const w: WalletPretty[] = [];
        for (const wallet of data) {
          w.push({
            walletDetails: wallet,
            prettyName: wallet.walletAddress,
            isLockup: false,
            ownerAccountId: undefined,
          });
          try {
            const lockupValue = calculateLockup(
              wallet.walletAddress,
              "lockup.near"
            );
            const nearConn = await newNearConnection();
            await (await nearConn.account(lockupValue)).state();

            w.push({
              prettyName: "Lockup of " + wallet.walletAddress,
              walletDetails: {
                walletAddress: lockupValue,
                id: lockupValue,
                teamId: "na",
              },
              isLockup: true,
              ownerAccountId: wallet.walletAddress,
            });
          } catch (_) {}
        }
        setTeamsWallet(w);
      },
    }
  );

  const createLockup = async () => {
    if (endDate < startDate) {
      setError("End date cannot be before start date");
      return;
    }
    if (fromWallet.isLockup) {
      setError("Cannot create a lockup from a lockup wallet");
      return;
    }
    if (amount < 3.5) {
      setError("Minimum amount is 3.5 NEAR");
      return;
    }

    setError("");
    // const n = await newNearConnection();
    await assertCorrectMultisigWallet(
      walletSector,
      fromWallet.walletDetails.walletAddress
    );

    const w = await walletSector.selector.wallet();
    // Empty string means allow staking
    let allowListAccount = "";
    if (!allowStaking) {
      allowListAccount = "system";
    }

    let createArgs: any = {};
    if (withCliff) {
      // lockup schedule
      createArgs = {
        vesting_schedule: {
          VestingSchedule: {
            start_timestamp: getNearTimestamp(startDate).toString(),
            cliff_timestamp: getNearTimestamp(cliffDate).toString(),
            end_timestamp: getNearTimestamp(endDate).toString(),
          },
        },
      };
    } else {
      // linear release
      createArgs = {
        lockup_timestamp: getNearTimestamp(startDate).toString(),
        release_duration: (
          getNearTimestamp(endDate) - getNearTimestamp(startDate)
        ).toString(),
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const fnCallArgs: CreateLockupProps = {
      owner_account_id: account,
      lockup_duration: "0",
      ...createArgs,
    };
    if (!allowStaking) {
      fnCallArgs["whitelist_account_id"] = "system";
    }
    await handleWalletRequestWithToast(
      w.signAndSendTransaction({
        receiverId: fromWallet.walletDetails.walletAddress,
        actions: [
          {
            type: "FunctionCall",
            params: {
              gas: "300000000000000",
              deposit: "0",
              methodName: "add_request",
              args: {
                request: {
                  receiver_id: "lockup.near",
                  actions: [
                    {
                      type: "FunctionCall",
                      method_name: "create",
                      args: btoa(JSON.stringify(fnCallArgs)),
                      deposit: parseNearAmount(amount.toString()),
                      gas: "150000000000000",
                    },
                  ],
                },
              },
            },
          },
        ],
      })
    );
  };

  useEffect(() => {
    let explenation = `The lockup of ${amount} NEAR for account ${account} will start on ${startDate.toLocaleDateString()} and end on ${endDate.toLocaleDateString()}. `;

    // Subtract one day from endDate and cliffDate
    const adjustedEndDate = subDays(endDate, 1);
    const adjustedCliffDate = subDays(cliffDate, 1);

    const totalDurationDays = differenceInDays(adjustedEndDate, startDate);
    const totalDurationYears = Math.floor(totalDurationDays / 365);
    const remainingDaysAfterYears = totalDurationDays % 365;

    const cliffDurationDays = differenceInDays(adjustedCliffDate, startDate);
    const cliffDurationYears = Math.floor(cliffDurationDays / 365);
    const remainingCliffDaysAfterYears = cliffDurationDays % 365;

    if (withCliff) {
      explenation += `It includes a cliff period of ${cliffDurationYears} year(s) and ${remainingCliffDaysAfterYears} day(s), ending on ${cliffDate.toLocaleDateString()}. `;
      explenation += `The release will last for a total of ${totalDurationYears} year(s) and ${remainingDaysAfterYears} day(s) (counting the cliff). `;
    } else {
      explenation += `The release will be linear over ${totalDurationYears} year(s) and ${remainingDaysAfterYears} day(s). (Ending dates are excluded from the calculations). `;
    }

    if (allowStaking) {
      explenation += `Staking is allowed during the lockup period.`;
    } else {
      explenation += `Staking is not allowed during the lockup period.`;
    }

    setExplenation(explenation);
  }, [amount, account, startDate, endDate, withCliff, cliffDate, allowStaking]);

  return (
    <div className="prose flex flex-col gap-2 p-3">
      <h1>Create Lockup</h1>
      <div className="flex flex-row items-center gap-3">
        Funding account:
        <WalletsDropDown
          wallets={teamsWallet}
          selectedWallet={fromWallet}
          setSelectedWallet={setFromWallet}
        />
      </div>

      <div>
        Lockup for account:{" "}
        <input
          type="text"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        />
      </div>
      <div>
        Amount in NEAR:{" "}
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value))}
        />
      </div>
      <div>
        Start Date:{" "}
        <input
          type="date"
          name="start"
          id="start"
          value={startDate.toISOString().split("T")[0]}
          onChange={(e) => setStartDate(new Date(e.target.value))}
        />
      </div>

      <div>
        End Date:{" "}
        <input
          type="date"
          name="end"
          id="end"
          value={endDate.toISOString().split("T")[0]}
          onChange={(e) => setEndDate(new Date(e.target.value))}
          className={endDate < startDate ? "border-red-300 bg-red-200" : ""}
        />
      </div>

      <div>
        With Cliff:{" "}
        <Switch
          checked={withCliff}
          onChange={setWithCliff}
          className={`${
            withCliff ? "bg-blue-600" : "bg-gray-200"
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
        >
          <span className="sr-only">Enable with cliff</span>
          <span
            className={`${
              withCliff ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>
      {withCliff && (
        <div>
          Cliff date:{" "}
          <input
            type="date"
            name="cliff"
            id="cliff"
            value={cliffDate.toISOString().split("T")[0]}
            onChange={(e) => setCliffDate(new Date(e.target.value))}
          />
        </div>
      )}
      <div>
        Allow Staking:{" "}
        <Switch
          checked={allowStaking}
          onChange={setAllowStaking}
          className={`${
            allowStaking ? "bg-blue-600" : "bg-gray-200"
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
        >
          <span className="sr-only">Enable staking</span>
          <span
            className={`${
              allowStaking ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>

      {error && <div className="text-red-500">{error}</div>}
      {explenation && <div>{explenation}</div>}

      <button
        className="rounded bg-blue-200 px-3 py-1 hover:bg-blue-300"
        onClick={() => void createLockup()}
      >
        Create
      </button>
    </div>
  );
};

CreateLockup.getLayout = getSidebarLayout;
export default CreateLockup;

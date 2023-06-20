import { Switch } from "@headlessui/react";
import { differenceInDays, subDays } from "date-fns";
import { useEffect, useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

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

  const { newNearConnection } = usePersistingStore();

  const createLockup = async () => {
    if (endDate < startDate) {
      setError("End date cannot be before start date");
      return;
    }
    setError("");
    const n = await newNearConnection();
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
    }

    explenation += `The release will be linear over ${totalDurationYears} year(s) and ${remainingDaysAfterYears} day(s). (Ending dates are excluded from the calculations). `;

    if (allowStaking) {
      explenation += `Staking is allowed during the lockup period.`;
    } else {
      explenation += `Staking is not allowed during the lockup period.`;
    }

    setExplenation(explenation);
  }, [amount, account, startDate, endDate, withCliff, cliffDate, allowStaking]);

  return (
    <div className="prose flex flex-col gap-2">
      <h1>Create Lockup</h1>
      <div>
        Account:{" "}
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
        onClick={void createLockup}
      >
        Create
      </button>
    </div>
  );
};

CreateLockup.getLayout = getSidebarLayout;
export default CreateLockup;

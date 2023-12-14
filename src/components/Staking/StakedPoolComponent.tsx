import {
  formatNearAmount,
  parseNearAmount,
} from "near-api-js/lib/utils/format";
import { useState } from "react";
import { type WalletData, type StakedPool } from "./AllStaked";

const StakedPoolComponent = ({
  pool,
  wallet,
  unstakeFn,
  isLockup,
}: {
  pool: StakedPool;
  wallet: WalletData;
  unstakeFn: (
    multisigAcc: string,
    isLockup: boolean,
    poolId: string,
    amount: string
  ) => Promise<void>;
  isLockup: boolean;
}) => {
  const [amountToUnstake, setAmountToUnstake] = useState("");
  const maxAmount = pool.deposit;

  // check if input amount is greater than the maximum amount
  const isAmountTooHigh = amountToUnstake !== "" && amountToUnstake > maxAmount;

  const inputDivClasses =
    "flex flex-row items-stretch overflow-hidden rounded-md shadow " +
    (isAmountTooHigh ? "bg-red-200" : "bg-gray-200");

  const buttonClasses =
    "px-4 py-2 text-white " + (isAmountTooHigh ? "bg-red-500" : "bg-blue-500");

  if (pool.deposit === "0") {
    return null;
  }

  return (
    <div key={pool.validator_id}>
      <div>
        <a
          href={"https://near-staking.com/validator/" + pool.validator_id}
          target="_blank"
        >
          {pool.validator_id}
        </a>
        <div className="flex flex-row justify-between">
          <div>{formatNearAmount(pool.deposit) + " Ⓝ"}</div>
          <button onClick={() => setAmountToUnstake(pool.deposit)}>
            Use max
          </button>
        </div>
        <div className={inputDivClasses}>
          <input
            className="flex-grow rounded-l-md px-2 py-2 focus:outline-none"
            type="text"
            placeholder="Enter amount..."
            value={
              amountToUnstake !== "" ? formatNearAmount(amountToUnstake) : ""
            }
            onChange={(e) =>
              setAmountToUnstake(parseNearAmount(e.target.value) || "")
            }
          />
          <button
            className={buttonClasses}
            disabled={isAmountTooHigh}
            onClick={() => {
              void unstakeFn(
                wallet.wallet.isLockup
                  ? wallet.wallet.ownerAccountId!
                  : wallet.wallet.walletDetails.walletAddress,
                isLockup,
                pool.validator_id,
                amountToUnstake
              );
            }}
          >
            Unstake
          </button>
        </div>
      </div>
    </div>
  );
};

export default StakedPoolComponent;

import {
  formatNearAmount,
  parseNearAmount,
} from "near-api-js/lib/utils/format";
import { useState } from "react";
import { type StakedPool, type WalletData } from "./AllStaked";

const WithdrawPoolComponent = ({
  pool,
  wallet,
  withdrawFn: unstakeFn,
  isLockup,
}: {
  pool: StakedPool;
  wallet: WalletData;
  withdrawFn: (
    multisigAcc: string,
    isLockup: boolean,
    poolId: string,
    amount: string,
    maxAmount: string
  ) => Promise<void>;
  isLockup: boolean;
}) => {
  const [amountToWithdraw, setAmountToWithdraw] = useState("");
  const maxAmount = pool.withdraw_available;

  // check if input amount is greater than the maximum amount
  const isAmountTooHigh =
    amountToWithdraw !== "" && Number(amountToWithdraw) > Number(maxAmount);

  const inputDivClasses =
    "flex flex-row items-stretch overflow-hidden rounded-md shadow " +
    (isAmountTooHigh ? "bg-red-200" : "bg-gray-200");

  const buttonClasses =
    "px-4 py-2 text-white " + (isAmountTooHigh ? "bg-red-500" : "bg-blue-500");

  let formattedAmount = formatNearAmount(pool.withdraw_available, 2);
  if (formattedAmount === "0") {
    formattedAmount = "< 1";
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
          <div>{formattedAmount + " Ⓝ"}</div>
          <button onClick={() => setAmountToWithdraw(pool.withdraw_available)}>
            Use max
          </button>
        </div>
        <div className={inputDivClasses}>
          <input
            className="flex-grow rounded-l-md px-2 py-2 focus:outline-none"
            type="text"
            placeholder="Enter amount..."
            value={
              amountToWithdraw !== "" ? formatNearAmount(amountToWithdraw) : ""
            }
            onChange={(e) => {
              setAmountToWithdraw(parseNearAmount(e.target.value) || "");
            }}
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
                amountToWithdraw,
                maxAmount
              );
            }}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPoolComponent;

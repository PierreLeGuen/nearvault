import { transactions } from "near-api-js";
import { TGas } from "./staking";
import BN from "bn.js";
import { useMutation } from "@tanstack/react-query";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { addMultisigRequestAction } from "./manage";
import { getNearTimestamp } from "~/lib/utils";
import { config } from "~/config/config";

type CreateLockup = {
  fundingAccountId: string;
  ownerId: string;
  yoctoDeposit: string;
  start: Date;
  end: Date;
  allowStaking: boolean;
  cliff?: Date;
};

const functionCallAction = (
  methodName: string,
  args: Record<string, unknown>,
  yoctoDeposit: string,
  gas: string,
) => {
  console.log(JSON.stringify(args));

  return {
    type: "FunctionCall",
    method_name: methodName,
    args: btoa(JSON.stringify(args)),
    deposit: yoctoDeposit,
    gas: gas,
  };
};

// Vesting schedule that can be cancelled
const getCreateVestingScheduleArgs = (params: CreateLockup) => {
  const defaultArgs = {
    owner_account_id: params.ownerId,
    lockup_duration: "0",
  };
  if (!params.allowStaking) {
    defaultArgs["whitelist_account_id"] = "system";
  }

  // needed for vesting schedule
  let cliff = params.cliff;
  if (!cliff) {
    cliff = params.start;
  }

  return {
    ...defaultArgs,
    vesting_schedule: {
      VestingSchedule: {
        start_timestamp: getNearTimestamp(params.start).toString(),
        cliff_timestamp: getNearTimestamp(cliff).toString(),
        end_timestamp: getNearTimestamp(params.end).toString(),
      },
    },
  };
};

// Linear lockup, can't be cancelled.
const getCreateLockupArgs = (params: CreateLockup) => {
  const defaultArgs = {
    owner_account_id: params.ownerId,
    lockup_duration: "0",
  };
  if (!params.allowStaking) {
    defaultArgs["whitelist_account_id"] = "system";
  }
  return {
    ...defaultArgs,
    lockup_timestamp: getNearTimestamp(params.start).toString(),
    release_duration: (
      getNearTimestamp(params.end) - getNearTimestamp(params.start)
    ).toString(),
  };
};

export const useCreateLockup = () => {
  const wsStore = useWalletTerminator();
  return useMutation({
    mutationFn: async (params: CreateLockup) => {
      console.log("useCreateLockup", { params });

      const args = getCreateVestingScheduleArgs(params);
      console.log("useCreateLockup", { args });

      const createLockupAction = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(config.accounts.lockupFactory, [
          functionCallAction(
            "create",
            args,
            params.yoctoDeposit,
            (250 * TGas).toString(),
          ),
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      console.log("useCreateLockup", { actions: createLockupAction });

      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccountId,
        receiverId: params.fundingAccountId,
        actions: [createLockupAction],
      });
    },
  });
};

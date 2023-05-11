import { init } from "./types";
import { functionCall } from "near-api-js/lib/transaction";
import { Gas } from "near-units";
import { BN } from "bn.js";
import { AccountMultisig } from "../multisig/account_multisig";
import { type Account } from "near-api-js";

export async function vestingTermination(
  caller: Account,
  lockupId: string,
  receiverId: string,
  requestKind: string
) {
  //   console.log(`Vesting ${requestKind} for ${lockupAccountId}`);
  //   const lockupAccount = await window.near.account(lockupAccountId);
  const lockupContract = init(caller, lockupId);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const lockupVestingInformation =
    await lockupContract.get_vesting_information();

  if (lockupVestingInformation === "None") {
    alert(
      `The lockup ${lockupId} does not have a vesting schedule (either terminated before or never had one)`
    );
    return;
  }

  if (requestKind === "terminate_vesting") {
    if (!("VestingSchedule" in lockupVestingInformation)) {
      alert(
        `Account ${lockupId} has no public vesting schedule (either it was terminated before, or it is in termination process, or it has private vesting)`
      );
      return;
    }
    const multisigWrapper = new AccountMultisig(
      caller.connection,
      "multisig.pierre-dev.near",
      {}
    );

    await multisigWrapper.signAndSendTransaction({
      receiverId: lockupId,
      actions: [
        functionCall(
          "terminate_vesting",
          {},
          new BN("0"),
          Gas.parse("200 Tgas")
        ),
      ],
    });
  } else if (requestKind === "termination_withdraw") {
    // if (!("Terminating" in lockupVestingInformation)) {
    //   alert(`Vesting termination is not initialized on ${lockupId}`);
    //   return;
    // }
    // let lockupTerminationStatus = await lockupContract.get_termination_status();
    // if (
    //   lockupTerminationStatus === "VestingTerminatedWithDeficit" ||
    //   lockupTerminationStatus === "EverythingUnstaked"
    // ) {
    //   await contract.functionCall(accountId, "add_request", {
    //     request: {
    //       receiver_id: lockupAccountId,
    //       actions: [
    //         funcCall(
    //           "termination_prepare_to_withdraw",
    //           {},
    //           "0",
    //           "175000000000000"
    //         ),
    //       ],
    //     },
    //   });
    //   if (lockupTerminationStatus === "VestingTerminatedWithDeficit") {
    //     alert(
    //       `Account ${lockupAccountId} will the tokens unstaked after confirmation (get back to "Try Withdraw" in 2 days after the confirmation)`
    //     );
    //   } else {
    //     alert(
    //       `Account ${lockupAccountId} will get the tokens withdrawn from the staking pool after confirmation (get back to "Try Withdraw" immediately after the confirmation to withdraw the funds back to foundation)`
    //     );
    //   }
    // } else {
    //   await contract.functionCall(accountId, "add_request", {
    //     request: {
    //       receiver_id: lockupAccountId,
    //       actions: [
    //         funcCall(
    //           "termination_withdraw",
    //           { receiver_id: accountId },
    //           "0",
    //           "75000000000000"
    //         ),
    //       ],
    //     },
    //   });
    //   alert(
    //     `Account ${lockupAccountId} will get the tokens withdrawn to foundation and the termination will be completed after confirmation!`
    //   );
    // }
  }
}

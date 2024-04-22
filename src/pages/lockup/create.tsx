import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInDays, subDays } from "date-fns";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getSidebarLayout } from "~/components/Layout";
import { DateField } from "~/components/inputs/date";
import { ReceiverFormField } from "~/components/inputs/receiver";
import { SenderFormField } from "~/components/inputs/sender";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { useCreateCancellableLockup } from "~/hooks/lockup";
import {
  useGetNearBalanceForWallet,
  useListAddressBook,
  useTeamsWalletsWithLockups,
} from "~/hooks/teams";
import { cn } from "~/lib/utils";
import { type NextPageWithLayout } from "../_app";

export interface CreateLockupProps {
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

const createLockupForm = z.object({
  fromWallet: z.string({
    required_error: "Please select a wallet.",
  }),
  toWallet: z.string({
    required_error: "Please select a wallet.",
  }),
  amount: z.number().gt(0),
  startDate: z.date(),
  endDate: z.date(),
  cliffDate: z.date().optional(),
  allowStaking: z.boolean(),
  cancelable: z.boolean(),
});

const CreateLockup: NextPageWithLayout = () => {
  const [explanation, setExplanation] = useState("");
  const form = useForm<z.infer<typeof createLockupForm>>({
    resolver: zodResolver(createLockupForm),
    defaultValues: {
      allowStaking: true,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      cliffDate: undefined,
      cancelable: true,
    },
  });

  const watchedSender = form.watch("fromWallet");
  const amount = form.watch("amount");
  const account = form.watch("toWallet");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const cliffDate = form.watch("cliffDate");
  const allowStaking = form.watch("allowStaking");

  const createLockup = useCreateCancellableLockup();
  const walletsWithLockupQuery = useTeamsWalletsWithLockups();
  const nearBalanceQuery = useGetNearBalanceForWallet(watchedSender);
  const listAddressBookQuery = useListAddressBook();

  function onSubmitGetLockup(values: z.infer<typeof createLockupForm>) {
    const fromWallet = walletsWithLockupQuery.data.find(
      (w) => w.walletDetails.walletAddress == values.fromWallet,
    );
    if (!fromWallet) {
      throw new Error("Sender wallet is missing");
    }

    createLockup.mutate({
      fundingAccountId: values.fromWallet,
      ownerId: values.toWallet,
      yoctoDeposit: parseNearAmount(values.amount.toString()),
      start: values.startDate,
      end: values.endDate,
      cliff: values.cliffDate,
      allowStaking: values.allowStaking,
      cancelable: values.cancelable,
    });
  }

  useEffect(() => {
    if (!form.formState.isValid) {
      return;
    }

    let explanation = `The lockup of ${amount} NEAR for account ${account} will start on ${startDate.toLocaleDateString()} and end on ${endDate.toLocaleDateString()}. `;

    // Subtract one day from endDate and cliffDate
    const adjustedEndDate = subDays(endDate, 1);
    const totalDurationDays = differenceInDays(adjustedEndDate, startDate);
    const totalDurationYears = Math.floor(totalDurationDays / 365);
    const remainingDaysAfterYears = totalDurationDays % 365;

    if (!!cliffDate) {
      const adjustedCliffDate = subDays(cliffDate, 1);
      const cliffDurationDays = differenceInDays(adjustedCliffDate, startDate);
      const cliffDurationYears = Math.floor(cliffDurationDays / 365);
      const remainingCliffDaysAfterYears = cliffDurationDays % 365;

      explanation += `It includes a cliff period of ${cliffDurationYears} year(s) and ${remainingCliffDaysAfterYears} day(s), ending on ${cliffDate.toLocaleDateString()}. `;
      explanation += `The release will last for a total of ${totalDurationYears} year(s) and ${remainingDaysAfterYears} day(s) (counting the cliff). `;
    } else {
      explanation += `The tokens will be released linearly over ${totalDurationYears} year(s) and ${remainingDaysAfterYears} day(s). (The end date is not included in the calculations). `;
    }

    if (allowStaking) {
      explanation += `Staking is allowed during the lockup period.`;
    } else {
      explanation += `Staking is not allowed during the lockup period.`;
    }

    setExplanation(explanation);
  }, [
    amount,
    account,
    startDate,
    endDate,
    cliffDate,
    allowStaking,
    form.formState.isValid,
  ]);

  return (
    <div className="flex flex-grow flex-col p-12">
      <Card>
        <CardHeader>
          <CardTitle>Create Lockup</CardTitle>
          <CardDescription>Create a NEAR lockup contract.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitGetLockup)}
                className="space-y-8"
              >
                <SenderFormField
                  isLoading={walletsWithLockupQuery.isLoading}
                  wallets={walletsWithLockupQuery.data}
                  name="fromWallet"
                  control={form.control}
                  rules={{
                    required: "Please select a wallet.",
                  }}
                  description="Select the wallet to fund the lockup."
                  placeholder="Select a wallet"
                  label="Sender Wallet"
                />
                <ReceiverFormField
                  isLoading={listAddressBookQuery.isLoading}
                  receivers={listAddressBookQuery.data}
                  name="toWallet"
                  control={form.control}
                  rules={{
                    required: "Please select a wallet.",
                  }}
                  description="Select the account to receive the lockup."
                  placeholder="Select a wallet"
                  label="Receiver Account"
                />
                <div className="flex flex-grow flex-row">
                  <FormItem className="flex flex-col">
                    <FormLabel>Token</FormLabel>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "br w-[100px] max-w-[100px] justify-between rounded-r-none border-r-0",
                        "text-muted-foreground",
                      )}
                      disabled={true}
                    >
                      NEAR
                      <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="flex flex-grow flex-col">
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0"
                            type="number"
                            className="flex rounded-l-none border "
                            value={field.value}
                            onChange={(e) => {
                              try {
                                const value = parseFloat(e.target.value || "");
                                form.setValue("amount", value);
                              } catch {
                                form.setValue("amount", 0);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Balance:{" "}
                          {nearBalanceQuery.isLoading
                            ? "Loading..."
                            : nearBalanceQuery.data}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="cancelable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Allow Cancellation</FormLabel>
                        <FormDescription>
                          Allows the NEAR Foundation to cancel the lockup at any
                          time. Non-cancellable lockups are not compatible with
                          cliff dates.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DateField
                  label="Start Date"
                  placeholder="Select a date"
                  description="Select the start date of the lockup."
                  name="startDate"
                  control={form.control}
                  rules={{
                    required: "Please select a start date.",
                  }}
                />
                <DateField
                  label="End Date"
                  placeholder="Select a date"
                  description="Select the end date of the lockup."
                  name="endDate"
                  control={form.control}
                  rules={{
                    required: "Please select an end date.",
                  }}
                />
                {form.watch("cancelable") && (
                  <DateField
                    label="Cliff Date"
                    placeholder="Optional. Select a date"
                    description="Select the date when the receiver can start withdrawing tokens."
                    name="cliffDate"
                    control={form.control}
                  />
                )}
                <FormField
                  control={form.control}
                  name="allowStaking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Allow Staking</FormLabel>
                        <FormDescription>
                          Allows the owner of the lockup to stake the full
                          amount of tokens in the lockup (even before the cliff
                          date).
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {explanation && <div>{explanation}</div>}
                <Button type="submit">Send Create Lockup Request</Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

CreateLockup.getLayout = getSidebarLayout;

export default CreateLockup;

import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon } from "@radix-ui/react-icons";

import { type z } from "zod";
import {
  burrowWithdrawFormSchema,
  useGetBurrowSuppliedTokens,
  useWithdrawSupplyFromBurrow,
} from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import { useTeamsWalletsWithLockups } from "~/hooks/teams";
import { getFormattedAmount } from "~/lib/transformations";
import { cn } from "~/lib/utils";
import { TokenWithMaxInput } from "../inputs/near";
import { SenderFormField } from "../inputs/sender";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const BurrowWithdraw = () => {
  const form = useZodForm(burrowWithdrawFormSchema);

  const currentToken = form.watch("token");

  const walletsQuery = useTeamsWalletsWithLockups();
  const burrowCollateralsQuery = useGetBurrowSuppliedTokens(
    form.watch("funding"),
  );
  const withdrawMutation = useWithdrawSupplyFromBurrow();
  const currentCollateral =
    currentToken && burrowCollateralsQuery.data
      ? burrowCollateralsQuery.data.find(
          (token) => token.ftMetadata.accountId === currentToken,
        )
      : undefined;

  const onSubmit = (values: z.infer<typeof burrowWithdrawFormSchema>) => {
    console.log(values);
    withdrawMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <SenderFormField
          isLoading={walletsQuery.isLoading}
          wallets={walletsQuery.data?.filter((w) => !w.isLockup)}
          name="funding"
          control={form.control}
          rules={{
            required: "Please select a wallet.",
          }}
          description="Funding wallet."
          placeholder="Select a wallet"
          label="Sender"
        />

        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Token</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={burrowCollateralsQuery.isLoading}
                    >
                      {burrowCollateralsQuery.isLoading && "Loading..."}
                      {!burrowCollateralsQuery.isLoading &&
                        (field.value
                          ? burrowCollateralsQuery.data?.find(
                              (token) =>
                                token.ftMetadata.accountId === field.value,
                            )?.ftMetadata.symbol
                          : "Select token")}
                      <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0">
                  <Command>
                    <CommandInput placeholder="Search token..." />
                    <CommandEmpty>No token found.</CommandEmpty>
                    <CommandGroup>
                      {burrowCollateralsQuery.isLoading && "Loading..."}
                      {!burrowCollateralsQuery.isLoading &&
                        burrowCollateralsQuery.data?.map((token) => (
                          <CommandItem
                            value={token.ftMetadata.accountId}
                            key={token.ftMetadata.accountId}
                            onSelect={() => {
                              form.setValue(
                                "token",
                                token.ftMetadata.accountId,
                              );
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                token.ftMetadata.accountId === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {`${token.ftMetadata.symbol} (${getFormattedAmount({
                              balance: token.token.balance,
                              decimals:
                                token.ftMetadata.decimals +
                                token.config.config.extra_decimals,
                              symbol: token.ftMetadata.symbol,
                            })})`}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <TokenWithMaxInput
          control={form.control}
          name="tokenAmount"
          label={`Amount to withdraw`}
          placeholder="10"
          rules={{ required: true }}
          decimals={
            currentCollateral?.config.config.extra_decimals +
              currentCollateral?.ftMetadata.decimals || 0
          }
          maxIndivisible={currentCollateral?.token.balance || "0"}
          symbol={currentCollateral?.ftMetadata.symbol || "loading"}
        />

        <Button type="submit">Create remove liquidity request</Button>
      </form>
    </Form>
  );
};

export default BurrowWithdraw;

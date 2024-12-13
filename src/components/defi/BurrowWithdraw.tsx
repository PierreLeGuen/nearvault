import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon } from "@radix-ui/react-icons";

import { useState } from "react";
import { type z } from "zod";
import {
  burrowWithdrawFormSchema,
  useGetBurrowSuppliedTokens,
  useWithdrawAllSupplyFromBurrow,
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
  const withdrawAllMutation = useWithdrawAllSupplyFromBurrow();
  const currentCollateral =
    currentToken && burrowCollateralsQuery.data
      ? burrowCollateralsQuery.data.tokens.find(
        (token) => token.ftMetadata.accountId === currentToken,
      )
      : undefined;

  const [selectedTokenType, setSelectedTokenType] = useState<'collateral' | 'supplied' | null>(null);

  const onSubmit = (values: z.infer<typeof burrowWithdrawFormSchema>) => {
    if (selectedTokenType === 'supplied') {
      withdrawAllMutation.mutate({ token: values.token, funding: values.funding });
    } else if (selectedTokenType === 'collateral') {
      withdrawMutation.mutate(values);
    }
  };

  return (
    <div>
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
                            ? burrowCollateralsQuery.data?.tokens.find(
                              (token) =>
                                token.ftMetadata.accountId === field.value,
                            )?.ftMetadata.symbol
                            : "Select collateral token")}
                        <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0">
                    <Command>
                      <CommandInput placeholder="Search token..." />
                      <CommandEmpty>No tokens found.</CommandEmpty>
                      {!burrowCollateralsQuery.isLoading && (
                        <>
                          <CommandGroup heading="Collateral">
                            {burrowCollateralsQuery.data?.tokens
                              .filter(token =>
                                burrowCollateralsQuery.data?.holdings.collateral
                                  .some(holding => holding.token_id === token.ftMetadata.accountId)
                              )
                              .map((token) => (
                                <CommandItem
                                  value={`collateral-${token.ftMetadata.accountId}`}
                                  key={`collateral-${token.ftMetadata.accountId}`}
                                  onSelect={() => {
                                    form.setValue(
                                      "token",
                                      token.ftMetadata.accountId,
                                    );
                                    setSelectedTokenType('collateral');
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
                                  {`${token.ftMetadata.symbol} (Collateral: ${getFormattedAmount({
                                    balance: burrowCollateralsQuery.data?.holdings.collateral
                                      .find(holding => holding.token_id === token.ftMetadata.accountId)
                                      ?.balance || "0",
                                    decimals:
                                      token.ftMetadata.decimals +
                                      token.config.config.extra_decimals,
                                    symbol: token.ftMetadata.symbol,
                                  })})`}
                                </CommandItem>
                              ))}
                          </CommandGroup>

                          <CommandGroup heading="Supplied">
                            {burrowCollateralsQuery.data?.tokens
                              .filter(token =>
                                burrowCollateralsQuery.data?.holdings.supplied
                                  .some(holding => holding.token_id === token.ftMetadata.accountId)
                              )
                              .map((token) => (
                                <CommandItem
                                  value={`supplied-${token.ftMetadata.accountId}`}
                                  key={`supplied-${token.ftMetadata.accountId}`}
                                  onSelect={() => {
                                    form.setValue(
                                      "token",
                                      token.ftMetadata.accountId,
                                    );
                                    setSelectedTokenType('supplied');
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
                                  {`${token.ftMetadata.symbol} (Supplied: ${getFormattedAmount({
                                    balance: burrowCollateralsQuery.data?.holdings.supplied
                                      .find(holding => holding.token_id === token.ftMetadata.accountId)
                                      ?.balance || "0",
                                    decimals:
                                      token.ftMetadata.decimals +
                                      token.config.config.extra_decimals,
                                    symbol: token.ftMetadata.symbol,
                                  })})`}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </>
                      )}
                      {burrowCollateralsQuery.isLoading && "Loading..."}
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedTokenType === 'collateral' && (
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
              maxIndivisible={
                burrowCollateralsQuery.data?.holdings.collateral
                  .find(holding => holding.token_id === currentToken)
                  ?.balance || "0"
              }
              symbol={currentCollateral?.ftMetadata.symbol || "loading"}
            />
          )}

          <Button
            type="submit"
            disabled={!selectedTokenType}
          >
            {selectedTokenType === 'supplied' ? 'Withdraw All' : 'Withdraw'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default BurrowWithdraw;

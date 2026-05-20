import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon } from "@radix-ui/react-icons";

import { useState } from "react";
import { type z } from "zod";
import {
  burrowWithdrawFormSchema,
  useGetBurrowSuppliedTokens,
  useGetTokenStorageBalance,
  useWithdrawSupplyFromBurrow,
} from "~/hooks/defi";
import { type BurrowPositionType } from "~/lib/defi/requests";
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
  const currentTokenDetails =
    currentToken && burrowCollateralsQuery.data
      ? burrowCollateralsQuery.data.tokens.find(
          (token) => token.ftMetadata.accountId === currentToken,
        )
      : undefined;

  const [selectedTokenType, setSelectedTokenType] =
    useState<BurrowPositionType | null>(null);

  const currentHolding =
    selectedTokenType && currentToken && burrowCollateralsQuery.data
      ? burrowCollateralsQuery.data.holdings[selectedTokenType].find(
          (holding) => holding.token_id === currentToken,
        )
      : undefined;

  const storageBalanceQuery = useGetTokenStorageBalance(
    currentToken,
    form.watch("funding"),
  );

  const selectedSymbol = currentTokenDetails?.ftMetadata.symbol || "token";
  const needsStorageRegistration =
    !!currentToken &&
    !!form.watch("funding") &&
    storageBalanceQuery.data === null;
  const getTokenDetails = (tokenId: string) => {
    return burrowCollateralsQuery.data?.tokens.find(
      (token) => token.ftMetadata.accountId === tokenId,
    );
  };

  const onSubmit = (values: z.infer<typeof burrowWithdrawFormSchema>) => {
    if (selectedTokenType) {
      withdrawMutation.mutate({
        token: values.token,
        funding: values.funding,
        positionType: selectedTokenType,
        amount: values.tokenAmount,
      });
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
                            : "Select Burrow position")}
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
                            {burrowCollateralsQuery.data?.holdings.collateral.map(
                              (holding) => {
                                const token = getTokenDetails(holding.token_id);
                                if (!token) return null;

                                return (
                                  <CommandItem
                                    value={`collateral-${token.ftMetadata.accountId}`}
                                    key={`collateral-${token.ftMetadata.accountId}`}
                                    onSelect={() => {
                                      form.setValue(
                                        "token",
                                        token.ftMetadata.accountId,
                                      );
                                      setSelectedTokenType("collateral");
                                    }}
                                  >
                                    <CheckIcon
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        token.ftMetadata.accountId ===
                                          field.value &&
                                          selectedTokenType === "collateral"
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {`${
                                      token.ftMetadata.symbol
                                    } (Collateral: ${getFormattedAmount({
                                      balance: holding.balance,
                                      decimals:
                                        token.ftMetadata.decimals +
                                        token.config.config.extra_decimals,
                                      symbol: token.ftMetadata.symbol,
                                    })})`}
                                  </CommandItem>
                                );
                              },
                            )}
                          </CommandGroup>

                          <CommandGroup heading="Supplied">
                            {burrowCollateralsQuery.data?.holdings.supplied.map(
                              (holding) => {
                                const token = getTokenDetails(holding.token_id);
                                if (!token) return null;

                                return (
                                  <CommandItem
                                    value={`supplied-${token.ftMetadata.accountId}`}
                                    key={`supplied-${token.ftMetadata.accountId}`}
                                    onSelect={() => {
                                      form.setValue(
                                        "token",
                                        token.ftMetadata.accountId,
                                      );
                                      setSelectedTokenType("supplied");
                                    }}
                                  >
                                    <CheckIcon
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        token.ftMetadata.accountId ===
                                          field.value &&
                                          selectedTokenType === "supplied"
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {`${
                                      token.ftMetadata.symbol
                                    } (Supplied: ${getFormattedAmount({
                                      balance: holding.balance,
                                      decimals:
                                        token.ftMetadata.decimals +
                                        token.config.config.extra_decimals,
                                      symbol: token.ftMetadata.symbol,
                                    })})`}
                                  </CommandItem>
                                );
                              },
                            )}
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

          {selectedTokenType && (
            <TokenWithMaxInput
              control={form.control}
              name="tokenAmount"
              label="Amount to withdraw"
              placeholder="10"
              rules={{ required: true }}
              decimals={
                currentTokenDetails?.config.config.extra_decimals +
                  currentTokenDetails?.ftMetadata.decimals || 0
              }
              maxIndivisible={currentHolding?.balance || "0"}
              symbol={selectedSymbol}
            />
          )}

          {selectedTokenType && currentToken && (
            <div className="rounded-md border p-4 text-sm">
              <div className="font-medium">Next action</div>
              <div className="mt-1 text-muted-foreground">
                {storageBalanceQuery.isLoading
                  ? "Checking token storage..."
                  : needsStorageRegistration
                  ? `Register wallet to receive ${selectedSymbol}`
                  : `Create Burrow ${selectedTokenType} withdraw request`}
              </div>
              {!storageBalanceQuery.isLoading && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Storage:{" "}
                  {needsStorageRegistration
                    ? "registration needed"
                    : "registered"}
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={!selectedTokenType || withdrawMutation.isLoading}
          >
            {withdrawMutation.isLoading
              ? "Creating request..."
              : needsStorageRegistration
              ? "Create storage registration request"
              : "Create withdraw request"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default BurrowWithdraw;

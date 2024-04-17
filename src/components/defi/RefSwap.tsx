/* eslint-disable react-hooks/exhaustive-deps */
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import BigNumber from "bignumber.js";
import { useEffect } from "react";
import { z } from "zod";
import { SenderFormField } from "~/components/inputs/sender";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  useGetPoolsForToken,
  useGetTokenPrices,
  useRefSwap,
  type LiquidityPool,
} from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import {
  useGetAllTokensWithBalanceForWallet,
  useTeamsWalletsWithLockups,
} from "~/hooks/teams";
import { viewCall } from "~/lib/client";
import { type FungibleTokenMetadata } from "~/lib/ft/contract";
import { getFormattedAmount, type Token } from "~/lib/transformations";
import { cn, convertToIndivisibleFormat } from "~/lib/utils";
import { ScrollArea } from "../ui/scroll-area";

const formSchema = z.object({
  funding: z.string(),
  poolId: z.string(),
  userAmountOut: z.string(),
  userMinAmountIn: z.string(),
  tokenOutId: z.string(),
  tokenInId: z.string(),
});

export const getFormattedPoolBalance = (pool: {
  amounts: string[];
  token_symbols: string[];
  id: string;
}) => {
  return `${pool.token_symbols.join("-")} (${Object.keys(pool.amounts)
    .map((_, idx) => `${pool.amounts[idx]} ${pool.token_symbols[idx]}`)
    .join(" | ")}) ID: ${pool.id}`;
};

export const getUserBalanceForPool = (
  pool?: LiquidityPool,
  userTokens?: Token[],
) => {
  const tokens: Token[] = [];

  if (pool && userTokens) {
    for (let i = 0; i < pool.token_account_ids.length; i++) {
      const token = userTokens.find(
        (t) => t.account_id == pool.token_account_ids[i],
      );
      if (token) {
        tokens.push(token);
      } else {
        tokens.push(undefined);
      }
    }
  }

  return tokens;
};

const RefSwap = () => {
  const form = useZodForm(formSchema, {
    defaultValues: {
      userAmountOut: "0",
      userMinAmountIn: "0",
    },
  });
  const walletsQuery = useTeamsWalletsWithLockups();
  const poolsForTokenQuery = useGetPoolsForToken(form.watch("tokenOutId"));

  const tokensQuery = useGetAllTokensWithBalanceForWallet(
    form.watch("funding"),
  );

  const tokenPricesQuery = useGetTokenPrices();
  const swapMutation = useRefSwap();

  const calculateExpectedAmountIn = (
    tokenOutId: string,
    tokenInId: string,
    poolId: string,
    userAmountOut: string,
  ) => {
    if (tokenOutId && tokenInId && poolId && userAmountOut) {
      const tokenOutPrice = tokenPricesQuery.data?.[tokenOutId]?.price || "0";
      const tokenInPrice = tokenPricesQuery.data?.[tokenInId]?.price || "0";

      const expectedAmount = new BigNumber(userAmountOut.toString())
        .multipliedBy(tokenOutPrice)
        .dividedBy(tokenInPrice)
        .toString();
      form.setValue("userMinAmountIn", expectedAmount);
    } else {
      form.setValue("userMinAmountIn", "0");
    }
  };

  useEffect(() => {
    calculateExpectedAmountIn(
      form.watch("tokenOutId"),
      form.watch("tokenInId"),
      form.watch("poolId"),
      form.watch("userAmountOut"),
    );
  }, [
    form.watch("tokenOutId"),
    form.watch("tokenInId"),
    form.watch("poolId"),
    form.watch("userAmountOut"),
  ]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);

    const userOutTokenMeta = await viewCall<FungibleTokenMetadata>(
      values.tokenOutId,
      "ft_metadata",
      {},
    );
    const userInTokenMeta = await viewCall<FungibleTokenMetadata>(
      values.tokenInId,
      "ft_metadata",
      {},
    );
    const userOutToken = convertToIndivisibleFormat(
      values.userAmountOut,
      userOutTokenMeta.decimals,
    );

    const userInToken = convertToIndivisibleFormat(
      values.userMinAmountIn,
      userInTokenMeta.decimals,
    );

    const minAmount = new BigNumber(userInToken.toString())
      .multipliedBy(0.99)
      .toFixed(0);

    console.log(
      userOutToken,
      userInToken,
      values.poolId,
      values.tokenOutId,
      values.tokenInId,
      values.funding,
    );

    await swapMutation.mutateAsync({
      fundingAccId: values.funding,
      outAccId: values.tokenOutId,
      inAccId: values.tokenInId,
      outAmount: userOutToken.toString(),
      minInAmount: minAmount,
      poolId: values.poolId,
    });
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

        <div className="flex flex-grow flex-row">
          <FormField
            control={form.control}
            name="tokenOutId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Token Out</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "br w-[100px] max-w-[100px] justify-between rounded-r-none border-r-0",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={tokensQuery.isLoading}
                      >
                        {tokensQuery.isLoading && "Loading..."}
                        {!tokensQuery.isLoading &&
                          (field.value
                            ? tokensQuery.data?.find(
                                (token) => token.account_id === field.value,
                              )?.symbol
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
                        {tokensQuery.isLoading && "Loading..."}
                        {!tokensQuery.isLoading &&
                          tokensQuery.data?.map((token) => (
                            <CommandItem
                              value={token.account_id}
                              key={token.account_id}
                              onSelect={() => {
                                form.setValue("tokenOutId", token.account_id);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  token.account_id === field.value
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {`${token.symbol} (${getFormattedAmount(token)})`}
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
          <FormField
            control={form.control}
            name="userAmountOut"
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
                        form.setValue("userAmountOut", e.target.value);
                      } catch {
                        form.setValue("userAmountOut", "0");
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* In amount */}
        <div className="flex flex-grow flex-row">
          <FormField
            control={form.control}
            name="tokenInId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Token In</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "br w-[100px] max-w-[100px] justify-between rounded-r-none border-r-0",
                          !field.value && "text-muted-foreground",
                        )}
                        disabled={poolsForTokenQuery.isLoading}
                      >
                        {poolsForTokenQuery.isLoading && "Loading..."}
                        {!poolsForTokenQuery.isLoading &&
                          (field.value
                            ? poolsForTokenQuery.data?.accountIdToSymbol[
                                field.value
                              ]
                            : "Select token")}
                        <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0">
                    <Command>
                      <CommandInput placeholder="Search token..." />
                      <ScrollArea className="h-[300px]">
                        <CommandEmpty>No token found.</CommandEmpty>
                        <CommandGroup>
                          {poolsForTokenQuery.isLoading && "Loading..."}
                          {!poolsForTokenQuery.isLoading &&
                            poolsForTokenQuery.data?.pools.map((pool) => {
                              const tokenAccIds = pool.token_account_ids.filter(
                                (tokenId) =>
                                  tokenId !== form.watch("tokenOutId"),
                              );
                              return tokenAccIds.map((tokenAccInId) => (
                                <CommandItem
                                  value={`${pool.id}-${tokenAccInId}-${poolsForTokenQuery.data?.accountIdToSymbol[tokenAccInId]}`}
                                  key={`${pool.id}-${tokenAccInId}-${poolsForTokenQuery.data?.accountIdToSymbol[tokenAccInId]}`}
                                  onSelect={() => {
                                    form.setValue("tokenInId", tokenAccInId);
                                    form.setValue("poolId", pool.id);
                                  }}
                                >
                                  <CheckIcon
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      tokenAccInId === field.value &&
                                        pool.id === form.watch("poolId")
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {`${poolsForTokenQuery.data?.accountIdToSymbol[tokenAccInId]} (Pool: ${pool.id})`}
                                </CommandItem>
                              ));
                            })}
                        </CommandGroup>
                      </ScrollArea>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="userMinAmountIn"
            render={({ field }) => (
              <FormItem className="flex flex-grow flex-col">
                <FormLabel>Amount in</FormLabel>
                <FormControl>
                  <Input
                    disabled={true}
                    placeholder="0"
                    type="number"
                    className="flex rounded-l-none border"
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">{`Create swap request`}</Button>
      </form>
    </Form>
  );
};

export default RefSwap;

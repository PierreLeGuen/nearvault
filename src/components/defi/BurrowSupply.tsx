import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon } from "@radix-ui/react-icons";
import { z } from "zod";
import { SenderFormField } from "~/components/inputs/sender";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { burrowSupplyFormSchema, useSupplyToBurrow } from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import {
  useGetAllTokensWithBalanceForWallet,
  useTeamsWalletsWithLockups,
} from "~/hooks/teams";
import { getFormattedAmount } from "~/lib/transformations";
import { cn } from "~/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const BurrowSupply = () => {
  const form = useZodForm(burrowSupplyFormSchema, {
    defaultValues: {
      tokenAmount: 0,
    },
  });
  const walletsQuery = useTeamsWalletsWithLockups();

  const tokensQuery = useGetAllTokensWithBalanceForWallet(
    form.watch("funding"),
  );
  const depositMutation = useSupplyToBurrow();

  const onSubmit = (values: z.infer<typeof burrowSupplyFormSchema>) => {
    console.log(values);
    depositMutation.mutate(values);
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
                                form.setValue("token", token.account_id);
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
            name="tokenAmount"
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
                        form.setValue("tokenAmount", value);
                      } catch {
                        form.setValue("tokenAmount", 0);
                      }
                    }}
                  />
                </FormControl>
                {/* <FormDescription>Balance: {0}</FormDescription> */}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Create supply request</Button>
      </form>
    </Form>
  );
};

export default BurrowSupply;

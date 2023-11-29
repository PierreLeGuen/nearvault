import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
  FormDescription,
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
import { cn } from "~/lib/utils";

const formSchema = z.object({
  fromWallet: z.string().min(2).max(50),
  toWallet: z.string().min(2),
  token: z.string().min(2),
  amount: z.number().min(0),
  memo: z.string().min(2),
  language: z.string({
    required_error: "Please select a language.",
  }),
});

const wallets = [{ label: "nftest.near", value: "test" }] as const;
const receivers = [{ label: "receiver.near", value: "receivertest" }] as const;
const tokens = [{ label: "NEAR", value: "near" }] as const;

const TransfersPage = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromWallet: "",
      toWallet: "",
      amount: 0,
      memo: "",
      token: "near",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="fromWallet"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Sender</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "justify-between",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value
                        ? wallets.find((wallet) => wallet.value === field.value)
                            ?.label
                        : "Select wallet"}
                      <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search wallet..." />
                    <CommandEmpty>No wallet found.</CommandEmpty>
                    <CommandGroup>
                      {wallets.map((wallet) => (
                        <CommandItem
                          value={wallet.label}
                          key={wallet.value}
                          onSelect={() => {
                            form.setValue("fromWallet", wallet.value);
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              wallet.value === field.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {wallet.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Wallet used to send the tokens.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="toWallet"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Receiver</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "justify-between",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value
                        ? receivers.find(
                            (wallet) => wallet.value === field.value,
                          )?.label
                        : "Select wallet"}
                      <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search address book..." />
                    <CommandEmpty>No wallet found.</CommandEmpty>
                    <CommandGroup>
                      {receivers.map((wallet) => (
                        <CommandItem
                          value={wallet.label}
                          key={wallet.value}
                          onSelect={() => {
                            form.setValue("toWallet", wallet.value);
                          }}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              wallet.value === field.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {wallet.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Receiver of the tokens after approval.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row">
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
                          "br w-[100px] justify-between rounded-r-none border-r-0",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? tokens.find(
                              (wallet) => wallet.value === field.value,
                            )?.label
                          : "Select token"}
                        <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search token..." />
                      <CommandEmpty>No token found.</CommandEmpty>
                      <CommandGroup>
                        {tokens.map((token) => (
                          <CommandItem
                            value={token.label}
                            key={token.value}
                            onSelect={() => {
                              form.setValue("token", token.value);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "mr-2 h-4 w-4",
                                token.value === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {token.label}
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
            name="amount"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0"
                    {...field}
                    type="number"
                    className="rounded-l-none border-l-0"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="memo"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Memo</FormLabel>
              <FormControl>
                <Input {...field} className="rounded-l-none border-l-0" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

export default TransfersPage;

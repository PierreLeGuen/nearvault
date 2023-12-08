import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { Transaction } from "@near-finance-near-wallet-selector/core";
import { useQuery } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as z from "zod";
import { getSidebarLayout } from "~/components/Layout";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import { ScrollArea } from "~/components/ui/scroll-area";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import { initFungibleTokenContract } from "~/lib/ft/contract";
import { initLockupContract } from "~/lib/lockup/contract";
import { assertCorrectMultisigWallet, cn } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import {
  dbDataToTransfersData,
  type LikelyTokens,
  type Token,
} from "./lib/transformations";

const formSchema = z.object({
  fromWallet: z.string({
    required_error: "Please select a wallet.",
  }),
  toWallet: z.string().min(2),
  token: z.string({
    required_error: "Please select a token.",
  }),
  amount: z.number().gt(0),
  memo: z.string(),
});

const TransfersPage: NextPageWithLayout = () => {
  const walletSelector = useWalletSelector();
  const { currentTeam, newNearConnection } = usePersistingStore();
  const [formattedBalance, setFormattedBalance] = useState<string>("");
  const [checkLedger, setCheckLedger] = useState<boolean>(false);

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

  const watchedSender = form.watch("fromWallet");
  const watchedToken = form.watch("token");

  const { data } = api.teams.getWalletsForTeam.useQuery(
    { teamId: currentTeam?.id || "" },
    { enabled: !!currentTeam?.id },
  );

  const { data: senderWallets, isLoading } = useQuery({
    queryKey: ["wallets", currentTeam?.id],
    queryFn: async () => {
      const wallets = await dbDataToTransfersData({
        data: data || [],
        getNearConnection: newNearConnection,
      });
      return wallets;
    },
    enabled: !!data,
  });

  const { data: addressBook, isLoading: addrBookLoading } =
    api.teams.getBeneficiariesForTeam.useQuery({
      teamId: currentTeam?.id || "",
    });

  const { data: tokenAddresses } = useQuery({
    queryKey: ["tokens", watchedSender],
    queryFn: async () => {
      const sender = form.getValues("fromWallet");
      const res = fetch(
        `https://api.kitwallet.app/account/${sender}/likelyTokensFromBlock?fromBlockTimestamp=0`,
      );
      const data = (await (await res).json()) as LikelyTokens;
      console.log(data);

      return data;
    },
    enabled: !!form.getValues("fromWallet"),
  });

  const { data: tokens, isLoading: tokensIsLoading } = useQuery({
    queryKey: ["tokens", watchedSender, [tokenAddresses?.list]],
    queryFn: async () => {
      const tokAddrs = tokenAddresses?.list || [];
      console.log(tokAddrs);
      const sender = form.getValues("fromWallet");
      console.log(sender);

      const promises = tokAddrs.map(async (token) => {
        const near = await newNearConnection();
        const contract = initFungibleTokenContract(
          await near.account(""),
          token,
        );
        try {
          const ft_metadata = await contract.ft_metadata();
          const ft_balance = await contract.ft_balance_of({
            account_id: sender,
          });

          const t: Token = {
            ...ft_metadata,
            balance: ft_balance,
            account_id: token,
          };

          return t;
        } catch (e) {
          console.log(e);
        }
      });

      const nearPromise = async () => {
        const sender = form.getValues("fromWallet");
        try {
          const account = (await newNearConnection()).account(sender);
          const balance = await (await account).getAccountBalance();
          const t = {
            balance: balance.available,
            decimals: 24,
            name: "NEAR",
            symbol: "NEAR",
            account_id: "near",
          } as Token;
          return t;
        } catch (e) {
          console.log(e);
        }
      };

      const tokenDetails = (
        await Promise.all(promises.concat(nearPromise()))
      ).filter((t) => !!t) as Token[];

      return tokenDetails;
    },
    enabled: !!tokenAddresses,
  });

  // Updates the formatted balance when the token or the wallet changes
  useEffect(() => {
    const token = tokens?.find((t) => t.account_id === watchedToken);
    if (token) {
      setFormattedBalance(getFormattedAmount(token));
    }
  }, [watchedToken, tokens]);

  function getFormattedAmount(token: Token | undefined) {
    return `${(
      parseInt(token?.balance || "") /
      10 ** (token?.decimals || 0)
    ).toLocaleString()} ${token?.symbol}`;
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
    const sender = senderWallets?.find(
      (wallet) => wallet.walletDetails.walletAddress === data.fromWallet,
    );
    if (!sender) {
      throw new Error("Sender not found");
    }

    const receiver = addressBook?.find(
      (recv) => recv.walletAddress === data.toWallet,
    );
    if (!receiver) {
      throw new Error("Receiver not found");
    }

    const token = tokens?.find((t) => t.account_id === data.token);
    if (!token) {
      throw new Error("Token not found");
    }

    const amount = data.amount;

    const senderAddress = sender.isLockup
      ? sender.ownerAccountId
      : sender.walletDetails.walletAddress;

    const lockupAddress = sender.isLockup
      ? sender.walletDetails.walletAddress
      : undefined;

    if (!senderAddress) {
      throw new Error("Sender address not found");
    }

    try {
      await assertCorrectMultisigWallet(walletSelector, senderAddress);
    } catch (e) {
      toast.error((e as Error).message);
      return;
    }

    setCheckLedger(true);

    try {
      const wallet = await walletSelector.selector.wallet();
      const transactions: Transaction[] = [];

      if (token.account_id === "near") {
        const yoctoAmount = parseNearAmount(amount.toString());
        const near = await newNearConnection();
        const account = await near.account(senderAddress);

        if (sender.isLockup && lockupAddress) {
          // from lockup
          const lockupContract = initLockupContract(
            account,
            sender.walletDetails.walletAddress,
          );
          const areTransfersEnabled =
            await lockupContract.are_transfers_enabled();

          if (!areTransfersEnabled) {
            transactions.push({
              receiverId: senderAddress,
              signerId: senderAddress,
              actions: [
                {
                  type: "FunctionCall",
                  params: {
                    gas: "300000000000000",
                    deposit: "0",
                    methodName: "add_request",
                    args: {
                      request: {
                        receiver_id: lockupAddress,
                        actions: [
                          {
                            type: "FunctionCall",
                            method_name: "check_transfers_vote",
                            args: btoa(JSON.stringify({})),
                            gas: "125000000000000",
                            deposit: "0",
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            });
            toast.error("Transfers are disabled for this lockup");
            return;
          }
          transactions.push({
            receiverId: senderAddress,
            signerId: senderAddress,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  gas: "300000000000000",
                  deposit: "0",
                  methodName: "add_request",
                  args: {
                    request: {
                      receiver_id: receiver.walletAddress,
                      actions: [
                        {
                          type: "FunctionCall",
                          method_name: "transfer",
                          args: btoa(
                            JSON.stringify({
                              receiver_id: receiver.walletAddress,
                              amount: yoctoAmount,
                            }),
                          ),
                          gas: "125000000000000",
                          deposit: "0",
                        },
                      ],
                    },
                  },
                },
              },
            ],
          });
        } else {
          // from multisig wallet
          transactions.push({
            receiverId: senderAddress,
            signerId: senderAddress,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  gas: "300000000000000",
                  deposit: "0",
                  methodName: "add_request",
                  args: {
                    request: {
                      receiver_id: receiver.walletAddress,
                      actions: [
                        {
                          type: "Transfer",
                          amount: yoctoAmount,
                        },
                      ],
                    },
                  },
                },
              },
            ],
          });
        }
      } else {
        // NEP-141 tokens
        const _amount = amount * 10 ** token.decimals;
        const ftTransferArgs = {
          receiver_id: receiver.walletAddress,
          amount: _amount.toString(),
        };
        if (lockupAddress) {
          toast.error("Lockup NEP-141 transfers not supported yet");
        } else {
          transactions.push({
            receiverId: senderAddress,
            signerId: senderAddress,
            actions: [
              {
                type: "FunctionCall",
                params: {
                  gas: "300000000000000",
                  deposit: "0",
                  methodName: "add_request",
                  args: {
                    request: {
                      receiver_id: token.account_id,
                      actions: [
                        {
                          type: "FunctionCall",
                          method_name: "ft_transfer",
                          args: btoa(JSON.stringify(ftTransferArgs)),
                          deposit: "1",
                          gas: "200000000000000",
                        },
                      ],
                    },
                  },
                },
              },
            ],
          });
        }
      }

      const res = await wallet.signAndSendTransactions({
        transactions: transactions,
      });
      toast.success(`Transfer request added ${JSON.stringify(res)}`);
    } finally {
      setCheckLedger(false);
    }
  }

  return (
    <div className="flex flex-grow flex-col items-center gap-10 py-10 ">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle>Transfer tokens</CardTitle>
          <CardDescription>
            Add multisig request to transfer tokens.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                            disabled={isLoading}
                          >
                            {isLoading && "Loading..."}
                            {!isLoading &&
                              (field.value
                                ? senderWallets?.find(
                                    (wallet) =>
                                      wallet.walletDetails.walletAddress ===
                                      field.value,
                                  )?.prettyName
                                : "Select wallet")}
                            <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <ScrollArea className="h-[550px]">
                          <Command>
                            <CommandInput placeholder="Search wallet..." />
                            <CommandEmpty>No wallet found.</CommandEmpty>
                            <CommandGroup>
                              {senderWallets?.map((wallet) => (
                                <CommandItem
                                  value={wallet.prettyName}
                                  key={wallet.walletDetails.id}
                                  onSelect={() => {
                                    form.setValue(
                                      "fromWallet",
                                      wallet.walletDetails.walletAddress,
                                    );
                                  }}
                                >
                                  <CheckIcon
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      wallet.walletDetails.walletAddress ===
                                        field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {wallet.prettyName}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Wallet used to send the tokens.
                    </FormDescription>
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
                            disabled={addrBookLoading}
                          >
                            {addrBookLoading && "Loading..."}
                            {!addrBookLoading &&
                              (field.value
                                ? addressBook?.find(
                                    (recv) =>
                                      recv.walletAddress === field.value,
                                  )?.firstName
                                : "Select wallet")}
                            <ChevronUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <ScrollArea className="h-[550px]">
                          <Command>
                            <CommandInput placeholder="Search address book..." />
                            <CommandEmpty>No wallet found.</CommandEmpty>
                            <CommandGroup>
                              {addressBook?.map((recv) => (
                                <CommandItem
                                  value={recv.walletAddress}
                                  key={recv.walletAddress}
                                  onSelect={() => {
                                    form.setValue(
                                      "toWallet",
                                      recv.walletAddress,
                                    );
                                  }}
                                >
                                  <CheckIcon
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      recv.walletAddress === field.value
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {`${
                                    recv.firstName
                                  } (${recv.walletAddress.slice(0, 20)}...)`}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Receiver of the tokens after approval.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
                              disabled={tokensIsLoading}
                            >
                              {tokensIsLoading && "Loading..."}
                              {!tokensIsLoading &&
                                (field.value
                                  ? tokens?.find(
                                      (token) =>
                                        token.account_id === field.value,
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
                              {tokensIsLoading && "Loading..."}
                              {!tokensIsLoading &&
                                tokens?.map((token) => (
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
                                    {`${token.symbol} (${getFormattedAmount(
                                      token,
                                    )})`}
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
                        Balance: {formattedBalance}
                      </FormDescription>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={checkLedger}>
                {checkLedger ? "Check Ledger..." : "Submit"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

TransfersPage.getLayout = getSidebarLayout;

export default TransfersPage;

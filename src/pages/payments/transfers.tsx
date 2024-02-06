import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStoreActions } from "easy-peasy";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as z from "zod";
import { getSidebarLayout } from "~/components/Layout";
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
import {
  useGetAllTokensWithBalanceForWallet,
  useListAddressBook,
  useTeamsWalletsWithLockups,
} from "~/hooks/teams";
import { initLockupContract } from "~/lib/lockup/contract";
import { getFormattedAmount } from "~/lib/transformations";
import { cn } from "~/lib/utils";
import { convertDecimalToBN } from "~/store-easy-peasy/helpers/convertDecimalToBN";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

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
  const { newNearConnection } = usePersistingStore();
  const [formattedBalance, setFormattedBalance] = useState<string>("");
  const canSignTx = useStoreActions((store: any) => store.accounts.canSignTx);
  const signAndSendTransaction = useStoreActions(
    (actions: any) => actions.wallets.signAndSendTransaction,
  );

  const wsStore = useWalletTerminator();

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

  const { data: senderWallets, isLoading } = useTeamsWalletsWithLockups();

  const { data: addressBook, isLoading: addrBookLoading } =
    useListAddressBook();

  const { data: tokens, isLoading: tokensIsLoading } =
    useGetAllTokensWithBalanceForWallet(watchedSender);

  // Updates the formatted balance when the token or the wallet changes
  useEffect(() => {
    const token = tokens?.find((t) => t.account_id === watchedToken);
    if (token) {
      setFormattedBalance(getFormattedAmount(token));
    }
  }, [watchedToken, tokens]);

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

    if (!canSignTx(senderAddress)) return;

    console.log("senderAddress", senderAddress);

    try {
      const transactions: any = [];

      if (token.account_id === "near") {
        const yoctoAmount = parseNearAmount(amount.toString());
        const near = await newNearConnection();

        if (sender.isLockup && lockupAddress) {
          // from lockup
          const lockupContract = await initLockupContract(
            senderAddress,
            sender.walletDetails.walletAddress,
            near,
          );
          const areTransfersEnabled =
            await lockupContract.are_transfers_enabled();

          if (!areTransfersEnabled) {
            transactions.push({
              senderId: senderAddress,
              receiverId: senderAddress,
              actions: [
                {
                  type: "FunctionCall",
                  method: "add_request",
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
                  tGas: 300,
                },
              ],
            });
            toast.error("Transfers are disabled for this lockup");
            return;
          }

          transactions.push({
            senderId: senderAddress,
            receiverId: senderAddress,
            action: {
              type: "FunctionCall",
              method: "add_request",
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
              tGas: 300,
            },
          });
        } else {
          // from multisig wallet
          transactions.push({
            senderId: senderAddress,
            receiverId: senderAddress,
            action: {
              type: "FunctionCall",
              method: "add_request",
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
              tGas: 300,
            },
          });
        }
      } else {
        // NEP-141 tokens
        const ftTransferArgs = {
          receiver_id: receiver.walletAddress,
          amount: convertDecimalToBN(amount, token.decimals),
        };

        if (lockupAddress) {
          toast.error("Lockup NEP-141 transfers not supported yet");
        } else {
          transactions.push({
            senderId: senderAddress,
            receiverId: senderAddress,
            action: {
              type: "FunctionCall",
              method: "add_request",
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
              tGas: 300,
            },
          });
        }
      }
      console.log("transfer transactions", transactions);
      // await signAndSendTransaction(transactions[0]);
      await wsStore.signAndSendTransaction(transactions[0]);
    } catch (e) {
      console.error(e);
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
          {JSON.stringify(wsStore.accounts)}
          {wsStore.selectedPublicKey}
          <Button onClick={() => wsStore.connectWithLedger()}>
            Connect Ledger
          </Button>
          <Button onClick={() => wsStore.connectWithMyNearWallet()}>
            Connect MyNearWallet
          </Button>
          <Button onClick={() => wsStore.openModal()}>Open Modal</Button>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <SenderFormField
                isLoading={isLoading}
                wallets={senderWallets}
                name="fromWallet"
                control={form.control}
                rules={{
                  required: "Please select a wallet.",
                }}
                description="Funding wallet."
                placeholder="Select a wallet"
                label="Sender"
              />
              <ReceiverFormField
                isLoading={addrBookLoading}
                receivers={addressBook}
                name="toWallet"
                control={form.control}
                rules={{
                  required: "Please select a wallet.",
                }}
                description="Receiver of the tokens after approval."
                placeholder="Select a wallet"
                label="Receiver"
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
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

TransfersPage.getLayout = getSidebarLayout;

export default TransfersPage;

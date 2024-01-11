import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { z } from "zod";
import { KeysInput } from "~/components/inputs/keys";
import { TextInput } from "~/components/inputs/text";
import { ThresholdInput } from "~/components/inputs/threshold";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { config } from "~/config/config";
import {
  WalletSelectorContextProvider,
  useWalletSelector,
} from "~/contexts/WalletSelectorContext";
import { useZodForm } from "~/hooks/form";
import { NextPageWithLayout } from "../_app";

const formSchema = z.object({
  fundingAccountId: z.string(),
  accountId: z.string(),
  threshold: z.string().refine((value) => {
    const threshold = Number(value);
    return threshold > 0; // TODO: && threshold <= maxThreshold
  }),
  owners: z.array(z.string()).transform((value) => {
    return value.filter(Boolean);
  }),
});

export const SetupMultisigWallet: NextPageWithLayout = () => {
  const form = useZodForm(formSchema, {
    defaultValues: {
      fundingAccountId: "",
      accountId: "",
      threshold: "",
      owners: [""],
    },
  });
  const watched = form.watch();

  const { selector, modal, account: fundingAccount } = useWalletSelector();
  console.log("fundingAccount", fundingAccount);

  const handleSignOut = async () => {
    if (!fundingAccount) return;
    const w = await selector.wallet();
    await w.signOut();
  };

  const handleSignIn = () => {
    modal.show();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
    await createMultisigWithFactory(values);
  };

  const createMultisigWithFactory = async (
    data: z.infer<typeof formSchema>,
  ) => {
    const factory = config.accounts.multisigFactory;
    const wallet = await selector.wallet();
    const threshold = new Number(data.threshold);

    await wallet.signAndSendTransactions({
      transactions: [
        {
          receiverId: factory,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "create",
                args: {
                  name: data.accountId,
                  members: data.owners,
                  num_confirmations: threshold,
                },
                gas: "300000000000000",
                deposit: parseNearAmount("5"),
              },
            },
          ],
        },
      ],
    });
  };

  return (
    <div className="flex h-screen flex-1 flex-col items-center justify-center">
      <div className="flex w-[700px] flex-col gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Create multisig wallet</CardTitle>
            <CardDescription>Create your multisig wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="flex flex-col gap-3">
                  <Label>Funding account *</Label>
                  <div className="flex flex-row">
                    <Button onClick={handleSignIn} variant="outline">
                      {fundingAccount
                        ? fundingAccount.accountId
                        : "Connect wallet"}
                    </Button>
                    {fundingAccount && (
                      <Button
                        onClick={handleSignOut}
                        variant="link"
                        className="ml-2"
                      >
                        Switch account...
                      </Button>
                    )}
                  </div>
                </div>
                <TextInput
                  control={form.control}
                  name="accountId"
                  label="Account ID"
                  placeholder="mymultisig"
                  description={
                    "Account created will be: " +
                    (watched.accountId || "mymultisig") +
                    "." +
                    config.accounts.multisigFactory
                  }
                  rules={{ required: true }}
                  disabled={false}
                />
                <KeysInput
                  currentPublicKey={fundingAccount?.publicKey}
                  control={form.control}
                  name="owners"
                  label="Owners"
                  placeholder="ed22569:..."
                  rules={{ required: true }}
                  disabled={false}
                />
                <ThresholdInput
                  maxThreshold={watched.owners?.length}
                  control={form.control}
                  name="threshold"
                  label="Threshold"
                  rules={{ required: true }}
                  disabled={watched.owners?.length === 0}
                />
                <Button type="submit">Create</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="inline-flex w-full justify-between">
          <Button variant="outline">
            <ChevronLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button>
            Continue
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

SetupMultisigWallet.getLayout = function getLayout(page) {
  return <WalletSelectorContextProvider>{page}</WalletSelectorContextProvider>;
};

export default SetupMultisigWallet;

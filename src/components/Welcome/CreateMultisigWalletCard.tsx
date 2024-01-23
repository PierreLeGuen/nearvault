import { useEffect } from "react";
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
import { useWalletSelector } from "~/contexts/WalletSelectorContext";
import { useZodForm } from "~/hooks/form";
import {
  multisigFactoryFormSchema,
  useCreateMultisigWithFactory,
  useIsMultisigWalletSuccessfullyCreated,
} from "~/hooks/multisigFactory";

type Params = {
  onMultisigCreateSuccess: (multisigAccId: string) => void;
} & React.HTMLAttributes<HTMLDivElement>;

export function CreateMultisigWalletCard(params: Params) {
  const form = useZodForm(multisigFactoryFormSchema, {
    defaultValues: {
      fundingAccountId: "",
      accountId: "",
      threshold: "",
      owners: [""],
    },
  });
  const watched = form.watch();
  const createMultisigWithFactory = useCreateMultisigWithFactory();
  const { selector, modal, account: fundingAccount } = useWalletSelector();

  const { setTransactionHashes, query } =
    useIsMultisigWalletSuccessfullyCreated();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionHashes = urlParams.get("transactionHashes");
    if (!transactionHashes) {
      return;
    }

    setTransactionHashes(transactionHashes.split(","));
  }, []);

  useEffect(() => {
    if (query.isSuccess) {
      params.onMultisigCreateSuccess(query.data);
    }
  }, [query.isSuccess]);

  const handleSignOut = async () => {
    if (!fundingAccount) return;
    const w = await selector.wallet();
    await w.signOut();
  };

  const handleSignIn = () => {
    modal.show();
  };

  const onSubmit = async (
    values: z.infer<typeof multisigFactoryFormSchema>,
  ) => {
    // we can't use the promise because the wallet selector overrides the
    // current window
    await createMultisigWithFactory.mutateAsync(values);
  };

  return (
    <Card className={params.className}>
      <CardHeader>
        <CardTitle>Create multisig wallet</CardTitle>
        <CardDescription>Create your multisig wallet</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex flex-col gap-3">
              <Label>Funding account *</Label>
              <div className="flex flex-row">
                <Button onClick={handleSignIn} variant="outline">
                  {fundingAccount ? fundingAccount.accountId : "Connect wallet"}
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
            {query.isError && (
              <div className="text-red-500">
                Failed to create multisig, error {JSON.stringify(query.error)}
              </div>
            )}
            {query.isSuccess && (
              <div className="text-green-500">
                Successfully created multisig: {query.data}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

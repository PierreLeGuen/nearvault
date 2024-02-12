import { WalletIcon } from "@heroicons/react/20/solid";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useZodForm } from "~/hooks/form";
import { useAddWallet, useListWallets } from "~/hooks/teams";
import usePersistingStore from "~/store/useStore";
import { TextAreaInput } from "../inputs/text-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";

const walletIdSchema = z.string(); // Adjust this regex based on the actual format of wallet IDs
const formSchema = z.object({
  ids: z.string().transform((value) => {
    const wallets = value.split(/[\n,]+/).map((id) => id.trim());
    const errors = [];
    for (const walletId of wallets) {
      try {
        walletIdSchema.parse(walletId);
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }
    return wallets;
  }),
});

export function AddWalletDialog() {
  const { currentTeam } = usePersistingStore();
  const form = useZodForm(formSchema);

  const addWalletMut = useAddWallet();
  const listWallets = useListWallets();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentTeam) return;

    try {
      await addWalletMut.mutateAsync({
        teamId: currentTeam.id,
        walletAddresses: values.ids,
      });
      await listWallets.refetch();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add wallet to team</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add wallet to team</DialogTitle>
          <DialogDescription>
            Add existing multisig wallets to your team
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TextAreaInput
              control={form.control}
              name="ids"
              label="Wallet IDs"
              placeholder="Wallet IDs, seperated by commas or new lines, eg: test.multisignature.near, bob.multisignature.near"
              rules={{ required: true }}
              disabled={false}
            />
            <Button type="submit" disabled={addWalletMut.isLoading}>
              <div className="inline-flex items-center">
                <WalletIcon className="mr-2 w-5" />
                Add Wallet(s)
              </div>
            </Button>
            {addWalletMut.error && (
              <div className="text-red-500">{addWalletMut.error.message}</div>
            )}
            {addWalletMut.isSuccess && (
              <div className="text-green-500">Successfully added wallets!</div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

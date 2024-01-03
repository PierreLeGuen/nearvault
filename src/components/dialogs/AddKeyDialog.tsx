import { KeyIcon } from "@heroicons/react/20/solid";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useWalletSelector } from "~/context/wallet";
import { useZodForm } from "~/hooks/form";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import { addRequestToMultisigWallet } from "~/pages/approval/manage";
import { TextInput } from "../inputs/text";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Form } from "../ui/form";

const formSchema = z.object({
  public_key: z.string(),
});

export function AddKeyDialog(props: { walletId: string }) {
  const form = useZodForm(formSchema);
  const walletSelector = useWalletSelector();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await addRequestAddKey(props.walletId, values.public_key);
  }

  const addRequestAddKey = async (multisigWallet: string, key: string) => {
    await assertCorrectMultisigWallet(walletSelector, multisigWallet);
    const w = await walletSelector.selector.wallet();
    await addRequestToMultisigWallet(w, multisigWallet, multisigWallet, [
      {
        type: "AddKey",
        public_key: key,
        permission: {
          allowance: null,
          receiver_id: multisigWallet,
          method_names: [
            "add_request",
            "add_request_and_confirm",
            "confirm",
            "delete_request",
          ],
        },
        gas: "125000000000000",
        deposit: "0",
      },
    ]);
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button>Add public key</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add public key to wallet</DialogTitle>
          <DialogDescription>
            This key will be able to do operations on the wallet{" "}
            {props.walletId}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TextInput
              control={form.control}
              name="public_key"
              label="Public Key"
              placeholder="ed25519:BQEFH2xFEp7hBsfGGLsrzB2DY2VTaADxh4KdpqdC123"
              rules={{ required: true }}
              disabled={false}
            />
            <Button type="submit">
              <div className="inline-flex items-center">
                <KeyIcon className="mr-2 w-5" />
                Add Key
              </div>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

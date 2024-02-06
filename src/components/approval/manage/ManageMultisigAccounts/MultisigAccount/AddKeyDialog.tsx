import { KeyIcon } from "@heroicons/react/20/solid";
import { useStoreActions } from "easy-peasy";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useZodForm } from "~/hooks/form";
import { useAddKey } from "~/hooks/manage";
import { TextInput } from "../../../../inputs/text";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../ui/dialog";
import { Form } from "../../../../ui/form";

const formSchema = z.object({
  publicKey: z.string(),
});

export const AddKey = ({ accountId }: any) => {
  const form = useZodForm(formSchema);
  const addKey = useStoreActions(
    (actions: any) => actions.pages.approval.manage.addKey,
  );
  const addKeyN = useAddKey();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // addKey({ contractId: accountId, publicKey: values.publicKey });
    addKeyN.mutate({ accountId: accountId, key: values.publicKey });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add public key</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add public key to wallet</DialogTitle>
          <DialogDescription>
            This key will be able to do operations on the wallet {accountId}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TextInput
              control={form.control}
              name="publicKey"
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
};

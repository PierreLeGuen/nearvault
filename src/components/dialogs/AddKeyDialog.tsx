import { KeyIcon } from "@heroicons/react/20/solid";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useZodForm } from "~/hooks/form";
import { useAddKey } from "~/hooks/manage";
import { SwitchSmallInput } from "../inputs/switch-small";
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

const addKeyFormSchema = z.object({
  publicKey: z.string(),
  methodNames: z.object({
    add_request: z.boolean(),
    add_request_and_confirm: z.boolean(),
    confirm: z.boolean(),
    delete_request: z.boolean(),
  }),
});

export const AddKey = ({ accountId }: { accountId: string }) => {
  const form = useZodForm(addKeyFormSchema, {
    defaultValues: {
      methodNames: {
        add_request: true,
        add_request_and_confirm: false,
        confirm: false,
        delete_request: false,
      },
    },
  });
  const addKey = useAddKey();

  const onSubmit = (values: z.infer<typeof addKeyFormSchema>) => {
    console.log(values);
    const t = Object.keys(values.methodNames).filter(
      (v) => values.methodNames[v],
    );

    addKey.mutate({
      accountId,
      publicKey: values.publicKey,
      methodNames: t,
    });
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
            />
            <div className="flex flex-col gap-4">
              <SwitchSmallInput
                control={form.control}
                name="methodNames.add_request"
                label="Add a request to the multisig"
                title="Method names"
              />
              <SwitchSmallInput
                control={form.control}
                name="methodNames.delete_request"
                label="Delete a request from the multisig"
              />
              <SwitchSmallInput
                control={form.control}
                name="methodNames.confirm"
                label="Confirm pending requests"
              />
              <SwitchSmallInput
                control={form.control}
                name="methodNames.add_request_and_confirm"
                label="Add a request and confirm it at the same time"
              />
            </div>
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

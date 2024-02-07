import { KeyIcon } from "@heroicons/react/20/solid";
import { z } from "zod";
import { ThresholdInput } from "~/components/inputs/threshold";
import { Button } from "~/components/ui/button";
import { useZodForm } from "~/hooks/form";
import { useSetNumConfirmations } from "~/hooks/manage";
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
  numConfirmations: z.string(),
});

type Params = {
  accountId: string;
  maxThreshold: number;
};

export const SetNumberConfirmations = ({ accountId, maxThreshold }: Params) => {
  const form = useZodForm(formSchema);
  const setNumConfirmations = useSetNumConfirmations();

  const onSubmit = (values: z.infer<typeof formSchema>) =>
    setNumConfirmations.mutate({
      accountId,
      numConfirmations: parseInt(values.numConfirmations),
    });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Set voting threshold</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set the voting threshold</DialogTitle>
          <DialogDescription>
            Number of approvals needed for a transaction to be executed from{" "}
            {accountId}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <ThresholdInput
              control={form.control}
              name="numConfirmations"
              label="Number of confirmations"
              placeholder="2"
              rules={{ required: true }}
              disabled={false}
              maxThreshold={maxThreshold}
            />
            <Button type="submit">
              <div className="inline-flex items-center">
                <KeyIcon className="mr-2 w-5" />
                Submit
              </div>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

import { WalletIcon } from "@heroicons/react/20/solid";
import { toast } from "react-toastify";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useZodForm } from "~/hooks/form";
import { useCreateTeam, useListTeams } from "~/hooks/teams";
import { TextInput } from "../inputs/text";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Form } from "../ui/form";

const formSchema = z.object({
  name: z.string(),
});

export function CreateTeamDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: () => void;
}) {
  const form = useZodForm(formSchema);

  const mutation = useCreateTeam();
  const listTeams = useListTeams();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await mutation.mutateAsync({
        teamName: values.name,
      });
      await listTeams.refetch();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to create team ${(err as Error).message}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Create a new team to manage multisig wallets and invite members.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TextInput
              control={form.control}
              name="name"
              label="Team name"
              placeholder="My new team"
              rules={{ required: true }}
              disabled={false}
            />
            <Button type="submit" disabled={mutation.isLoading}>
              <div className="inline-flex items-center">
                <WalletIcon className="mr-2 w-5" />
                Create team
              </div>
            </Button>
            {mutation.error && (
              <div className="text-red-500">{mutation.error.message}</div>
            )}
            {mutation.isSuccess && (
              <div className="text-green-500">Successfully created team!</div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

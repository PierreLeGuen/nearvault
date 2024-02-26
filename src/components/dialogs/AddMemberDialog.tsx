import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useZodForm } from "~/hooks/form";
import {
  useAddMember,
  useGetCurrentTeam,
  useListInvitations,
} from "~/hooks/teams";
import { EmailInput } from "../inputs/email";
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
  email: z.string().email(),
});

export function AddMemberDialog() {
  const form = useZodForm(formSchema);
  const currentTeamQuery = useGetCurrentTeam();

  const addMemberMut = useAddMember();
  const invitationsQuery = useListInvitations();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentTeamQuery.data) return;

    try {
      await addMemberMut.mutateAsync({
        invitedEmail: values.email,
        teamId: currentTeamQuery.data.id,
      });
      await invitationsQuery.refetch();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Invite new member</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite new member</DialogTitle>
          <DialogDescription>
            Invite a new member to your team
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <EmailInput
              control={form.control}
              name="email"
              placeholder="Email"
              rules={{ required: true }}
              defaultValue=""
              disabled={false}
            />
            <Button type="submit" disabled={addMemberMut.isLoading}>
              <div className="inline-flex items-center">
                <PaperPlaneIcon className="mr-2" />
                Invite member
              </div>
            </Button>
            {addMemberMut.error && (
              <div className="text-red-500">{addMemberMut.error.message}</div>
            )}
            {addMemberMut.isSuccess && (
              <div className="text-green-500">Successfully invited user!</div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

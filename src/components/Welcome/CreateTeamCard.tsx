import { Team } from "@prisma/client";
import { useEffect } from "react";
import { z } from "zod";
import { TextInput } from "~/components/inputs/text";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { useZodForm } from "~/hooks/form";
import {
  createTeamAndInviteUsers,
  useCreateTeamAndInviteUsers,
} from "~/hooks/teams";
import { MembersInput } from "../inputs/members";

type Params = {
  onTeamCreated: (team: Team) => void;
  defaultValues?: z.infer<typeof createTeamAndInviteUsers>;
} & React.HTMLAttributes<HTMLDivElement>;

export function CreateTeamCard(params: Params) {
  const form = useZodForm(createTeamAndInviteUsers, {
    defaultValues: {
      name: "",
      members: [""],
      wallets: [""],
      ...params.defaultValues,
    },
  });

  useEffect(() => {
    form.reset(params.defaultValues);
  }, [params.defaultValues]);

  const query = useCreateTeamAndInviteUsers();

  const onSubmit = async (values: z.infer<typeof createTeamAndInviteUsers>) => {
    query.mutate(values, {
      onSuccess: (data) => {
        params.onTeamCreated(data);
      },
    });
  };

  return (
    <Card className={params.className}>
      <CardHeader>
        <CardTitle>Create team</CardTitle>
        <CardDescription>
          Create a team to consult your multisig wallets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TextInput
              control={form.control}
              name="name"
              label="Team name"
              placeholder="My Awesome Team"
              description="This name will be used to identify your team."
              rules={{ required: true }}
              disabled={false}
            />
            <MembersInput
              control={form.control}
              name="members"
              label="Members"
              placeholder="bob@gmail.com"
              rules={{ required: true }}
              disabled={false}
            />
            <MembersInput
              control={form.control}
              name="wallets"
              label="Wallets"
              placeholder="mymultisig"
              rules={{ required: true }}
              disabled={false}
            />
            <Button type="submit" disabled={query.isLoading}>
              Create
            </Button>
            {query.isError && (
              <div className="text-red-500">
                Failed to create team, error {JSON.stringify(query.error)}
              </div>
            )}
            {query.isSuccess && (
              <div className="text-green-500">
                Successfully created team: {query.data.name}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

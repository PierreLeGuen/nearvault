import { Team, TeamInvitation } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useAcceptOrRejectInvitation, useListInvitations } from "~/hooks/teams";
import { Button } from "../ui/button";

export const PendingInvitations = ({
  callback,
}: {
  callback?: (
    invitation: TeamInvitation & { team: Team },
    status: string,
  ) => void;
}) => {
  const invitationsQuery = useListInvitations();
  const joinTeamQuery = useAcceptOrRejectInvitation();

  const onAcceptOrReject = async (
    invitation: TeamInvitation & { team: Team },
    status: "ACCEPTED" | "REJECTED",
  ) => {
    await joinTeamQuery.mutateAsync({
      invitationId: invitation.id,
      status: status,
    });
    await invitationsQuery.refetch();

    callback(invitation, status);
  };

  if (invitationsQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (invitationsQuery.data?.length === 0) {
    return <></>;
  }

  console.log(invitationsQuery.data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending team invitations</CardTitle>
        <CardDescription>
          You were invited in {invitationsQuery.data?.length} teams. You can
          accept or reject the invitations. If you accept, you will be able to
          see the team in the sidebar. If you reject, the invitation will be
          removed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {invitationsQuery.data?.map((invitation) => (
            <span
              key={invitation.id}
              className="inline-flex w-full items-center justify-between"
            >
              <div>{invitation.team.name}</div>
              <span className="inline-flex gap-2">
                <Button
                  onClick={() => onAcceptOrReject(invitation, "ACCEPTED")}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => onAcceptOrReject(invitation, "REJECTED")}
                  variant="destructive"
                >
                  Reject
                </Button>
              </span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

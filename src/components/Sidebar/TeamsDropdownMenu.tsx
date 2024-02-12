import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { type Team, type UserTeam } from "@prisma/client";
import { Cross1Icon } from "@radix-ui/react-icons";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useDeleteTeamMember, useListTeams } from "~/hooks/teams";
import usePersistingStore from "~/store/useStore";
import { CreateTeamDialog } from "../dialogs/CreateTeamDialog";
import { Skeleton } from "../ui/skeleton";

export function TeamsDropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentTeam, currentTeam } = usePersistingStore();

  const teamsQuery = useListTeams();
  const deleteMemberQuery = useDeleteTeamMember();

  const handleDeleteMember = async (userTeamRel: UserTeam & { team: Team }) => {
    await deleteMemberQuery.mutateAsync({
      teamId: userTeamRel.teamId,
      memberId: userTeamRel.userId,
    });
    await teamsQuery.refetch();
    toast.success(`Team ${userTeamRel.team.name} left!`);
  };

  if (teamsQuery.isLoading) return <Skeleton className="h-8 rounded-none" />;

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="justify-between rounded-none px-7">
            {currentTeam?.name}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Teams</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {teamsQuery.data.map((userTeamRelation) => (
              <DropdownMenuItem key={userTeamRelation.teamId}>
                <div className="inline-flex w-full cursor-pointer items-center justify-between">
                  <p
                    className="w-[85%]"
                    onClick={() => setCurrentTeam(userTeamRelation.team)}
                  >
                    {userTeamRelation.team.name}
                  </p>
                  <Button
                    variant="outline"
                    size="icon"
                    className="min-h-5 min-w-5 h-5 w-5"
                    type="button"
                    onClick={() => handleDeleteMember(userTeamRelation)}
                  >
                    <Cross1Icon className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href={"/team/manage"}>
              <DropdownMenuItem>Manage team</DropdownMenuItem>
            </Link>
            <DropdownMenuItem onClick={() => setIsOpen(true)}>
              Create team
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link
              href="https://github.com/PierreLeGuen/near-finance"
              target="_blank"
              className="inline-flex w-full items-center gap-2"
            >
              GitHub
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTeamDialog open={isOpen} onOpenChange={() => setIsOpen(false)} />
    </>
  );
}

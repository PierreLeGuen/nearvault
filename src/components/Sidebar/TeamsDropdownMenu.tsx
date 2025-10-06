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
import {
  useAssertNearBlocksApiKey,
  useAssertRpcUrl,
  useDeleteTeamMember,
  useGetCurrentTeam,
  useListTeams,
  useSwictTeam,
} from "~/hooks/teams";
import { CreateTeamDialog } from "../dialogs/CreateTeamDialog";
import { Skeleton } from "../ui/skeleton";

export function TeamsDropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const currentTeamQuery = useGetCurrentTeam();
  const setCurrentTeam = useSwictTeam();
  useAssertRpcUrl();
  useAssertNearBlocksApiKey();

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

  const handleSwitchTeam = (teamId: string) => {
    setCurrentTeam.mutate({
      teamId,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="justify-between rounded-none px-7">
            {currentTeamQuery.isLoading
              ? "Loading..."
              : currentTeamQuery.data.name}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Teams</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {teamsQuery.data?.map((userTeamRelation) => (
              <DropdownMenuItem key={userTeamRelation.teamId}>
                <div className="inline-flex w-full cursor-pointer items-center justify-between py-0">
                  <div
                    className="w-[85%] py-1"
                    onClick={() => handleSwitchTeam(userTeamRelation.teamId)}
                  >
                    {userTeamRelation.team.name}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="min-h-5 min-w-5 h-5 w-5 hover:bg-slate-300"
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
            <DropdownMenuItem>
              <Link href={"/team/manage"} className="cursor-pointer">
                Manage team
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsOpen(true)}
              className="cursor-pointer"
            >
              Create team
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link
              href="https://github.com/PierreLeGuen/near-finance"
              target="_blank"
              className="inline-flex w-full cursor-pointer items-center gap-2"
            >
              GitHub
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link
              href="/nearvault-tos.pdf"
              target="_blank"
              className="inline-flex w-full cursor-pointer items-center gap-2"
            >
              Terms of Service
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link
              href="/privacy.pdf"
              target="_blank"
              className="inline-flex w-full cursor-pointer items-center gap-2"
            >
              Privacy Policy
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateTeamDialog open={isOpen} onOpenChange={() => setIsOpen(false)} />
    </>
  );
}

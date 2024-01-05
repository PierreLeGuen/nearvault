import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";
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
import { useListTeams } from "~/hooks/teams";
import usePersistingStore from "~/store/useStore";
import { CreateTeamDialog } from "../dialogs/CreateTeamDialog";
import { Skeleton } from "../ui/skeleton";

export function TeamsDropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const { setCurrentTeam, currentTeam } = usePersistingStore();

  const { data: teams, isLoading } = useListTeams();

  if (isLoading) return <Skeleton className="h-8 rounded-none" />;

  const handleSignOut = async () => {
    await signOut();
    redirect("/");
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
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.teamId}
                onClick={() => setCurrentTeam(team)}
              >
                {team.team.name}
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

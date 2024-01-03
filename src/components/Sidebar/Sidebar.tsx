import {
  AdjustmentsVerticalIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  ArrowUturnDownIcon,
  BanknotesIcon,
  BookOpenIcon,
  ChevronDownIcon,
  EyeIcon,
  PlusCircleIcon,
  QueueListIcon,
} from "@heroicons/react/20/solid";
import { PieChartIcon } from "@radix-ui/react-icons";
import { useStoreActions, useStoreState } from "easy-peasy";
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
import { cn } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { CreateTeamDialog } from "../dialogs/create-team";
import { Skeleton } from "../ui/skeleton";
import { SelectAccount } from "./SelectAccount/SelectAccount";
import { WalletModal } from "./WalletModal/WalletModal";

export function Sidebar() {
  const iconsClasses = "mr-2 h-4 w-4";

  const selectedAccount = useStoreState(
    (state: any) => state.accounts.selected,
  );
  const openWalletModal = useStoreActions(
    (actions: any) => actions.wallets.modal.open,
  );

  return (
    <div className="sticky top-0 flex h-screen w-[275px] flex-col justify-between gap-3 border-r-2">
      <div className="flex flex-col">
        <TeamsDropdownMenu />
        <SidebarSection>
          <SidebarSectionHeader>Treasury</SidebarSectionHeader>
          <SidebarSectionBody>
            <SidebarSectionItem href="/lockup/create">
              <BanknotesIcon className={iconsClasses} />
              Create lockup
            </SidebarSectionItem>
            <SidebarSectionItem href="/lockup/manage">
              <EyeIcon className={iconsClasses} />
              Manage lockup
            </SidebarSectionItem>
            <SidebarSectionItem href="/staking/stake">
              <ArrowUpTrayIcon className={iconsClasses} />
              Stake
            </SidebarSectionItem>
            <SidebarSectionItem href="/staking/unstake">
              <ArrowUturnDownIcon className={iconsClasses} />
              Unstake
            </SidebarSectionItem>
            <SidebarSectionItem href="/staking/withdraw">
              <ArrowDownTrayIcon className={iconsClasses} />
              Withdraw
            </SidebarSectionItem>
          </SidebarSectionBody>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionHeader>Payments</SidebarSectionHeader>
          <SidebarSectionBody>
            <SidebarSectionItem href="/payments/transfers">
              <ArrowUpTrayIcon className={iconsClasses} />
              Transfers
            </SidebarSectionItem>
            <SidebarSectionItem href="/payments/history">
              <ArchiveBoxIcon className={iconsClasses} />
              History
            </SidebarSectionItem>
            <SidebarSectionItem href="/beneficiary/manage">
              <BookOpenIcon className={iconsClasses} />
              Address Book
            </SidebarSectionItem>
          </SidebarSectionBody>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionHeader>Approvals</SidebarSectionHeader>
          <SidebarSectionBody>
            <SidebarSectionItem href="/approval/pending">
              <QueueListIcon className={iconsClasses} /> Pending requests
            </SidebarSectionItem>
            <SidebarSectionItem href="/approval/manage">
              <AdjustmentsVerticalIcon className={iconsClasses} /> Manage
              wallets
            </SidebarSectionItem>
            <SidebarSectionItem href="/approval/create">
              <PlusCircleIcon className={iconsClasses} /> Create multisig
              wallets
            </SidebarSectionItem>
          </SidebarSectionBody>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionHeader>Accounting</SidebarSectionHeader>
          <SidebarSectionBody>
            <SidebarSectionItem href={"/accounting/tta"}>
              <PieChartIcon className={iconsClasses} /> Reports
            </SidebarSectionItem>
          </SidebarSectionBody>
        </SidebarSection>
      </div>

      {selectedAccount ? (
        <SelectAccount openWalletModal={openWalletModal} />
      ) : (
        <Button onClick={openWalletModal}>Connect Account</Button>
      )}

      <WalletModal />
    </div>
  );
}

function SidebarSection({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-2">{children}</div>;
}

function SidebarSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
      {children}
    </h2>
  );
}

function SidebarSectionBody({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function SidebarSectionItem({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Button variant="ghost" className={cn("w-full justify-start", className)}>
        {children}
      </Button>
    </Link>
  );
}

function TeamsDropdownMenu() {
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
            {currentTeam.name}
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

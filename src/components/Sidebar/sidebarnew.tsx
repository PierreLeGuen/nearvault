import {
  AdjustmentsVerticalIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
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
import Link from "next/link";
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
import { api } from "~/lib/api";
import { cn } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const iconsClasses = "mr-2 h-4 w-4";

  return (
    <div className={cn("border-r-2 pb-12", className)}>
      <DropdownMenuDemo />
      <div className="space-y-4 py-4">
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

function DropdownMenuDemo() {
  const { setCurrentTeam, currentTeam, resetTeams, resetWallet } =
    usePersistingStore();

  const { data: teams, isLoading } = api.teams.getTeamsForUser.useQuery();

  if (isLoading) return null;

  return (
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
          <DropdownMenuItem>New Team</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>GitHub</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

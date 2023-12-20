import {
  AdjustmentsVerticalIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowUturnDownIcon,
  BanknotesIcon,
  BookOpenIcon,
  EyeIcon,
  PlusCircleIcon,
  QueueListIcon,
} from "@heroicons/react/20/solid";
import { PieChartIcon } from "@radix-ui/react-icons";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const iconsClasses = "mr-2 h-4 w-4";

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <SidebarSection>
          <SidebarSectionHeader>Treasury</SidebarSectionHeader>
          <SidebarSectionBody>
            <SidebarSectionItem>
              <BanknotesIcon className={iconsClasses} />
              Create lockup
            </SidebarSectionItem>
            <SidebarSectionItem>
              <EyeIcon className={iconsClasses} />
              Manage lockup
            </SidebarSectionItem>
            <SidebarSectionItem>
              <ArrowUpTrayIcon className={iconsClasses} />
              Stake
            </SidebarSectionItem>
            <SidebarSectionItem>
              <ArrowUturnDownIcon className={iconsClasses} />
              Unstake
            </SidebarSectionItem>
            <SidebarSectionItem>
              <ArrowDownTrayIcon className={iconsClasses} />
              Withdraw
            </SidebarSectionItem>
          </SidebarSectionBody>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionHeader>Payments</SidebarSectionHeader>
          <SidebarSectionBody>
            <SidebarSectionItem>
              <ArrowUpTrayIcon className={iconsClasses} />
              Transfers
            </SidebarSectionItem>
            <SidebarSectionItem>
              <ArchiveBoxIcon className={iconsClasses} />
              History
            </SidebarSectionItem>
            <SidebarSectionItem>
              <BookOpenIcon className={iconsClasses} />
              Address Book
            </SidebarSectionItem>
          </SidebarSectionBody>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionHeader>Approvals</SidebarSectionHeader>
          <SidebarSectionBody>
            <SidebarSectionItem>
              <QueueListIcon className={iconsClasses} /> Pending requests
            </SidebarSectionItem>
            <SidebarSectionItem>
              <AdjustmentsVerticalIcon className={iconsClasses} /> Manage
              wallets
            </SidebarSectionItem>
            <SidebarSectionItem>
              <PlusCircleIcon className={iconsClasses} /> Create multisig
              wallets
            </SidebarSectionItem>
          </SidebarSectionBody>
        </SidebarSection>

        <SidebarSection>
          <SidebarSectionHeader>Accounting</SidebarSectionHeader>
          <SidebarSectionBody>
            <SidebarSectionItem>
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button variant="ghost" className={cn("w-full justify-start", className)}>
      {children}
    </Button>
  );
}

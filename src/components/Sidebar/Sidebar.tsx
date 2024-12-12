import {
  AdjustmentsVerticalIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ArrowUpTrayIcon,
  ArrowUturnDownIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  BookOpenIcon,
  EyeIcon,
  PlusCircleIcon,
  QueueListIcon,
} from "@heroicons/react/20/solid";
import { PieChartIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { type ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { TeamsDropdownMenu } from "./TeamsDropdownMenu";

export function Sidebar() {
  const wsStore = useWalletTerminator();

  const iconsClasses = "mr-2 h-4 w-4";

  return (
    <>
      <div className="sticky top-0 flex h-screen w-[275px] flex-col justify-between gap-3 border-r-2">
        <div className="flex flex-col">
          <TeamsDropdownMenu />
          {/* <SidebarSection>
            <SidebarSectionItem href="/dashboard">
              <DashboardIcon className={iconsClasses} />
              Dashboard
            </SidebarSectionItem>
          </SidebarSection> */}

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
            <SidebarSectionHeader>DeFi</SidebarSectionHeader>
            <SidebarSectionBody>
              <SidebarSectionItem href="/defi/swap">
                <ArrowsRightLeftIcon className={iconsClasses} />
                Swap
              </SidebarSectionItem>
              <SidebarSectionItem href="/defi/pools">
                <ArrowUpTrayIcon className={iconsClasses} />
                Pools deposit
              </SidebarSectionItem>
              <SidebarSectionItem href="/defi/stable">
                <ArrowUpTrayIcon className={iconsClasses} />
                Ref Stable deposit
              </SidebarSectionItem>
              <SidebarSectionItem href="/defi/withdraw">
                <ArrowDownTrayIcon className={iconsClasses} />
                Withdraw
              </SidebarSectionItem>
              <SidebarSectionItem href="/defi/claim">
                <ArrowTrendingUpIcon className={iconsClasses} />
                Rewards claim
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
        <div className="flex flex-col p-2">
          <Button onClick={wsStore.openModal}>Wallet manager...</Button>
        </div>
      </div>
    </>
  );
}

function SidebarSection({ children }: { children: ReactNode }) {
  return <div className="px-3 py-2">{children}</div>;
}

function SidebarSectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
      {children}
    </h2>
  );
}

function SidebarSectionBody({ children }: { children: ReactNode }) {
  return <div className="space-y-1">{children}</div>;
}

function SidebarSectionItem({
  children,
  className,
  href,
}: {
  children: ReactNode;
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

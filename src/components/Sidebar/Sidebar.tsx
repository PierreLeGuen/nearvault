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
import { useStoreActions, useStoreState } from "easy-peasy";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { SelectAccount } from "./SelectAccount/SelectAccount";
import { TeamsDropdownMenu } from "./TeamsDropdownMenu";
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
    <>
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
      </div>
      <WalletModal />
    </>
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

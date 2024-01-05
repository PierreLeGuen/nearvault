// @ts-nocheck
import { useStoreActions, useStoreState } from "easy-peasy";
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

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  openWalletModal: () => void;
}

export const SelectAccountDropdown = ({
  className,
  openWalletModal,
}: Props) => {
  const accountsList = useStoreState((state) => state.accounts.list);
  const selected = useStoreState((state) => state.accounts.selected);
  const selectAccount = useStoreActions(
    (actions) => actions.accounts.selectAccount,
  );

  const handleSelectAccount = (accountId: string) => {
    selectAccount(accountId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={className}>{selected.accountId}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Switch wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {accountsList.map((accountId) => (
            <DropdownMenuItem
              key={accountId}
              onClick={() => handleSelectAccount(accountId)}
            >
              {accountId}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openWalletModal}>
          Add wallet...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

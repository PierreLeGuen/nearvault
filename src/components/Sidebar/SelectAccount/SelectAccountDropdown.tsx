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
import { useStoreActions, useStoreState } from "~/store-easy-peasy/hooks";
import type { OpenFn } from "~/store-easy-peasy/slices/wallets/slices/modal/types";

type Props = {
  openWalletModal: OpenFn;
  className: string;
};

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
        <DropdownMenuItem onClick={() => openWalletModal()}>
          Add wallet...
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openWalletModal()}>
          Log out from wallet(s)...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Button } from '@mui/material';
import { useStoreState, useStoreActions } from 'easy-peasy';
import cn from './SelectAccount.module.css';
import { useEffect } from 'react';

const blur = () => {
  setTimeout(() => {
    document.activeElement.blur();
  }, 0);
}

export const SelectAccount = ({ openWalletModal }) => {
  const accounts = useStoreState((state) => state.accounts);
  const isWalletModalOpen = useStoreState((state) => state.walletsConnector.modal.isOpen);
  const selectedAccount = useStoreState((state) => state.selectedAccount);
  const selectAccount = useStoreActions((actions) => actions.selectAccount);
  const [open, setOpen] = React.useState(false);

  const handleChange = (event) => {
    selectAccount(event.target.value);
    blur();
  };

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    blur();
  };

  useEffect(() => {
    if (isWalletModalOpen) handleClose();
  }, [isWalletModalOpen]);

  return (
    <Select
      value={selectedAccount.accountId}
      onChange={handleChange}
      sx={{ width: 300 }}
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
    >
      {accounts.map((account) => (
        <MenuItem key={account.accountId} value={account.accountId}>
          {account.accountId}
        </MenuItem>
      ))}
      <div className={cn.addAccountContainer}>
        <Button variant="outlined" onClick={openWalletModal}>
          Add Account
        </Button>
      </div>
    </Select>
  );
};

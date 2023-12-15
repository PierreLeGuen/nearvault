import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { Button } from "@mui/material";
import { useStoreState, useStoreActions } from "easy-peasy";
import cn from "./SelectAccount.module.css";
import { useEffect } from "react";

const blur = () => {
  setTimeout(() => {
    // @ts-ignore
    document.activeElement.blur();
  }, 0);
};

export const SelectAccount = ({ openWalletModal }) => {
  const accountsList = useStoreState((state) => state.accounts.list);
  const isOpen = useStoreState((state) => state.wallets.modal.isOpen);
  const selected = useStoreState((state) => state.accounts.selected);
  const selectAccount = useStoreActions((actions) => actions.accounts.selectAccount);
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
    if (isOpen) handleClose();
  }, [isOpen]);

  return (
    <Select
      value={selected.accountId}
      onChange={handleChange}
      sx={{ width: 300 }}
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
    >
      {accountsList.map((accountId) => (
        <MenuItem key={accountId} value={accountId}>
          {accountId}
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

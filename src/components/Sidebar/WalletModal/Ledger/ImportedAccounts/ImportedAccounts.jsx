import { Button } from '@mui/material';
import Image from 'next/image';
import { CloseButton } from '../../general/CloseButton/CloseButton.jsx';
import { Header } from '../../general/Header/Header.jsx';
import img from '../../../../../../public/account.png';
import cn from './ImportedAccounts.module.css';

export const ImportedAccounts = ({ routeParams, closeModal }) => {
  const accounts = routeParams?.accounts;
  const isSingleAccount = accounts?.length === 1;

  return (
    <>
      <Header>Your {isSingleAccount ? 'Account' : 'Accounts'}</Header>
      <CloseButton />
      <div className={cn.content}>
        <Image src={img} alt="Account picture" className={cn.img} />
        <p className={cn.text}>
          We found the following Multisig {isSingleAccount ? 'account' : 'accounts'} associated with
          your Ledger:
        </p>
        {routeParams?.accounts.map(({ accountId }) => (
          <p key={accountId} className={cn.account}>
            {accountId}
          </p>
        ))}
        <Button variant="outlined" onClick={closeModal} className={cn.closeButton}>
          Close
        </Button>
      </div>
    </>
  );
};

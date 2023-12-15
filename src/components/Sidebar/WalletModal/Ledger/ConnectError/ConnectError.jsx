import { Button } from '@mui/material';
import { BackButton } from '../../general/BackButton/BackButton.jsx';
import { Header } from '../../general/Header/Header.jsx';
import { CloseButton } from '../../general/CloseButton/CloseButton.jsx';
import { useStoreActions } from 'easy-peasy';
import cn from './ConnectError.module.css';
import { LedgerDeviceIcon } from '../../general/icons/LedgerDeviceIcon.tsx';

export const ConnectError = ({ routeParams }) => {
  const { message } = routeParams?.error;
  const connect = useStoreActions((state) => state.wallets.ledger.connect);

  return (
    <>
      <BackButton to="/ledger/connect" />
      <Header>Connection Failed</Header>
      <CloseButton />
      <div className={cn.content}>
        <LedgerDeviceIcon className={cn.icon}/>
        <p className={cn.error}>{message}</p>
        <Button variant="outlined" onClick={connect} className={cn.retryButton}>
          Retry
        </Button>
      </div>

    </>
  );
};

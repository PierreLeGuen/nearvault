import { Header } from '../../general/Header/Header.jsx';
import { CloseButton } from '../../general/CloseButton/CloseButton.jsx';
import { LedgerDeviceIcon } from '../../general/icons/LedgerDeviceIcon.tsx';
import cn from './SignTxError.module.css';
import { Button } from '@mui/material';

export const SignTxError = ({ routeParams }) => {
  const { error, retrySignTxFn } = routeParams;
  console.log(retrySignTxFn);
  return (
    <>
      <Header>Error</Header>
      <CloseButton />
      <div className={cn.content}>
        <LedgerDeviceIcon className={cn.icon} />
        <p className={cn.error}>{error.message}</p>
        <Button variant="outlined" onClick={retrySignTxFn} className={cn.retryButton}>
          Retry
        </Button>
      </div>
    </>
  )
}



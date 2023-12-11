import { Header } from '../../general/Header/Header.jsx';
import { CloseButton } from '../../general/CloseButton/CloseButton.jsx';
import { LedgerDeviceIcon } from '../../general/icons/LedgerDeviceIcon.tsx';
import Progress from '@mui/material/CircularProgress';
import cn from './SignTxProgress.module.css';

export const SignTxProgress = () => (
  <>
    <Header>Sign Transaction</Header>
    <CloseButton />
    <div className={cn.content}>
      <LedgerDeviceIcon className={cn.icon} />
      <div className={cn.progressWrapper}>
        <Progress size={24} />
        <span>Connecting to ledger...</span>
      </div>
      <p className={cn.title}>Confirm the request on your ledger device</p>
    </div>
  </>
);
